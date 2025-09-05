const express = require('express');
const authRoutes = require('./auth');
const clientRoutes = require('./clients');
const orderRoutes = require('./orders');
const messageRoutes = require('./messages');

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

// Rutas de la API
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/orders', orderRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
