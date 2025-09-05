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

  // Templates
  templates: {
    confirmacion: "Hola {name}, tu pedido '{description}' está confirmado 🚀",
    recordatorio: "Hola {name}, te recordamos que tienes pendiente: '{description}' 📝",
    seguimiento: "Hola {name}, ¿cómo va tu pedido '{description}'? ¿Necesitas algo más? 🤔",
  },
};

module.exports = config;
