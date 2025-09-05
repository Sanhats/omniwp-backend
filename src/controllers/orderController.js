const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener todos los pedidos del usuario
 */
const getOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo pedido
 */
const createOrder = async (req, res, next) => {
  try {
    const { clientId, description, status = 'pendiente' } = req.body;

    // Verificar que el cliente existe y pertenece al usuario
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({
        error: true,
        message: 'Cliente no encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    // Crear pedido
    const order = await prisma.order.create({
      data: {
        clientId,
        description,
        status,
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

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar pedido
 */
const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, status } = req.body;

    // Verificar que el pedido existe y pertenece al usuario
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: true,
        message: 'Pedido no encontrado',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Actualizar pedido
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(status && { status })
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

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar pedido
 */
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el pedido existe y pertenece al usuario
    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: true,
        message: 'Pedido no encontrado',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Eliminar pedido
    await prisma.order.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder
};
