const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const railwayConfig = require('./config/railway');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = socketIo(server, railwayConfig.websockets.cors);

// Configurar trust proxy para Railway
app.set('trust proxy', 1);

// Middleware de seguridad
app.use(helmet());

// CORS
// Detectar si estamos en producción (Railway, Render, etc.)
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.RAILWAY_ENVIRONMENT === 'production' ||
                    process.env.RENDER === 'true' ||
                    process.env.PORT; // Railway siempre define PORT

// Permitir localhost en producción si está habilitado
const allowLocalhostInProduction = process.env.ALLOW_LOCALHOST_IN_PRODUCTION === 'true';

const allowedOrigins = isProduction
  ? [
      'https://omniwp-frontend.vercel.app',
      'https://omniwp.vercel.app', 
      'https://www.omniwp.com',
      // Permitir localhost para desarrollo con backend en producción si está habilitado
      ...(allowLocalhostInProduction ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ] : [])
    ]
  : [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

console.log('🔧 Configuración CORS:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('RENDER:', process.env.RENDER);
console.log('PORT:', process.env.PORT);
console.log('isProduction:', isProduction);
console.log('allowLocalhostInProduction:', allowLocalhostInProduction);
console.log('ALLOW_LOCALHOST_IN_PRODUCTION:', process.env.ALLOW_LOCALHOST_IN_PRODUCTION);
console.log('allowedOrigins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: mobile apps, Postman)
    if (!origin) {
      console.log('CORS: Request sin origin header - permitido');
      return callback(null, true);
    }
    
    console.log('CORS: Verificando origin:', origin);
    console.log('CORS: Orígenes permitidos:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origin permitido:', origin);
      callback(null, true);
    } else {
      console.log('CORS: Origin bloqueado:', origin);
      console.log('CORS: Tipos de origins permitidos:', {
        production: ['https://omniwp-frontend.vercel.app', 'https://omniwp.vercel.app', 'https://www.omniwp.com'],
        development: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']
      });
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Para compatibilidad con navegadores antiguos
}));

// Manejo adicional de preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('CORS: Preflight request desde:', origin);
  
  // Siempre enviar headers de CORS, pero solo permitir origins válidos
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('CORS: Preflight permitido para:', origin);
  } else if (!origin) {
    // Permitir requests sin origin (ej: Postman, mobile apps)
    res.header('Access-Control-Allow-Origin', '*');
    console.log('CORS: Preflight permitido sin origin');
  } else {
    // Para origins no permitidos, enviar headers pero sin Access-Control-Allow-Origin
    console.log('CORS: Preflight bloqueado para:', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Logging
app.use(morgan('combined'));

// Logging detallado para debugging
app.use((req, res, next) => {
  console.log(`📨 Request: ${req.method} ${req.path}`);
  console.log('   Headers:', req.headers);
  console.log('   Body:', req.body);
  next();
});

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

// Configurar Socket.io
require('./services/socketService')(io);

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
server.listen(PORT, () => {
  console.log(`🚀 Servidor OmniWP ejecutándose en puerto ${PORT}`);
  console.log(`📊 Entorno: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`🔌 WebSocket disponible en: ws://localhost:${PORT}`);
});

module.exports = { app, server, io };
