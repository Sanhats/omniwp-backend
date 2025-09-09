/**
 * Configuración específica para Railway
 * Deshabilita funcionalidades que requieren servicios externos
 */

const config = {
  // Verificar si estamos en Railway
  isRailway: process.env.RAILWAY_ENVIRONMENT === 'production' || 
             process.env.RAILWAY_ENVIRONMENT === 'development' ||
             process.env.RAILWAY_PROJECT_ID !== undefined,

  // Verificar si Redis está disponible
  hasRedis: !!process.env.REDIS_URL,

  // Verificar si WhatsApp Web está habilitado
  whatsappWebEnabled: !!process.env.REDIS_URL && !!process.env.WHATSAPP_WEB_ENABLED,

  // Configuración de WhatsApp Web para Railway
  whatsappWeb: {
    // Habilitar si Redis está disponible (WHATSAPP_WEB_ENABLED es opcional)
    enabled: !!process.env.REDIS_URL && (process.env.WHATSAPP_WEB_ENABLED !== 'false'),
    
    // Configuración de Puppeteer para Railway
    puppeteerOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    }
  },

  // Configuración de WebSockets
  websockets: {
    enabled: true, // Siempre habilitado, incluso sin Redis
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://omniwp-frontend.vercel.app',
            'https://omniwp.vercel.app',
            'https://www.omniwp.com'
          ]
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001'
          ],
      credentials: true,
      methods: ['GET', 'POST']
    }
  }
};

module.exports = config;
