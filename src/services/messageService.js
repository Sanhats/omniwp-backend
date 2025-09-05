const { PrismaClient } = require('@prisma/client');
const TwilioWhatsAppProvider = require('./twilioWhatsAppProvider');
const TwilioEmailProvider = require('./twilioEmailProvider');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Servicio unificado para manejo de mensajes
 */
class MessageService {
  constructor() {
    this.whatsappProvider = new TwilioWhatsAppProvider();
    this.emailProvider = new TwilioEmailProvider();
  }

  /**
   * Enviar mensaje (WhatsApp o Email)
   * @param {Object} params - Parámetros del mensaje
   * @returns {Promise<Object>} - Resultado del envío
   */
  async sendMessage(params) {
    const {
      userId,
      clientId,
      orderId,
      channel,
      templateType,
      variables = {},
      subject = null
    } = params;

    try {
      console.log('📤 Enviando mensaje:', {
        userId,
        clientId,
        orderId,
        channel,
        templateType,
        variables
      });

      // Obtener cliente
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: userId
        }
      });

      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      // Obtener template
      const template = this.getTemplate(templateType, channel);
      if (!template) {
        throw new Error(`Template '${templateType}' no encontrado para canal '${channel}'`);
      }

      // Preparar variables
      const messageVariables = {
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        ...variables
      };

      // Si es un pedido, agregar información del pedido
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            userId: userId
          }
        });

        if (order) {
          messageVariables.orderDescription = order.description;
          messageVariables.orderStatus = order.status;
          messageVariables.orderDate = order.createdAt.toLocaleDateString('es-AR');
        }
      }

      // Crear registro de mensaje en la base de datos
      const messageRecord = await prisma.message.create({
        data: {
          userId,
          clientId,
          orderId,
          channel,
          direction: 'outbound',
          provider: 'twilio',
          templateType,
          variables: messageVariables,
          subject,
          text: template,
          status: 'queued'
        }
      });

      console.log('📝 Mensaje creado en BD:', messageRecord.id);

      // Enviar mensaje según el canal
      let sendResult;
      
      if (channel === 'whatsapp') {
        if (!client.phone) {
          throw new Error('Cliente no tiene número de teléfono');
        }
        
        const whatsappNumber = this.whatsappProvider.formatWhatsAppNumber(client.phone);
        sendResult = await this.whatsappProvider.sendTemplateMessage(
          whatsappNumber,
          template,
          messageVariables
        );
        
      } else if (channel === 'email') {
        if (!client.email) {
          throw new Error('Cliente no tiene email');
        }
        
        if (!subject) {
          throw new Error('Subject es requerido para emails');
        }
        
        sendResult = await this.emailProvider.sendEmail(
          client.email,
          subject,
          template,
          messageVariables
        );
        
      } else {
        throw new Error(`Canal '${channel}' no soportado`);
      }

      // Actualizar mensaje con resultado
      const updatedMessage = await prisma.message.update({
        where: { id: messageRecord.id },
        data: {
          providerMessageId: sendResult.providerMessageId,
          status: sendResult.status,
          errorCode: sendResult.errorCode,
          errorMessage: sendResult.errorMessage,
          text: this.replacePlaceholders(template, messageVariables)
        }
      });

      console.log('✅ Mensaje procesado:', {
        messageId: updatedMessage.id,
        status: updatedMessage.status,
        providerMessageId: updatedMessage.providerMessageId
      });

      return {
        success: sendResult.success,
        messageId: updatedMessage.id,
        status: updatedMessage.status,
        providerMessageId: updatedMessage.providerMessageId,
        error: sendResult.errorMessage
      };

    } catch (error) {
      console.error('❌ Error en MessageService:', error.message);
      
      // Si hay un mensaje creado, marcarlo como fallido
      if (params.messageId) {
        await prisma.message.update({
          where: { id: params.messageId },
          data: {
            status: 'failed',
            errorMessage: error.message
          }
        });
      }

      throw error;
    }
  }

  /**
   * Obtener template por tipo y canal
   * @param {string} templateType - Tipo de template
   * @param {string} channel - Canal (whatsapp/email)
   * @returns {string} - Template
   */
  getTemplate(templateType, channel) {
    const templates = config.templates;
    
    if (templates[templateType]) {
      return templates[templateType];
    }
    
    return null;
  }

  /**
   * Reemplazar placeholders en template
   * @param {string} template - Template
   * @param {Object} variables - Variables
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
   * Obtener historial de mensajes
   * @param {string} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} - Lista de mensajes
   */
  async getMessageHistory(userId, filters = {}) {
    const where = {
      userId,
      ...filters
    };

    const messages = await prisma.message.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        order: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return messages;
  }

  /**
   * Obtener mensaje por ID
   * @param {string} messageId - ID del mensaje
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Mensaje
   */
  async getMessageById(messageId, userId) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        order: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      }
    });

    return message;
  }

  /**
   * Actualizar status de mensaje (para webhooks)
   * @param {string} providerMessageId - ID del mensaje en el proveedor
   * @param {string} status - Nuevo status
   * @param {string} errorCode - Código de error (opcional)
   * @param {string} errorMessage - Mensaje de error (opcional)
   * @returns {Promise<Object>} - Mensaje actualizado
   */
  async updateMessageStatus(providerMessageId, status, errorCode = null, errorMessage = null) {
    const message = await prisma.message.findFirst({
      where: {
        providerMessageId
      }
    });

    if (!message) {
      throw new Error('Mensaje no encontrado');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: message.id },
      data: {
        status,
        errorCode,
        errorMessage
      }
    });

    console.log('📝 Status actualizado:', {
      messageId: updatedMessage.id,
      providerMessageId,
      status
    });

    return updatedMessage;
  }
}

module.exports = MessageService;
