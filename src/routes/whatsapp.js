const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authMiddleware } = require('../middleware/auth');
const { 
  whatsappRateLimit, 
  whatsappMessageRateLimit, 
  whatsappConnectionRateLimit 
} = require('../middleware/whatsappRateLimit');
const { 
  validateWhatsApp, 
  requireWhatsAppSession, 
  requireNoWhatsAppSession,
  schemas 
} = require('../middleware/whatsappValidation');
const railwayConfig = require('../config/railway');

// Aplicar rate limiting general a todas las rutas de WhatsApp
router.use(whatsappRateLimit);

// Endpoint de disponibilidad (sin autenticación)
router.get('/availability', (req, res) => {
  res.json({
    success: true,
    whatsappWeb: {
      enabled: railwayConfig.whatsappWeb.enabled,
      hasRedis: railwayConfig.hasRedis,
      isRailway: railwayConfig.isRailway,
      reason: railwayConfig.whatsappWeb.enabled 
        ? 'WhatsApp Web está disponible' 
        : 'WhatsApp Web no está disponible (Redis requerido)'
    },
    features: {
      websockets: railwayConfig.websockets.enabled,
      redis: railwayConfig.hasRedis,
      whatsappWeb: railwayConfig.whatsappWeb.enabled
    }
  });
});

// Endpoint de status (sin autenticación para verificación general)
router.get('/status', (req, res) => {
  res.json({
    success: true,
    whatsappWeb: {
      enabled: railwayConfig.whatsappWeb.enabled,
      hasRedis: railwayConfig.hasRedis,
      isRailway: railwayConfig.isRailway,
      reason: railwayConfig.whatsappWeb.enabled 
        ? 'WhatsApp Web está disponible' 
        : 'WhatsApp Web no está disponible (Redis requerido)'
    },
    features: {
      websockets: railwayConfig.websockets.enabled,
      redis: railwayConfig.hasRedis,
      whatsappWeb: railwayConfig.whatsappWeb.enabled
    }
  });
});

// Aplicar autenticación a todas las demás rutas
router.use(authMiddleware);

// Middleware para verificar si WhatsApp Web está habilitado (solo para rutas protegidas)
router.use((req, res, next) => {
  if (!railwayConfig.whatsappWeb.enabled) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp Web no está disponible en este momento',
      code: 'WHATSAPP_WEB_DISABLED',
      reason: 'Redis no configurado o WhatsApp Web deshabilitado'
    });
  }
  next();
});

/**
 * @route POST /whatsapp/connect
 * @desc Crear nueva sesión de WhatsApp para el usuario
 * @access Private
 */
router.post('/connect', 
  whatsappConnectionRateLimit,
  requireNoWhatsAppSession,
  validateWhatsApp(schemas.connectWhatsApp),
  whatsappController.connect
);


/**
 * @route POST /whatsapp/disconnect
 * @desc Desconectar sesión de WhatsApp del usuario
 * @access Private
 */
router.post('/disconnect', 
  whatsappConnectionRateLimit,
  requireWhatsAppSession,
  whatsappController.disconnect
);

/**
 * @route POST /whatsapp/restore
 * @desc Restaurar sesión existente de WhatsApp
 * @access Private
 */
router.post('/restore', 
  whatsappConnectionRateLimit,
  validateWhatsApp(schemas.restoreWhatsApp),
  whatsappController.restore
);

/**
 * @route POST /whatsapp/send
 * @desc Enviar mensaje directo a través de WhatsApp Web
 * @access Private
 */
router.post('/send', 
  whatsappMessageRateLimit,
  requireWhatsAppSession,
  validateWhatsApp(schemas.sendWhatsAppMessage),
  whatsappController.sendMessage
);

/**
 * @route GET /whatsapp/info
 * @desc Obtener información del cliente WhatsApp conectado
 * @access Private
 */
router.get('/info', 
  requireWhatsAppSession,
  whatsappController.getInfo
);

/**
 * @route GET /whatsapp/messages
 * @desc Obtener historial de mensajes de WhatsApp del usuario
 * @access Private
 */
router.get('/messages', 
  validateWhatsApp(schemas.getWhatsAppMessages),
  whatsappController.getMessages
);


module.exports = router;
