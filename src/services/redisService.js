const redis = require('redis');
const config = require('../config');

/**
 * Servicio para manejo de Redis
 * Almacena sesiones de WhatsApp y datos temporales
 */
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Conectar a Redis
   */
  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('❌ Error de Redis:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Conectado a Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('⚠️ Desconectado de Redis');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Error conectando a Redis:', error);
      throw error;
    }
  }

  /**
   * Desconectar de Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Guardar sesión de WhatsApp
   * @param {string} userId - ID del usuario
   * @param {Object} sessionData - Datos de la sesión
   */
  async saveWhatsAppSession(userId, sessionData) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_session:${userId}`;
    await this.client.setEx(key, 86400 * 7, JSON.stringify(sessionData)); // 7 días
  }

  /**
   * Obtener sesión de WhatsApp
   * @param {string} userId - ID del usuario
   * @returns {Object|null} - Datos de la sesión
   */
  async getWhatsAppSession(userId) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_session:${userId}`;
    const sessionData = await this.client.get(key);
    
    return sessionData ? JSON.parse(sessionData) : null;
  }

  /**
   * Eliminar sesión de WhatsApp
   * @param {string} userId - ID del usuario
   */
  async deleteWhatsAppSession(userId) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_session:${userId}`;
    await this.client.del(key);
  }

  /**
   * Guardar QR temporal
   * @param {string} userId - ID del usuario
   * @param {string} qrData - Datos del QR en base64
   */
  async saveQRCode(userId, qrData) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_qr:${userId}`;
    await this.client.setEx(key, 300, qrData); // 5 minutos
  }

  /**
   * Obtener QR temporal
   * @param {string} userId - ID del usuario
   * @returns {string|null} - Datos del QR
   */
  async getQRCode(userId) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_qr:${userId}`;
    return await this.client.get(key);
  }

  /**
   * Eliminar QR temporal
   * @param {string} userId - ID del usuario
   */
  async deleteQRCode(userId) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_qr:${userId}`;
    await this.client.del(key);
  }

  /**
   * Guardar estado de conexión
   * @param {string} userId - ID del usuario
   * @param {string} status - Estado de la conexión
   */
  async saveConnectionStatus(userId, status) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_status:${userId}`;
    await this.client.setEx(key, 3600, status); // 1 hora
  }

  /**
   * Obtener estado de conexión
   * @param {string} userId - ID del usuario
   * @returns {string|null} - Estado de la conexión
   */
  async getConnectionStatus(userId) {
    if (!this.isConnected) {
      throw new Error('Redis no está conectado');
    }

    const key = `whatsapp_status:${userId}`;
    return await this.client.get(key);
  }

  /**
   * Verificar si Redis está conectado
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected;
  }
}

module.exports = RedisService;
