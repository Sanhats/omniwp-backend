const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Middleware de autenticación JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de acceso requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Logging del token recibido
    console.log('🔐 Token recibido:', token.substring(0, 20) + '...');
    console.log('🔐 JWT Secret configurado:', config.jwt.secret ? 'Sí' : 'No');
    console.log('🔐 JWT Secret length:', config.jwt.secret ? config.jwt.secret.length : 0);

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Logging para debugging
    console.log('🔐 JWT Decoded:', JSON.stringify(decoded, null, 2));
    console.log('🔐 JWT userId:', decoded.userId);
    console.log('🔐 JWT keys:', Object.keys(decoded));
    
    // Verificar que el usuario existe en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });
    
    console.log('👤 User found:', user);

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Agregar usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Error en authMiddleware:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = { authMiddleware };
