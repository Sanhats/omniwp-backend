const WhatsAppWebService = require('../services/whatsappWebService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const whatsappService = new WhatsAppWebService();

/**
 * Controlador para endpoints de WhatsApp Web
 */
class WhatsAppController {
  constructor() {
    // Inicializar servicio al crear el controlador
    this.initializeService();
  }

  /**
   * Inicializar el servicio de WhatsApp
   */
  async initializeService() {
    try {
      await whatsappService.initialize();
    } catch (error) {
      console.error('❌ Error inicializando WhatsAppService:', error);
    }
  }

  /**
   * POST /whatsapp/connect
   * Crear nueva sesión de WhatsApp para el usuario
   */
  async connect(req, res) {
    try {
      console.log('🔐 req.user completo:', JSON.stringify(req.user, null, 2));
      console.log('🔐 req.user.id:', req.user?.id);
      console.log('🔐 req.user.userId:', req.user?.userId);
      
      const userId = req.user?.id || req.user?.userId; // Obtener del middleware de auth

      console.log(`🔌 Conectando WhatsApp para usuario: ${userId}`);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no identificado en la petición'
        });
      }

      console.log('📱 Iniciando creación de sesión WhatsApp...');
      // Crear nueva sesión
      const result = await whatsappService.createSession(userId);
      console.log('📱 Resultado de creación de sesión:', result);

      if (result.success) {
        console.log('✅ Sesión creada exitosamente');
        
        // Intentar obtener QR code, pero no esperar si no está disponible
        let qrCode = null;
        if (result.status === 'qr_generated') {
          console.log('📱 Intentando obtener QR code...');
          try {
            qrCode = await whatsappService.getQRCode(userId);
            console.log('📱 QR code obtenido:', qrCode ? 'Sí' : 'No');
          } catch (error) {
            console.log('📱 QR code no disponible aún, se generará pronto');
            qrCode = null;
          }
        }

        const response = {
          success: true,
          status: result.status,
          message: result.message,
          qrCode: qrCode
        };
        
        console.log('📤 Enviando respuesta exitosa:', JSON.stringify(response, null, 2));
        res.json(response);
      } else {
        console.log('❌ Error en creación de sesión:', result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Error en connect:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /whatsapp/status
   * Obtener estado de conexión de WhatsApp del usuario
   */
  async getStatus(req, res) {
    try {
      const { userId } = req.user;

      console.log(`📊 Obteniendo estado WhatsApp para usuario: ${userId}`);

      const status = await whatsappService.getConnectionStatus(userId);
      const qrCode = await whatsappService.getQRCode(userId);

      res.json({
        success: true,
        ...status,
        qrCode: qrCode
      });

    } catch (error) {
      console.error('❌ Error en getStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /whatsapp/disconnect
   * Desconectar sesión de WhatsApp del usuario
   */
  async disconnect(req, res) {
    try {
      const { userId } = req.user;

      console.log(`🔌 Desconectando WhatsApp para usuario: ${userId}`);

      const result = await whatsappService.disconnectSession(userId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          status: result.status
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Error en disconnect:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /whatsapp/restore
   * Restaurar sesión existente de WhatsApp
   */
  async restore(req, res) {
    try {
      const { userId } = req.user;

      console.log(`🔄 Restaurando sesión WhatsApp para usuario: ${userId}`);

      const result = await whatsappService.restoreSession(userId);

      if (result.success) {
        // Si se está restaurando, obtener QR si es necesario
        let qrCode = null;
        if (result.status === 'qr_generated') {
          qrCode = await whatsappService.getQRCode(userId);
        }

        res.json({
          success: true,
          status: result.status,
          message: result.message,
          qrCode: qrCode
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Error en restore:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /whatsapp/send
   * Enviar mensaje directo a través de WhatsApp Web
   */
  async sendMessage(req, res) {
    try {
      const { userId } = req.user;
      const { clientNumber, text } = req.body;

      // Validar datos
      if (!clientNumber || !text) {
        return res.status(400).json({
          success: false,
          message: 'clientNumber y text son requeridos'
        });
      }

      console.log(`📤 Enviando mensaje WhatsApp desde usuario ${userId} a ${clientNumber}`);

      // Verificar que el usuario tenga sesión activa
      if (!whatsappService.hasActiveSession(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene sesión de WhatsApp activa'
        });
      }

      // Enviar mensaje
      const result = await whatsappService.sendMessage(userId, clientNumber, text);

      // Guardar mensaje en la base de datos
      const messageRecord = await prisma.message.create({
        data: {
          userId: userId,
          channel: 'whatsapp',
          direction: 'outbound',
          provider: 'whatsapp_web',
          providerMessageId: result.messageId,
          text: text,
          status: result.status
        }
      });

      res.json({
        success: true,
        messageId: messageRecord.id,
        providerMessageId: result.messageId,
        status: result.status
      });

    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /whatsapp/info
   * Obtener información del cliente WhatsApp conectado
   */
  async getInfo(req, res) {
    try {
      const { userId } = req.user;

      const clientInfo = whatsappService.getClientInfo(userId);

      if (!clientInfo) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene sesión de WhatsApp activa'
        });
      }

      res.json({
        success: true,
        info: {
          phoneNumber: clientInfo.wid.user,
          name: clientInfo.pushname,
          platform: clientInfo.platform
        }
      });

    } catch (error) {
      console.error('❌ Error en getInfo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /whatsapp/qr
   * Obtener QR code de WhatsApp (si está disponible)
   */
  async getQR(req, res) {
    try {
      const { userId } = req.user;

      console.log(`📱 Obteniendo QR para usuario: ${userId}`);

      const qrCode = await whatsappService.getQRCode(userId);
      const status = await whatsappService.getConnectionStatus(userId);

      res.json({
        success: true,
        qrCode: qrCode,
        status: status.status,
        connected: status.connected
      });

    } catch (error) {
      console.error('❌ Error en getQR:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /whatsapp/messages
   * Obtener historial de mensajes de WhatsApp del usuario
   */
  async getMessages(req, res) {
    try {
      const { userId } = req.user;
      const { limit = 50, offset = 0 } = req.query;

      console.log(`📨 Obteniendo mensajes WhatsApp para usuario: ${userId}`);

      const messages = await prisma.message.findMany({
        where: {
          userId: userId,
          channel: 'whatsapp',
          provider: 'whatsapp_web'
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      res.json({
        success: true,
        messages: messages,
        total: messages.length
      });

    } catch (error) {
      console.error('❌ Error en getMessages:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new WhatsAppController();
