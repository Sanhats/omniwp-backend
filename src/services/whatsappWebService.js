const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const RedisService = require('./redisService');
const { PrismaClient } = require('@prisma/client');
const { getSocketService } = require('./socketService');

const prisma = new PrismaClient();
const redisService = new RedisService();

/**
 * Servicio para manejo de WhatsApp Web
 * Permite a cada usuario conectar su propio número de WhatsApp
 */
class WhatsAppWebService {
  constructor() {
    this.sessions = new Map(); // userId -> Client instance
    this.qrCodes = new Map(); // userId -> QR data
    this.connectionStatus = new Map(); // userId -> status
  }

  /**
   * Inicializar el servicio
   */
  async initialize() {
    try {
      await redisService.connect();
      if (redisService.isReady()) {
        console.log('✅ WhatsAppWebService inicializado con Redis');
      } else {
        console.log('⚠️ WhatsAppWebService inicializado sin Redis (modo limitado)');
      }
    } catch (error) {
      console.error('❌ Error inicializando WhatsAppWebService:', error);
      // No lanzar error, permitir que el servicio funcione sin Redis
      console.log('⚠️ Continuando sin Redis (modo limitado)');
    }
  }

  /**
   * Crear nueva sesión de WhatsApp para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la creación de sesión
   */
  async createSession(userId) {
    try {
      console.log(`📱 Creando sesión WhatsApp para usuario: ${userId}`);

      // Verificar si ya existe una sesión activa
      if (this.sessions.has(userId)) {
        const existingClient = this.sessions.get(userId);
        if (existingClient.info) {
          return {
            success: true,
            status: 'connected',
            message: 'Sesión ya existe y está conectada'
          };
        }
      }

      // Crear nueva instancia de WhatsApp
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `user_${userId}` // Identificador único por usuario
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // Configurar eventos
      this.setupClientEvents(client, userId);

      // Guardar sesión
      this.sessions.set(userId, client);
      this.connectionStatus.set(userId, 'initializing');

      console.log(`📱 Inicializando cliente WhatsApp para usuario ${userId}...`);
      
      // Inicializar cliente de forma asíncrona (no esperar a que termine)
      client.initialize().catch(error => {
        console.error(`❌ Error inicializando cliente para usuario ${userId}:`, error);
        this.connectionStatus.set(userId, 'error');
      });

      // Retornar inmediatamente - el QR se generará cuando esté listo
      return {
        success: true,
        status: 'qr_generated',
        message: 'Sesión creada, esperando escaneo de QR'
      };

    } catch (error) {
      console.error(`❌ Error creando sesión para usuario ${userId}:`, error);
      this.connectionStatus.set(userId, 'error');
      throw error;
    }
  }

  /**
   * Configurar eventos del cliente WhatsApp
   * @param {Client} client - Cliente de WhatsApp
   * @param {string} userId - ID del usuario
   */
  setupClientEvents(client, userId) {
    // Evento: QR generado
    client.on('qr', async (qr) => {
      console.log(`📱 QR generado para usuario ${userId}`);
      
      // Generar QR en terminal para debugging
      qrcode.generate(qr, { small: true });
      
      // Guardar QR en Redis
      await redisService.saveQRCode(userId, qr);
      this.qrCodes.set(userId, qr);
      this.connectionStatus.set(userId, 'qr_ready');

      // Emitir evento WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitQRGenerated(userId, qr);
      }
    });

    // Evento: Cliente listo
    client.on('ready', async () => {
      console.log(`✅ WhatsApp conectado para usuario ${userId}`);
      
      const clientInfo = client.info;
      const sessionData = {
        userId,
        phoneNumber: clientInfo.wid.user,
        name: clientInfo.pushname,
        connectedAt: new Date().toISOString()
      };

      // Guardar sesión en Redis
      await redisService.saveWhatsAppSession(userId, sessionData);
      await redisService.saveConnectionStatus(userId, 'connected');
      
      this.connectionStatus.set(userId, 'connected');
      
      // Limpiar QR
      await redisService.deleteQRCode(userId);
      this.qrCodes.delete(userId);

      // Emitir evento WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppStatusChange(userId, {
          status: 'connected',
          phoneNumber: clientInfo.wid.user,
          name: clientInfo.pushname
        });
      }
    });

    // Evento: Cliente autenticado
    client.on('authenticated', () => {
      console.log(`🔐 Usuario ${userId} autenticado en WhatsApp`);
      this.connectionStatus.set(userId, 'authenticated');
    });

    // Evento: Cliente desconectado
    client.on('disconnected', async (reason) => {
      console.log(`❌ WhatsApp desconectado para usuario ${userId}:`, reason);
      
      await redisService.saveConnectionStatus(userId, 'disconnected');
      this.connectionStatus.set(userId, 'disconnected');
      
      // Limpiar sesión
      this.sessions.delete(userId);

      // Emitir evento WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppStatusChange(userId, {
          status: 'disconnected',
          reason: reason
        });
      }
    });

    // Evento: Mensaje recibido
    client.on('message', async (message) => {
      await this.handleIncomingMessage(message, userId);
    });

    // Evento: Error de autenticación
    client.on('auth_failure', async (msg) => {
      console.error(`❌ Error de autenticación para usuario ${userId}:`, msg);
      await redisService.saveConnectionStatus(userId, 'auth_failed');
      this.connectionStatus.set(userId, 'auth_failed');

      // Emitir evento WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppError(userId, {
          type: 'auth_failure',
          message: msg
        });
      }
    });

    // Evento: Cambio de estado
    client.on('change_state', async (state) => {
      console.log(`🔄 Cambio de estado para usuario ${userId}:`, state);
      this.connectionStatus.set(userId, state);
      
      // Emitir cambio de estado via WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppStatusChange(userId, {
          status: state,
          message: `Estado cambiado a: ${state}`
        });
      }
    });

    // Evento: Pantalla de carga
    client.on('loading_screen', async (percent, message) => {
      console.log(`⏳ Cargando para usuario ${userId}: ${percent}% - ${message}`);
      
      // Emitir progreso via WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppStatusChange(userId, {
          status: 'loading',
          progress: percent,
          message: message
        });
      }
    });

    // Evento: Sesión restaurada
    client.on('session_restored', async () => {
      console.log(`🔄 Sesión restaurada para usuario ${userId}`);
      this.connectionStatus.set(userId, 'connected');
      
      // Emitir restauración via WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppStatusChange(userId, {
          status: 'restored',
          message: 'Sesión restaurada exitosamente'
        });
      }
    });

    // Evento: Error general del cliente
    client.on('error', async (error) => {
      console.error(`❌ Error en cliente WhatsApp para usuario ${userId}:`, error);
      this.connectionStatus.set(userId, 'error');
      
      // Emitir error via WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppError(userId, {
          type: 'client_error',
          message: error.message || 'Error desconocido',
          error: error
        });
      }
    });

    // Evento: Sesión remota guardada
    client.on('remote_session_saved', async () => {
      console.log(`💾 Sesión remota guardada para usuario ${userId}`);
    });

    // Evento: Logout
    client.on('logout', async () => {
      console.log(`🚪 Logout para usuario ${userId}`);
      this.connectionStatus.set(userId, 'logged_out');
      
      // Limpiar sesión
      await redisService.deleteWhatsAppSession(userId);
      this.sessions.delete(userId);
      
      // Emitir logout via WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitWhatsAppStatusChange(userId, {
          status: 'logged_out',
          message: 'Sesión cerrada'
        });
      }
    });
  }

  /**
   * Manejar mensaje entrante
   * @param {Object} message - Mensaje de WhatsApp
   * @param {string} userId - ID del usuario
   */
  async handleIncomingMessage(message, userId) {
    try {
      console.log(`📨 Mensaje entrante para usuario ${userId}:`, message.body);

      // Obtener información del remitente
      const contact = await message.getContact();
      const phoneNumber = contact.number;

      // Buscar cliente existente por número de teléfono
      let client = await prisma.client.findFirst({
        where: {
          userId: userId,
          phone: phoneNumber
        }
      });

      // Si no existe el cliente, crear uno automáticamente
      if (!client) {
        client = await prisma.client.create({
          data: {
            userId: userId,
            name: contact.name || 'WhatsApp User',
            phone: phoneNumber,
            notes: 'Cliente creado automáticamente desde WhatsApp'
          }
        });
        console.log(`👤 Cliente creado automáticamente: ${client.name}`);
      }

      // Guardar mensaje en la base de datos
      const messageRecord = await prisma.message.create({
        data: {
          userId: userId,
          clientId: client.id,
          channel: 'whatsapp',
          direction: 'inbound',
          provider: 'whatsapp_web',
          providerMessageId: message.id._serialized,
          text: message.body,
          status: 'received'
        }
      });

      console.log(`💾 Mensaje guardado: ${messageRecord.id}`);

      // Emitir evento WebSocket para notificar al frontend
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitIncomingMessage(userId, {
          id: messageRecord.id,
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          text: message.body,
          timestamp: messageRecord.createdAt
        });
      }

    } catch (error) {
      console.error(`❌ Error manejando mensaje entrante:`, error);
    }
  }

  /**
   * Restaurar sesión existente
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la restauración
   */
  async restoreSession(userId) {
    try {
      console.log(`🔄 Restaurando sesión para usuario: ${userId}`);

      // Verificar si ya hay una sesión activa
      if (this.sessions.has(userId)) {
        const client = this.sessions.get(userId);
        if (client.info) {
          return {
            success: true,
            status: 'connected',
            message: 'Sesión restaurada exitosamente'
          };
        }
      }

      // Verificar sesión en Redis
      const sessionData = await redisService.getWhatsAppSession(userId);
      if (!sessionData) {
        return {
          success: false,
          status: 'no_session',
          message: 'No hay sesión guardada'
        };
      }

      // Crear nueva instancia con la sesión guardada
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `user_${userId}`
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // Configurar eventos
      this.setupClientEvents(client, userId);

      // Guardar sesión
      this.sessions.set(userId, client);
      this.connectionStatus.set(userId, 'restoring');

      // Inicializar cliente
      await client.initialize();

      return {
        success: true,
        status: 'restoring',
        message: 'Restaurando sesión...'
      };

    } catch (error) {
      console.error(`❌ Error restaurando sesión para usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Desconectar sesión
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la desconexión
   */
  async disconnectSession(userId) {
    try {
      console.log(`🔌 Desconectando sesión para usuario: ${userId}`);

      // Obtener cliente
      const client = this.sessions.get(userId);
      if (!client) {
        return {
          success: false,
          status: 'not_connected',
          message: 'No hay sesión activa'
        };
      }

      // Desconectar cliente
      await client.destroy();

      // Limpiar datos
      this.sessions.delete(userId);
      this.qrCodes.delete(userId);
      this.connectionStatus.set(userId, 'disconnected');

      // Limpiar Redis
      await redisService.deleteWhatsAppSession(userId);
      await redisService.deleteQRCode(userId);
      await redisService.saveConnectionStatus(userId, 'disconnected');

      return {
        success: true,
        status: 'disconnected',
        message: 'Sesión desconectada exitosamente'
      };

    } catch (error) {
      console.error(`❌ Error desconectando sesión para usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Enviar mensaje
   * @param {string} userId - ID del usuario
   * @param {string} clientNumber - Número del cliente
   * @param {string} text - Texto del mensaje
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendMessage(userId, clientNumber, text) {
    try {
      console.log(`📤 Enviando mensaje desde usuario ${userId} a ${clientNumber}`);

      // Verificar que el usuario tenga sesión activa
      const client = this.sessions.get(userId);
      if (!client || !client.info) {
        throw new Error('Usuario no tiene sesión de WhatsApp activa');
      }

      // Formatear número de teléfono
      const formattedNumber = clientNumber.includes('@c.us') 
        ? clientNumber 
        : `${clientNumber}@c.us`;

      // Enviar mensaje
      const result = await client.sendMessage(formattedNumber, text);

      // Emitir evento WebSocket
      const socketService = getSocketService();
      if (socketService) {
        socketService.emitMessageSent(userId, {
          messageId: result.id._serialized,
          clientNumber: clientNumber,
          text: text,
          status: 'sent'
        });
      }

      return {
        success: true,
        messageId: result.id._serialized,
        status: 'sent'
      };

    } catch (error) {
      console.error(`❌ Error enviando mensaje:`, error);
      throw error;
    }
  }

  /**
   * Obtener estado de conexión
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Estado de la conexión
   */
  async getConnectionStatus(userId) {
    try {
      const status = this.connectionStatus.get(userId) || 'not_connected';
      const hasSession = this.sessions.has(userId);
      const qrCode = this.qrCodes.get(userId);

      return {
        userId,
        status,
        hasSession,
        qrCode: qrCode || null,
        connected: status === 'connected'
      };

    } catch (error) {
      console.error(`❌ Error obteniendo estado para usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener QR code
   * @param {string} userId - ID del usuario
   * @returns {Promise<string|null>} - QR code en base64
   */
  async getQRCode(userId) {
    try {
      // Primero verificar en memoria
      let qrCode = this.qrCodes.get(userId);
      
      // Si no está en memoria, verificar en Redis
      if (!qrCode) {
        qrCode = await redisService.getQRCode(userId);
      }

      return qrCode;

    } catch (error) {
      console.error(`❌ Error obteniendo QR para usuario ${userId}:`, error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene sesión activa
   * @param {string} userId - ID del usuario
   * @returns {boolean} - True si tiene sesión activa
   */
  hasActiveSession(userId) {
    const client = this.sessions.get(userId);
    return client && client.info;
  }

  /**
   * Obtener información del cliente WhatsApp
   * @param {string} userId - ID del usuario
   * @returns {Object|null} - Información del cliente
   */
  getClientInfo(userId) {
    const client = this.sessions.get(userId);
    return client && client.info ? client.info : null;
  }
}

module.exports = WhatsAppWebService;

// Crear instancia singleton
let whatsappServiceInstance = null;

/**
 * Obtener instancia singleton del servicio
 * @returns {WhatsAppWebService} - Instancia del servicio
 */
function getWhatsAppWebService() {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppWebService();
  }
  return whatsappServiceInstance;
}

/**
 * Inicializar servicio singleton
 * @returns {Promise<WhatsAppWebService>} - Instancia inicializada
 */
async function initializeWhatsAppWebService() {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppWebService();
    await whatsappServiceInstance.initialize();
  }
  return whatsappServiceInstance;
}

module.exports.getWhatsAppWebService = getWhatsAppWebService;
module.exports.initializeWhatsAppWebService = initializeWhatsAppWebService;