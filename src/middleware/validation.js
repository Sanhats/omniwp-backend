const { z } = require('zod');

/**
 * Middleware de validación con Zod
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      console.log('🔍 Validando datos:', req.body);
      const validatedData = schema.parse(req.body);
      console.log('✅ Datos validados correctamente:', validatedData);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ Error de validación:', error.errors);
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          error: true,
          message: 'Datos de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: errorMessages
        });
      }

      console.error('Error en validación:', error);
      return res.status(500).json({
        error: true,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Schemas de validación
const schemas = {
  // Auth schemas
  register: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
  }),

  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
  }),

  // Client schemas
  createClient: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres'),
    notes: z.string().optional()
  }),

  updateClient: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    phone: z.string().min(10, 'El teléfono debe tener al menos 10 caracteres').optional(),
    notes: z.string().optional()
  }),

  // Order schemas
  createOrder: z.object({
    clientId: z.string().min(1, 'El ID del cliente es requerido'),
    description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
    status: z.enum(['pendiente', 'en_proceso', 'completado', 'cancelado', 'confirmado', 'entregado']).optional().default('pendiente')
  }),

  updateOrder: z.object({
    description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres').optional(),
    status: z.enum(['pendiente', 'en_proceso', 'completado', 'cancelado', 'confirmado', 'entregado']).optional()
  }),

  // Message schema
  generateTemplate: z.object({
    clientId: z.string().min(1, 'El ID del cliente es requerido'),
    orderId: z.string().min(1, 'El ID del pedido es requerido'),
    templateType: z.enum(['confirmacion', 'recordatorio', 'seguimiento', 'entrega', 'agradecimiento']).optional().default('confirmacion')
  })
};

module.exports = {
  validate,
  schemas
};
