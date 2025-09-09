const { z } = require('zod');

/**
 * Esquemas de validación específicos para WhatsApp Web
 */

// Validación para conectar WhatsApp
const connectWhatsAppSchema = z.object({
  // No se requieren parámetros adicionales para conectar
});

// Validación para enviar mensaje directo de WhatsApp
const sendWhatsAppMessageSchema = z.object({
  clientNumber: z.string()
    .min(1, 'Número de cliente es requerido')
    .regex(/^[\d\-\+\(\)\s]+$/, 'Formato de número de teléfono inválido')
    .transform((val) => val.replace(/\D/g, '')), // Solo números
  text: z.string()
    .min(1, 'Texto del mensaje es requerido')
    .max(4096, 'Mensaje demasiado largo (máximo 4096 caracteres)')
});

// Validación para restaurar sesión
const restoreWhatsAppSchema = z.object({
  // No se requieren parámetros adicionales para restaurar
});

// Validación para obtener mensajes
const getWhatsAppMessagesSchema = z.object({
  limit: z.string()
    .optional()
    .transform((val) => val ? parseInt(val) : 50)
    .refine((val) => val >= 1 && val <= 100, 'Límite debe estar entre 1 y 100'),
  offset: z.string()
    .optional()
    .transform((val) => val ? parseInt(val) : 0)
    .refine((val) => val >= 0, 'Offset debe ser mayor o igual a 0')
});

/**
 * Middleware de validación para WhatsApp
 */
const validateWhatsApp = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse({
        ...req.body,
        ...req.query
      });
      
      // Agregar datos validados al request
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Datos de validación inválidos',
          errors: errorMessages,
          code: 'VALIDATION_ERROR'
        });
      }
      
      next(error);
    }
  };
};

/**
 * Validar que el usuario tenga sesión de WhatsApp activa
 */
const requireWhatsAppSession = (req, res, next) => {
  const { getWhatsAppWebService } = require('../services/whatsappWebService');
  const whatsappService = getWhatsAppWebService();
  
  const userId = req.user.id;
  
  if (!whatsappService.hasActiveSession(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Usuario no tiene sesión de WhatsApp activa',
      code: 'NO_WHATSAPP_SESSION'
    });
  }
  
  next();
};

/**
 * Validar que el usuario no tenga sesión de WhatsApp activa
 */
const requireNoWhatsAppSession = (req, res, next) => {
  const { getWhatsAppWebService } = require('../services/whatsappWebService');
  const whatsappService = getWhatsAppWebService();
  
  const userId = req.user.id;
  
  if (whatsappService.hasActiveSession(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Usuario ya tiene una sesión de WhatsApp activa',
      code: 'WHATSAPP_SESSION_EXISTS'
    });
  }
  
  next();
};

/**
 * Sanitizar número de teléfono para WhatsApp
 */
const sanitizePhoneNumber = (phoneNumber) => {
  // Remover todos los caracteres no numéricos excepto +
  let cleaned = phoneNumber.replace(/[^\d\+]/g, '');
  
  // Si no empieza con +, agregar código de país por defecto (Argentina)
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('54')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+54' + cleaned;
    }
  }
  
  return cleaned;
};

/**
 * Validar formato de número de WhatsApp
 */
const validateWhatsAppNumber = (phoneNumber) => {
  const cleaned = sanitizePhoneNumber(phoneNumber);
  
  // Validar que tenga al menos 10 dígitos después del código de país
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    throw new Error('Número de teléfono demasiado corto');
  }
  
  // Validar que no sea demasiado largo
  if (digitsOnly.length > 15) {
    throw new Error('Número de teléfono demasiado largo');
  }
  
  return cleaned;
};

module.exports = {
  schemas: {
    connectWhatsApp: connectWhatsAppSchema,
    sendWhatsAppMessage: sendWhatsAppMessageSchema,
    restoreWhatsApp: restoreWhatsAppSchema,
    getWhatsAppMessages: getWhatsAppMessagesSchema
  },
  validateWhatsApp,
  requireWhatsAppSession,
  requireNoWhatsAppSession,
  sanitizePhoneNumber,
  validateWhatsAppNumber
};
