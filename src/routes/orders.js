const express = require('express');
const { getOrders, createOrder, updateOrder, deleteOrder } = require('../controllers/orderController');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /orders
router.get('/', getOrders);

// POST /orders
router.post('/', validate(schemas.createOrder), createOrder);

// PUT /orders/:id
router.put('/:id', validate(schemas.updateOrder), updateOrder);

// DELETE /orders/:id
router.delete('/:id', deleteOrder);

module.exports = router;
