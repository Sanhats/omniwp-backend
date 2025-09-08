const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authMiddleware } = require('../middleware/auth');
const {
  whatsappRateLimit,
  whatsappMessageRateLimit,
  whatsappConnectionRateLimit,
  whatsappInfoRateLimit
} = require('../middleware/whatsappRateLimit');
const { 
  validateWhatsApp, 
  requireWhatsAppSession, 
  requireNoWhatsAppSession,
  schemas 
} = require('../middleware/whatsappValidation');
const railwayConfig = require('../config/railway');

// Rate limiting más permisivo para endpoints públicos
const publicRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto para endpoints públicos
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta más tarde',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting permisivo a endpoints públicos
router.use('/availability', publicRateLimit);
router.use('/status', publicRateLimit);

// Aplicar rate limiting restrictivo a rutas protegidas
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

// Endpoint de connect público (solo para verificar disponibilidad)
router.post('/connect', (req, res) => {
  if (!railwayConfig.whatsappWeb.enabled) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp Web no está disponible en este momento',
      code: 'WHATSAPP_WEB_DISABLED',
      reason: 'Redis no configurado o WhatsApp Web deshabilitado'
    });
  }
  
  // Si está habilitado, devolver que requiere autenticación
  res.status(401).json({
    success: false,
    message: 'Autenticación requerida para conectar WhatsApp',
    code: 'AUTH_REQUIRED'
  });
});

// Endpoint de info público (solo para verificar disponibilidad)
router.get('/info', (req, res) => {
  if (!railwayConfig.whatsappWeb.enabled) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp Web no está disponible en este momento',
      code: 'WHATSAPP_WEB_DISABLED',
      reason: 'Redis no configurado o WhatsApp Web deshabilitado'
    });
  }
  
  // Si está habilitado, devolver que requiere autenticación
  res.status(401).json({
    success: false,
    message: 'Autenticación requerida para obtener información de WhatsApp',
    code: 'AUTH_REQUIRED'
  });
});

// Endpoint de prueba para verificar JWT (sin autenticación)
router.get('/test-jwt', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    res.json({
      success: true,
      decoded: decoded,
      userId: decoded.userId,
      email: decoded.email,
      keys: Object.keys(decoded)
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      name: error.name
    });
  }
});

// Endpoint de prueba para verificar configuración de WhatsApp (sin autenticación)
router.get('/test-config', (req, res) => {
  try {
    const config = require('../config');
    const railwayConfig = require('../config/railway');
    
    res.json({
      success: true,
      config: {
        whatsappWeb: config.whatsappWeb,
        redis: config.redis,
        railway: railwayConfig
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        REDIS_URL: process.env.REDIS_URL ? 'Configurado' : 'No configurado',
        WHATSAPP_WEB_ENABLED: process.env.WHATSAPP_WEB_ENABLED
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
 * @route POST /whatsapp/connect-auth
 * @desc Crear nueva sesión de WhatsApp para el usuario (autenticado)
 * @access Private
 */
router.post('/connect-auth', 
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
 * @route GET /whatsapp/info-auth
 * @desc Obtener información del cliente WhatsApp conectado (autenticado)
 * @access Private
 */
router.get('/info-auth', 
  whatsappInfoRateLimit,
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
