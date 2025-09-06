const { PrismaClient } = require('@prisma/client');
const { generateTemplate } = require('../config/templates');
const MessageService = require('../services/messageService');
const WhatsAppWebService = require('../services/whatsappWebService');

const prisma = new PrismaClient();
const messageService = new MessageService();
const whatsappService = new WhatsAppWebService();

/**
 * Generar template de mensaje para WhatsApp (endpoint existente)
 */
const generateMessageTemplate = async (req, res, next) => {
  try {
    const { clientId, orderId, templateType = 'confirmacion' } = req.body;

    console.log('📝 Generando template de mensaje:');
    console.log('   - clientId:', clientId);
    console.log('   - orderId:', orderId);
    console.log('   - templateType:', templateType);
    console.log('   - userId:', req.user.id);

    // Verificar que el pedido existe y pertenece al usuario
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: true,
        message: 'Pedido no encontrado',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Verificar que el cliente del pedido coincide con el clientId
    if (order.clientId !== clientId) {
      return res.status(400).json({
        error: true,
        message: 'El cliente no coincide con el pedido',
        code: 'CLIENT_ORDER_MISMATCH'
      });
    }

    // Generar mensaje usando el template
    const message = generateTemplate(templateType, {
      name: order.client.name,
      description: order.description
    });

    console.log('📝 Template generado:', message);
    console.log('📝 Respuesta completa:', {
      message,
      client: {
        id: order.client.id,
        name: order.client.name,
        phone: order.client.phone
      },
      order: {
        id: order.id,
        description: order.description,
        status: order.status
      }
    });

    res.status(200).json({
      message,
      client: {
        id: order.client.id,
        name: order.client.name,
        phone: order.client.phone
      },
      order: {
        id: order.id,
        description: order.description,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enviar mensaje real (WhatsApp o Email)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { clientId, orderId, channel, templateType, variables = {}, subject } = req.body;

    console.log('📤 Enviando mensaje real:');
    console.log('   - clientId:', clientId);
    console.log('   - orderId:', orderId);
    console.log('   - channel:', channel);
    console.log('   - templateType:', templateType);
    console.log('   - subject:', subject);
    console.log('   - userId:', req.user.id);

    // Validar canal
    if (!['whatsapp', 'email'].includes(channel)) {
      return res.status(400).json({
        error: true,
        message: 'Canal debe ser "whatsapp" o "email"',
        code: 'INVALID_CHANNEL'
      });
    }

    // Validar que el cliente existe y pertenece al usuario
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({
        error: true,
        message: 'Cliente no encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    // Validar que el pedido existe (si se proporciona)
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: req.user.id
        }
      });

      if (!order) {
        return res.status(404).json({
          error: true,
          message: 'Pedido no encontrado',
          code: 'ORDER_NOT_FOUND'
        });
      }
    }

    // Validar datos específicos del canal
    if (channel === 'whatsapp' && !client.phone) {
      return res.status(400).json({
        error: true,
        message: 'Cliente no tiene número de teléfono para WhatsApp',
        code: 'NO_PHONE_NUMBER'
      });
    }

    if (channel === 'email' && !client.email) {
      return res.status(400).json({
        error: true,
        message: 'Cliente no tiene email para envío de correo',
        code: 'NO_EMAIL_ADDRESS'
      });
    }

    if (channel === 'email' && !subject) {
      return res.status(400).json({
        error: true,
        message: 'Subject es requerido para emails',
        code: 'MISSING_SUBJECT'
      });
    }

    // Determinar el proveedor a usar
    let useWhatsAppWeb = false;
    if (channel === 'whatsapp') {
      // Verificar si el usuario tiene sesión de WhatsApp Web activa
      useWhatsAppWeb = whatsappService.hasActiveSession(req.user.id);
      
      if (useWhatsAppWeb) {
        console.log('📱 Usando WhatsApp Web para envío de mensaje');
      } else {
        console.log('📱 Usando Twilio para envío de mensaje (WhatsApp Web no disponible)');
      }
    }

    let result;
    
    if (useWhatsAppWeb) {
      // Usar WhatsApp Web
      const template = generateTemplate(templateType, {
        name: client.name,
        description: orderId ? (await prisma.order.findFirst({
          where: { id: orderId, userId: req.user.id }
        }))?.description : '',
        ...variables
      });

      const whatsappResult = await whatsappService.sendMessage(
        req.user.id,
        client.phone,
        template
      );

      // Crear registro de mensaje en la base de datos
      const messageRecord = await prisma.message.create({
        data: {
          userId: req.user.id,
          clientId,
          orderId,
          channel: 'whatsapp',
          direction: 'outbound',
          provider: 'whatsapp_web',
          providerMessageId: whatsappResult.messageId,
          templateType,
          variables: {
            clientName: client.name,
            clientPhone: client.phone,
            ...variables
          },
          text: template,
          status: whatsappResult.status
        }
      });

      result = {
        success: true,
        messageId: messageRecord.id,
        status: whatsappResult.status,
        providerMessageId: whatsappResult.messageId
      };
    } else {
      // Usar el servicio tradicional (Twilio)
      result = await messageService.sendMessage({
        userId: req.user.id,
        clientId,
        orderId,
        channel,
        templateType,
        variables,
        subject
      });
    }

    if (result.success) {
      res.status(202).json({
        success: true,
        messageId: result.messageId,
        status: result.status,
        providerMessageId: result.providerMessageId
      });
    } else {
      res.status(500).json({
        error: true,
        message: 'Error enviando mensaje',
        code: 'SEND_FAILED',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error en sendMessage:', error.message);
    next(error);
  }
};

/**
 * Obtener historial de mensajes
 */
const getMessages = async (req, res, next) => {
  try {
    const { clientId, orderId, channel, status, limit = 50, offset = 0 } = req.query;

    console.log('📋 Obteniendo historial de mensajes:');
    console.log('   - userId:', req.user.id);
    console.log('   - filters:', { clientId, orderId, channel, status });

    // Construir filtros
    const filters = {};
    if (clientId) filters.clientId = clientId;
    if (orderId) filters.orderId = orderId;
    if (channel) filters.channel = channel;
    if (status) filters.status = status;

    // Obtener mensajes
    const messages = await messageService.getMessageHistory(req.user.id, filters);

    // Aplicar paginación
    const paginatedMessages = messages.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      success: true,
      messages: paginatedMessages,
      total: messages.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Error en getMessages:', error.message);
    next(error);
  }
};

/**
 * Obtener mensaje por ID
 */
const getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log('📋 Obteniendo mensaje:', id);

    const message = await messageService.getMessageById(id, req.user.id);

    if (!message) {
      return res.status(404).json({
        error: true,
        message: 'Mensaje no encontrado',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
    console.error('❌ Error en getMessageById:', error.message);
    next(error);
  }
};

/**
 * Obtener templates disponibles
 */
const getTemplates = async (req, res, next) => {
  try {
    console.log('📋 Obteniendo templates disponibles');

    const templates = Object.entries(require('../config').templates).map(([key, value]) => ({
      id: key,
      name: key,
      content: value,
      placeholders: extractPlaceholders(value),
      channel: 'both' // Por ahora, todos los templates sirven para ambos canales
    }));

    res.status(200).json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('❌ Error en getTemplates:', error.message);
    next(error);
  }
};

/**
 * Extraer placeholders de un template
 */
const extractPlaceholders = (template) => {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(1, -1)); // Remover { y }
};

/**
 * Verificar estado de WhatsApp Web del usuario
 */
const getWhatsAppStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const status = await whatsappService.getConnectionStatus(userId);
    
    res.status(200).json({
      success: true,
      whatsappWeb: {
        connected: status.connected,
        status: status.status,
        hasSession: status.hasSession,
        qrCode: status.qrCode
      }
    });

  } catch (error) {
    console.error('❌ Error en getWhatsAppStatus:', error.message);
    next(error);
  }
};

module.exports = {
  generateMessageTemplate,
  sendMessage,
  getMessages,
  getMessageById,
  getTemplates,
  getWhatsAppStatus
};