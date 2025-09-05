const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware de seguridad
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://omniwp.vercel.app', 'https://www.omniwp.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Rate limiting para endpoints de auth
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 5, // 5 intentos por ventana de tiempo
  message: {
    error: true,
    message: 'Demasiados intentos de login, intenta más tarde',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: true,
    message: 'Demasiadas solicitudes, intenta más tarde',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/v1', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 OmniWP Backend API',
    version: '1.0.0',
    status: 'active',
    documentation: '/api/v1/health',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint no encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Servidor OmniWP ejecutándose en puerto ${PORT}`);
  console.log(`📊 Entorno: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
});

module.exports = app;
