const express = require('express');
const { getClients, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /clients
router.get('/', getClients);

// POST /clients
router.post('/', validate(schemas.createClient), createClient);

// PUT /clients/:id
router.put('/:id', validate(schemas.updateClient), updateClient);

// DELETE /clients/:id
router.delete('/:id', deleteClient);

module.exports = router;
