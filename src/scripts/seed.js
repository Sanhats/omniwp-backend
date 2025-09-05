const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Limpiar datos existentes
    await prisma.order.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Datos existentes eliminados');

    // Crear usuarios de prueba
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Tomas Rodriguez',
          email: 'tomas@test.com',
          password: await bcrypt.hash('123456', 12)
        }
      }),
      prisma.user.create({
        data: {
          name: 'Maria Garcia',
          email: 'maria@test.com',
          password: await bcrypt.hash('123456', 12)
        }
      })
    ]);

    console.log('👥 Usuarios creados:', users.length);

    // Crear clientes para Tomas
    const tomasClients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Juan Pérez',
          phone: '5491112345678',
          notes: 'Cliente frecuente, paga en efectivo',
          userId: users[0].id
        }
      }),
      prisma.client.create({
        data: {
          name: 'Ana Martinez',
          phone: '5491123456789',
          notes: 'Prefiere contacto por WhatsApp',
          userId: users[0].id
        }
      }),
      prisma.client.create({
        data: {
          name: 'Carlos Lopez',
          phone: '5491134567890',
          notes: 'Cliente nuevo, muy puntual',
          userId: users[0].id
        }
      })
    ]);

    console.log('👥 Clientes de Tomas creados:', tomasClients.length);

    // Crear clientes para Maria
    const mariaClients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Roberto Silva',
          phone: '5491145678901',
          notes: 'Cliente VIP, descuentos especiales',
          userId: users[1].id
        }
      }),
      prisma.client.create({
        data: {
          name: 'Laura Fernandez',
          phone: '5491156789012',
          notes: 'Siempre pide lo mismo',
          userId: users[1].id
        }
      })
    ]);

    console.log('👥 Clientes de Maria creados:', mariaClients.length);

    // Crear pedidos para Tomas
    const tomasOrders = await Promise.all([
      prisma.order.create({
        data: {
          description: 'Pedido de 2 filtros de aceite para Honda Civic 2018',
          status: 'pendiente',
          userId: users[0].id,
          clientId: tomasClients[0].id
        }
      }),
      prisma.order.create({
        data: {
          description: 'Cambio de pastillas de freno delanteras',
          status: 'confirmado',
          userId: users[0].id,
          clientId: tomasClients[0].id
        }
      }),
      prisma.order.create({
        data: {
          description: 'Revisión completa del motor',
          status: 'entregado',
          userId: users[0].id,
          clientId: tomasClients[1].id
        }
      }),
      prisma.order.create({
        data: {
          description: 'Instalación de sistema de audio',
          status: 'pendiente',
          userId: users[0].id,
          clientId: tomasClients[2].id
        }
      })
    ]);

    console.log('📦 Pedidos de Tomas creados:', tomasOrders.length);

    // Crear pedidos para Maria
    const mariaOrders = await Promise.all([
      prisma.order.create({
        data: {
          description: 'Mantenimiento preventivo completo',
          status: 'confirmado',
          userId: users[1].id,
          clientId: mariaClients[0].id
        }
      }),
      prisma.order.create({
        data: {
          description: 'Reparación de aire acondicionado',
          status: 'pendiente',
          userId: users[1].id,
          clientId: mariaClients[1].id
        }
      })
    ]);

    console.log('📦 Pedidos de Maria creados:', mariaOrders.length);

    console.log('✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- Usuarios: ${users.length}`);
    console.log(`- Clientes totales: ${tomasClients.length + mariaClients.length}`);
    console.log(`- Pedidos totales: ${tomasOrders.length + mariaOrders.length}`);
    console.log('\n🔑 Credenciales de prueba:');
    console.log('Usuario 1: tomas@test.com / 123456');
    console.log('Usuario 2: maria@test.com / 123456');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seed finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en seed:', error);
      process.exit(1);
    });
}

module.exports = { seed };
