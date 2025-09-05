const express = require('express');
const { generateMessageTemplate } = require('../controllers/messageController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

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

// POST /messages/template
router.post('/template', validate(schemas.generateTemplate), generateMessageTemplate);

module.exports = router;
