const express = require('express');
const { 
  generateMessageTemplate, 
  sendMessage, 
  getMessages, 
  getMessageById, 
  getTemplates,
  getWhatsAppStatus
} = require('../controllers/messageController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const { messageRateLimit } = require('../middleware/messageRateLimit');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /messages/test - Endpoint de prueba
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Endpoint de mensajes funcionando',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// GET /messages/debug - Endpoint de debug para verificar respuesta
router.get('/debug', (req, res) => {
  const testMessage = 'Hola Test, tu pedido \'prueba\' está confirmado 🚀';
  
  console.log('🔍 Debug endpoint llamado');
  console.log('   - Usuario:', req.user.email);
  console.log('   - Mensaje de prueba:', testMessage);
  
  res.status(200).json({
    message: testMessage,
    client: {
      id: 'test-client-id',
      name: 'Test Client',
      phone: '1234567890'
    },
    order: {
      id: 'test-order-id',
      description: 'prueba',
      status: 'confirmado'
    },
    debug: true,
    timestamp: new Date().toISOString()
  });
});

// POST /messages/template - Generar template (endpoint existente)
router.post('/template', validate(schemas.generateTemplate), generateMessageTemplate);

// POST /messages/send - Enviar mensaje real (con rate limiting)
router.post('/send', messageRateLimit, validate(schemas.sendMessage), sendMessage);

// GET /templates - Obtener templates disponibles
router.get('/templates', getTemplates);

// GET /config/status - Estado de configuración de Twilio
router.get('/config/status', (req, res) => {
  const TwilioWhatsAppProvider = require('../services/twilioWhatsAppProvider');
  const whatsappProvider = new TwilioWhatsAppProvider();
  
  const status = {
    whatsapp: whatsappProvider.getConfigStatus(),
    isConfigured: whatsappProvider.isConfigured(),
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    config: status
  });
});

// GET /whatsapp/status - Estado de WhatsApp Web del usuario
router.get('/whatsapp/status', getWhatsAppStatus);

// GET /messages - Historial de mensajes
router.get('/', getMessages);

// GET /messages/:id - Obtener mensaje por ID
router.get('/:id', getMessageById);

module.exports = router;
