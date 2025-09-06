const rateLimit = require('express-rate-limit');

/**
 * Rate limiting específico para endpoints de WhatsApp Web
 * Más restrictivo que el rate limiting general
 */
const whatsappRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 requests por minuto por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes de WhatsApp, intenta más tarde',
    code: 'WHATSAPP_RATE_LIMIT',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Aplicar rate limiting por IP y usuario
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress;
    return `whatsapp:${ip}:${userId}`;
  },
  // Skip successful requests para no penalizar conexiones exitosas
  skipSuccessfulRequests: false,
  // Skip failed requests para no penalizar errores de autenticación
  skipFailedRequests: false
});

/**
 * Rate limiting para envío de mensajes de WhatsApp
 * Más restrictivo que el rate limiting general de mensajes
 */
const whatsappMessageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 mensajes por minuto por usuario
  message: {
    success: false,
    message: 'Demasiados mensajes de WhatsApp enviados, intenta más tarde',
    code: 'WHATSAPP_MESSAGE_RATE_LIMIT',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Aplicar rate limiting por usuario
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `whatsapp_messages:${userId}`;
  },
  // Skip successful requests para no penalizar envíos exitosos
  skipSuccessfulRequests: false
});

/**
 * Rate limiting para conexión/desconexión de WhatsApp
 * Muy restrictivo para prevenir abuso
 */
const whatsappConnectionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // 3 intentos de conexión/desconexión por 5 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de conexión/desconexión de WhatsApp, intenta más tarde',
    code: 'WHATSAPP_CONNECTION_RATE_LIMIT',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Aplicar rate limiting por usuario
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `whatsapp_connection:${userId}`;
  }
});

module.exports = {
  whatsappRateLimit,
  whatsappMessageRateLimit,
  whatsappConnectionRateLimit
};
