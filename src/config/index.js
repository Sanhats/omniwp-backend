require('dotenv').config();

const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Server
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Twilio Configuration (WhatsApp)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
    webhookSecret: process.env.TWILIO_WEBHOOK_SECRET,
    isConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  },

  // SendGrid Configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@omniwp.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'OmniWP',
  },

  // Message Rate Limiting
  messageRateLimit: {
    whatsapp: parseInt(process.env.MESSAGE_RATE_LIMIT_WHATSAPP) || 10, // mensajes por minuto
    email: parseInt(process.env.MESSAGE_RATE_LIMIT_EMAIL) || 30, // mensajes por minuto
    general: parseInt(process.env.MESSAGE_RATE_LIMIT_GENERAL) || 100, // mensajes por 15 min
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    isConfigured: !!process.env.REDIS_URL
  },

  // WhatsApp Web Configuration
  whatsappWeb: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './sessions',
    puppeteerOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  },

  // Templates
  templates: {
    confirmacion: "Hola {clientName}, tu pedido '{orderDescription}' está confirmado 🚀",
    recordatorio: "Hola {clientName}, te recordamos que tienes pendiente: '{orderDescription}' 📝",
    seguimiento: "Hola {clientName}, ¿cómo va tu pedido '{orderDescription}'? ¿Necesitas algo más? 🤔",
    entrega: "Hola {clientName}, tu pedido '{orderDescription}' está listo para entrega 📦",
    agradecimiento: "Hola {clientName}, ¡gracias por tu pedido '{orderDescription}'! Esperamos verte pronto 🙏",
  },
};

module.exports = config;
