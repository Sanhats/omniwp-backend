const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Servicio de WebSockets para sincronización en tiempo real
 * Maneja conexiones de usuarios y emite eventos de WhatsApp
 */
class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.setupSocketHandlers();
  }

  /**
   * Configurar manejadores de Socket.io
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 Cliente conectado:', socket.id);

      // Manejar autenticación
      socket.on('authenticate', (data) => {
        try {
          const { token } = data;
          const decoded = jwt.verify(token, config.jwt.secret);
          
          // Guardar asociación usuario-socket
          this.connectedUsers.set(decoded.userId, socket.id);
          socket.userId = decoded.userId;
          
          // Unir a sala del usuario
          socket.join(`user_${decoded.userId}`);
          
          console.log(`✅ Usuario autenticado: ${decoded.userId} (socket: ${socket.id})`);
          
          socket.emit('authenticated', {
            success: true,
            userId: decoded.userId
          });

        } catch (error) {
          console.error('❌ Error de autenticación WebSocket:', error);
          socket.emit('auth_error', {
            success: false,
            message: 'Token inválido'
          });
        }
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`👤 Usuario ${socket.userId} desconectado`);
        }
      });

      // Manejar suscripción a eventos de WhatsApp
      socket.on('subscribe_whatsapp', () => {
        if (socket.userId) {
          socket.join(`whatsapp_${socket.userId}`);
          console.log(`📱 Usuario ${socket.userId} suscrito a eventos de WhatsApp`);
        }
      });

      // Manejar desuscripción de eventos de WhatsApp
      socket.on('unsubscribe_whatsapp', () => {
        if (socket.userId) {
          socket.leave(`whatsapp_${socket.userId}`);
          console.log(`📱 Usuario ${socket.userId} desuscrito de eventos de WhatsApp`);
        }
      });
    });
  }

  /**
   * Emitir evento de cambio de estado de WhatsApp
   * @param {string} userId - ID del usuario
   * @param {Object} statusData - Datos del estado
   */
  emitWhatsAppStatusChange(userId, statusData) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`whatsapp_${userId}`).emit('whatsapp_status_change', {
        userId,
        ...statusData,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Estado WhatsApp emitido para usuario ${userId}:`, statusData);
    }
  }

  /**
   * Emitir evento de QR generado
   * @param {string} userId - ID del usuario
   * @param {string} qrCode - Código QR en base64
   */
  emitQRGenerated(userId, qrCode) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`whatsapp_${userId}`).emit('whatsapp_qr_generated', {
        userId,
        qrCode,
        timestamp: new Date().toISOString()
      });
      console.log(`📱 QR generado emitido para usuario ${userId}`);
    }
  }

  /**
   * Emitir evento de mensaje entrante
   * @param {string} userId - ID del usuario
   * @param {Object} messageData - Datos del mensaje
   */
  emitIncomingMessage(userId, messageData) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`whatsapp_${userId}`).emit('whatsapp_message_received', {
        userId,
        message: messageData,
        timestamp: new Date().toISOString()
      });
      console.log(`📨 Mensaje entrante emitido para usuario ${userId}:`, messageData);
    }
  }

  /**
   * Emitir evento de mensaje enviado
   * @param {string} userId - ID del usuario
   * @param {Object} messageData - Datos del mensaje
   */
  emitMessageSent(userId, messageData) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`whatsapp_${userId}`).emit('whatsapp_message_sent', {
        userId,
        message: messageData,
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Mensaje enviado emitido para usuario ${userId}:`, messageData);
    }
  }

  /**
   * Emitir evento de error de WhatsApp
   * @param {string} userId - ID del usuario
   * @param {Object} errorData - Datos del error
   */
  emitWhatsAppError(userId, errorData) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`whatsapp_${userId}`).emit('whatsapp_error', {
        userId,
        error: errorData,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Error WhatsApp emitido para usuario ${userId}:`, errorData);
    }
  }

  /**
   * Verificar si un usuario está conectado
   * @param {string} userId - ID del usuario
   * @returns {boolean} - True si está conectado
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Obtener número de usuarios conectados
   * @returns {number} - Número de usuarios conectados
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Obtener lista de usuarios conectados
   * @returns {Array} - Lista de IDs de usuarios conectados
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

// Crear instancia singleton
let socketServiceInstance = null;

/**
 * Inicializar servicio de Socket.io
 * @param {Object} io - Instancia de Socket.io
 * @returns {SocketService} - Instancia del servicio
 */
function initializeSocketService(io) {
  if (!socketServiceInstance) {
    socketServiceInstance = new SocketService(io);
  }
  return socketServiceInstance;
}

/**
 * Obtener instancia del servicio
 * @returns {SocketService|null} - Instancia del servicio
 */
function getSocketService() {
  return socketServiceInstance;
}

module.exports = initializeSocketService;
module.exports.getSocketService = getSocketService;
