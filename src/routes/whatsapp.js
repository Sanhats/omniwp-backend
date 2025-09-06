const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/auth');
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

// Aplicar rate limiting general a todas las rutas de WhatsApp
router.use(whatsappRateLimit);

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

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
 * @route GET /whatsapp/status
 * @desc Obtener estado de conexión de WhatsApp del usuario
 * @access Private
 */
router.get('/status', whatsappController.getStatus);

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
