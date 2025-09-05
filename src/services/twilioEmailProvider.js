const sgMail = require('@sendgrid/mail');
const config = require('../config');

/**
 * Servicio para envío de emails vía SendGrid
 */
class TwilioEmailProvider {
  constructor() {
    this.fromEmail = config.sendgrid.fromEmail;
    this.fromName = config.sendgrid.fromName;
    
    // Configurar SendGrid solo si hay API key
    if (config.sendgrid.apiKey) {
      sgMail.setApiKey(config.sendgrid.apiKey);
    }
  }

  /**
   * Verificar si el servicio está configurado
   */
  isConfigured() {
    return config.sendgrid.apiKey !== null && config.sendgrid.apiKey !== undefined;
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
   * Enviar email
   * @param {string} to - Email de destino
   * @param {string} subject - Asunto del email
   * @param {string} template - Template del mensaje
   * @param {Object} variables - Variables para el template
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendEmail(to, subject, template, variables = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('SendGrid no está configurado. Verifica la API key.');
      }

      // Reemplazar placeholders
      const messageBody = this.replacePlaceholders(template, variables);
      const messageSubject = this.replacePlaceholders(subject, variables);

      console.log('📧 Enviando Email:');
      console.log('   - To:', to);
      console.log('   - From:', `${this.fromName} <${this.fromEmail}>`);
      console.log('   - Subject:', messageSubject);
      console.log('   - Body:', messageBody.substring(0, 100) + '...');

      // Configurar mensaje
      const msg = {
        to: to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: messageSubject,
        text: messageBody,
        html: this.convertToHtml(messageBody)
      };

      // Enviar email vía SendGrid
      const response = await sgMail.send(msg);

      console.log('✅ Email enviado exitosamente:', response[0].headers['x-message-id']);

      return {
        success: true,
        providerMessageId: response[0].headers['x-message-id'],
        status: 'sent',
        errorCode: null,
        errorMessage: null
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error.message);
      
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
   * Convertir texto plano a HTML básico
   * @param {string} text - Texto plano
   * @returns {string} - HTML básico
   */
  convertToHtml(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  /**
   * Validar email
   * @param {string} email - Email a validar
   * @returns {boolean} - Si el email es válido
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = TwilioEmailProvider;
