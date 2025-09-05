/**
 * Middleware de manejo de errores centralizado
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', err);

  // Error de Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: true,
      message: 'El email ya está registrado',
      code: 'EMAIL_ALREADY_EXISTS'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: true,
      message: 'Recurso no encontrado',
      code: 'RESOURCE_NOT_FOUND'
    });
  }

  // Error de validación de Prisma
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: true,
      message: 'Referencia inválida',
      code: 'INVALID_REFERENCE'
    });
  }

  // Error de conexión a la base de datos
  if (err.code === 'P1001') {
    return res.status(500).json({
      error: true,
      message: 'Error de conexión a la base de datos',
      code: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      message: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      message: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Error de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: true,
      message: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: true,
    message: message,
    code: err.code || 'INTERNAL_ERROR'
  });
};

module.exports = { errorHandler };
