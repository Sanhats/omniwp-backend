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

// POST /messages/template
router.post('/template', validate(schemas.generateTemplate), generateMessageTemplate);

module.exports = router;
