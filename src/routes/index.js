const express = require('express');
const authRoutes = require('./auth');
const clientRoutes = require('./clients');
const orderRoutes = require('./orders');
const messageRoutes = require('./messages');
const webhookRoutes = require('./webhooks');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'OmniWP API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin || 'No origin header',
      allowed: true
    }
  });
});

// CORS test endpoint
router.get('/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS configurado correctamente',
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Order status test endpoint
router.get('/order-status-test', (req, res) => {
  res.status(200).json({
    message: 'Estados de pedidos soportados',
    statuses: [
      'pendiente',
      'en_proceso', 
      'completado',
      'cancelado',
      'confirmado',
      'entregado'
    ],
    timestamp: new Date().toISOString()
  });
});

// Message template test endpoint
router.get('/message-template-test', (req, res) => {
  res.status(200).json({
    message: 'Templates de mensajes soportados',
    templates: [
      'confirmacion',
      'recordatorio',
      'seguimiento',
      'entrega',
      'agradecimiento'
    ],
    example: {
      clientId: 'string (required)',
      orderId: 'string (required)',
      templateType: 'string (optional, default: confirmacion)'
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/orders', orderRoutes);
router.use('/messages', messageRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;
