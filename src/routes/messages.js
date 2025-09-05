const express = require('express');
const { generateMessageTemplate } = require('../controllers/messageController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// POST /messages/template
router.post('/template', validate(schemas.generateTemplate), generateMessageTemplate);

module.exports = router;
