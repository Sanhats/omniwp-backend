const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener todos los clientes del usuario
 */
const getClients = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo cliente
 */
const createClient = async (req, res, next) => {
  try {
    const { name, phone, notes } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        notes,
        userId: req.user.id
      },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true
      }
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar cliente
 */
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, notes } = req.body;

    // Verificar que el cliente existe y pertenece al usuario
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        error: true,
        message: 'Cliente no encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    // Actualizar cliente
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(notes !== undefined && { notes })
      },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true
      }
    });

    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar cliente
 */
const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el cliente existe y pertenece al usuario
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingClient) {
      return res.status(404).json({
        error: true,
        message: 'Cliente no encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    // Verificar si tiene pedidos asociados
    const ordersCount = await prisma.order.count({
      where: { clientId: id }
    });

    if (ordersCount > 0) {
      return res.status(400).json({
        error: true,
        message: 'No se puede eliminar un cliente que tiene pedidos asociados',
        code: 'CLIENT_HAS_ORDERS'
      });
    }

    // Eliminar cliente
    await prisma.client.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  createClient,
  updateClient,
  deleteClient
};
