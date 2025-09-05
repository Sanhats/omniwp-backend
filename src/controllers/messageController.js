const { PrismaClient } = require('@prisma/client');
const { generateTemplate } = require('../config/templates');

const prisma = new PrismaClient();

/**
 * Generar template de mensaje para WhatsApp
 */
const generateMessageTemplate = async (req, res, next) => {
  try {
    const { clientId, orderId, templateType = 'confirmacion' } = req.body;

    console.log('📝 Generando template de mensaje:');
    console.log('   - clientId:', clientId);
    console.log('   - orderId:', orderId);
    console.log('   - templateType:', templateType);
    console.log('   - userId:', req.user.id);

    // Verificar que el pedido existe y pertenece al usuario
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: true,
        message: 'Pedido no encontrado',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Verificar que el cliente del pedido coincide con el clientId
    if (order.clientId !== clientId) {
      return res.status(400).json({
        error: true,
        message: 'El cliente no coincide con el pedido',
        code: 'CLIENT_ORDER_MISMATCH'
      });
    }

    // Generar mensaje usando el template
    const message = generateTemplate(templateType, {
      name: order.client.name,
      description: order.description
    });

    res.status(200).json({
      message,
      client: {
        id: order.client.id,
        name: order.client.name,
        phone: order.client.phone
      },
      order: {
        id: order.id,
        description: order.description,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateMessageTemplate
};
