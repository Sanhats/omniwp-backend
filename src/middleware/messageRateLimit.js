const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Rate limiting específico para mensajes WhatsApp
 */
const whatsappRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: config.messageRateLimit.whatsapp, // 10 mensajes por minuto
  message: {
    error: true,
    message: 'Demasiados mensajes WhatsApp enviados, intenta más tarde',
    code: 'WHATSAPP_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar userId para el rate limiting
    return `whatsapp:${req.user?.id || req.ip}`;
  }
});

/**
 * Rate limiting específico para mensajes Email
 */
const emailRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: config.messageRateLimit.email, // 30 mensajes por minuto
  message: {
    error: true,
    message: 'Demasiados emails enviados, intenta más tarde',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar userId para el rate limiting
    return `email:${req.user?.id || req.ip}`;
  }
});

/**
 * Rate limiting general para todos los mensajes
 */
const generalMessageRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.messageRateLimit.general, // 100 mensajes por 15 minutos
  message: {
    error: true,
    message: 'Demasiados mensajes enviados en total, intenta más tarde',
    code: 'GENERAL_MESSAGE_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar userId para el rate limiting
    return `general:${req.user?.id || req.ip}`;
  }
});

/**
 * Middleware para aplicar rate limiting según el canal
 */
const messageRateLimit = (req, res, next) => {
  const channel = req.body?.channel;

  if (channel === 'whatsapp') {
    return whatsappRateLimit(req, res, next);
  } else if (channel === 'email') {
    return emailRateLimit(req, res, next);
  } else {
    // Aplicar rate limiting general
    return generalMessageRateLimit(req, res, next);
  }
};

module.exports = {
  whatsappRateLimit,
  emailRateLimit,
  generalMessageRateLimit,
  messageRateLimit
};
