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
      // Verificar si Redis está configurado
      if (!process.env.REDIS_URL) {
        console.log('⚠️ Redis no configurado, usando almacenamiento en memoria');
        this.isConnected = false;
        this.memoryStore = new Map(); // Fallback a memoria
        return;
      }

      this.client = redis.createClient({
        url: process.env.REDIS_URL
      });

      this.client.on('error', (err) => {
        console.error('❌ Error de Redis:', err);
        this.isConnected = false;
        // Fallback a memoria en caso de error
        if (!this.memoryStore) {
          this.memoryStore = new Map();
        }
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
      console.error('❌ Error conectando a Redis, usando almacenamiento en memoria:', error);
      this.isConnected = false;
      this.memoryStore = new Map(); // Fallback a memoria
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
    if (this.isConnected) {
      const key = `whatsapp_session:${userId}`;
      await this.client.setEx(key, 86400 * 7, JSON.stringify(sessionData)); // 7 días
    } else {
      // Usar almacenamiento en memoria
      if (!this.memoryStore) {
        this.memoryStore = new Map();
      }
      this.memoryStore.set(`whatsapp_session:${userId}`, {
        data: sessionData,
        expires: Date.now() + (86400 * 7 * 1000) // 7 días
      });
    }
  }

  /**
   * Obtener sesión de WhatsApp
   * @param {string} userId - ID del usuario
   * @returns {Object|null} - Datos de la sesión
   */
  async getWhatsAppSession(userId) {
    if (this.isConnected) {
      const key = `whatsapp_session:${userId}`;
      const sessionData = await this.client.get(key);
      return sessionData ? JSON.parse(sessionData) : null;
    } else {
      // Usar almacenamiento en memoria
      if (!this.memoryStore) {
        return null;
      }
      const stored = this.memoryStore.get(`whatsapp_session:${userId}`);
      if (stored && stored.expires > Date.now()) {
        return stored.data;
      }
      return null;
    }
  }

  /**
   * Eliminar sesión de WhatsApp
   * @param {string} userId - ID del usuario
   */
  async deleteWhatsAppSession(userId) {
    if (this.isConnected) {
      const key = `whatsapp_session:${userId}`;
      await this.client.del(key);
    } else {
      if (this.memoryStore) {
        this.memoryStore.delete(`whatsapp_session:${userId}`);
      }
    }
  }

  /**
   * Guardar QR temporal
   * @param {string} userId - ID del usuario
   * @param {string} qrData - Datos del QR en base64
   */
  async saveQRCode(userId, qrData) {
    if (this.isConnected) {
      const key = `whatsapp_qr:${userId}`;
      await this.client.setEx(key, 300, qrData); // 5 minutos
    } else {
      if (!this.memoryStore) {
        this.memoryStore = new Map();
      }
      this.memoryStore.set(`whatsapp_qr:${userId}`, {
        data: qrData,
        expires: Date.now() + (300 * 1000) // 5 minutos
      });
    }
  }

  /**
   * Obtener QR temporal
   * @param {string} userId - ID del usuario
   * @returns {string|null} - Datos del QR
   */
  async getQRCode(userId) {
    if (this.isConnected) {
      const key = `whatsapp_qr:${userId}`;
      return await this.client.get(key);
    } else {
      if (!this.memoryStore) {
        return null;
      }
      const stored = this.memoryStore.get(`whatsapp_qr:${userId}`);
      if (stored && stored.expires > Date.now()) {
        return stored.data;
      }
      return null;
    }
  }

  /**
   * Eliminar QR temporal
   * @param {string} userId - ID del usuario
   */
  async deleteQRCode(userId) {
    if (this.isConnected) {
      const key = `whatsapp_qr:${userId}`;
      await this.client.del(key);
    } else {
      if (this.memoryStore) {
        this.memoryStore.delete(`whatsapp_qr:${userId}`);
      }
    }
  }

  /**
   * Guardar estado de conexión
   * @param {string} userId - ID del usuario
   * @param {string} status - Estado de la conexión
   */
  async saveConnectionStatus(userId, status) {
    if (this.isConnected) {
      const key = `whatsapp_status:${userId}`;
      await this.client.setEx(key, 3600, status); // 1 hora
    } else {
      if (!this.memoryStore) {
        this.memoryStore = new Map();
      }
      this.memoryStore.set(`whatsapp_status:${userId}`, {
        data: status,
        expires: Date.now() + (3600 * 1000) // 1 hora
      });
    }
  }

  /**
   * Obtener estado de conexión
   * @param {string} userId - ID del usuario
   * @returns {string|null} - Estado de la conexión
   */
  async getConnectionStatus(userId) {
    if (this.isConnected) {
      const key = `whatsapp_status:${userId}`;
      return await this.client.get(key);
    } else {
      if (!this.memoryStore) {
        return null;
      }
      const stored = this.memoryStore.get(`whatsapp_status:${userId}`);
      if (stored && stored.expires > Date.now()) {
        return stored.data;
      }
      return null;
    }
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
