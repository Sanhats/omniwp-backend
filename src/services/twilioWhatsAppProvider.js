const twilio = require('twilio');
const config = require('../config');

/**
 * Servicio para envío de mensajes WhatsApp vía Twilio
 */
class TwilioWhatsAppProvider {
  constructor() {
    this.client = null;
    this.fromNumber = config.twilio.whatsappNumber;
    
    // Inicializar cliente Twilio solo si hay credenciales
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
  }

  /**
   * Verificar si el servicio está configurado
   */
  isConfigured() {
    return this.client !== null && this.fromNumber !== null;
  }

  /**
   * Obtener estado de configuración
   */
  getConfigStatus() {
    return {
      hasClient: this.client !== null,
      hasFromNumber: this.fromNumber !== null,
      accountSid: config.twilio.accountSid ? '✅ Configurado' : '❌ No configurado',
      authToken: config.twilio.authToken ? '✅ Configurado' : '❌ No configurado',
      whatsappNumber: this.fromNumber || '❌ No configurado'
    };
  }

  /**
   * Reemplazar placeholders en el template
   * @param {string} template - Template con placeholders
   * @param {Object} variables - Variables para reemplazar
   * @returns {string} - Template con variables reemplazadas
   */
  replacePlaceholders(template, variables = {}) {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });
    
    return result;
  }

  /**
   * Enviar mensaje WhatsApp
   * @param {string} to - Número de destino (formato: whatsapp:+1234567890)
   * @param {string} template - Template del mensaje
   * @param {Object} variables - Variables para el template
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendTemplateMessage(to, template, variables = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Twilio WhatsApp no está configurado. Verifica las credenciales.');
      }

      // Reemplazar placeholders
      const messageBody = this.replacePlaceholders(template, variables);

      console.log('📱 Enviando WhatsApp:');
      console.log('   - To:', to);
      console.log('   - From:', this.fromNumber);
      console.log('   - Message:', messageBody);

      // Enviar mensaje vía Twilio
      const message = await this.client.messages.create({
        body: messageBody,
        from: this.fromNumber,
        to: to
      });

      console.log('✅ WhatsApp enviado exitosamente:', message.sid);

      return {
        success: true,
        providerMessageId: message.sid,
        status: message.status,
        errorCode: null,
        errorMessage: null
      };

    } catch (error) {
      console.error('❌ Error enviando WhatsApp:', error.message);
      
      return {
        success: false,
        providerMessageId: null,
        status: 'failed',
        errorCode: error.code || 'UNKNOWN_ERROR',
        errorMessage: error.message
      };
    }
  }

  /**
   * Validar número de WhatsApp
   * @param {string} phoneNumber - Número de teléfono
   * @returns {string} - Número formateado para WhatsApp
   */
  formatWhatsAppNumber(phoneNumber) {
    // Remover caracteres no numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Si no tiene código de país, agregar +54 (Argentina)
    if (cleanNumber.length === 10) {
      return `whatsapp:+54${cleanNumber}`;
    }
    
    // Si ya tiene código de país
    if (cleanNumber.length > 10) {
      return `whatsapp:+${cleanNumber}`;
    }
    
    throw new Error('Número de teléfono inválido');
  }
}

module.exports = TwilioWhatsAppProvider;
