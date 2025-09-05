const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Script para probar la actualización de pedidos
 */
async function testOrderUpdate() {
  try {
    console.log('🧪 Probando actualización de pedidos...\n');

    // 1. Crear usuario de prueba
    const user = await prisma.user.upsert({
      where: { email: 'test-update@example.com' },
      update: {},
      create: {
        name: 'Usuario Test Update',
        email: 'test-update@example.com',
        password: await bcrypt.hash('password123', 12)
      }
    });

    // 2. Crear cliente de prueba
    const client = await prisma.client.create({
      data: {
        name: 'Cliente Test Update',
        phone: '5555555555',
        userId: user.id
      }
    });

    // 3. Crear pedido de prueba
    const order = await prisma.order.create({
      data: {
        description: 'Pedido de prueba para actualización',
        status: 'pendiente',
        userId: user.id,
        clientId: client.id
      }
    });

    console.log('✅ Datos de prueba creados');
    console.log(`   - Usuario: ${user.email}`);
    console.log(`   - Cliente: ${client.name}`);
    console.log(`   - Pedido: ${order.id}`);

    // 4. Probar diferentes estados
    const testStatuses = [
      'pendiente',
      'en_proceso', 
      'completado',
      'cancelado',
      'confirmado',
      'entregado'
    ];

    console.log('\n🔄 Probando actualización de estados...');

    for (const status of testStatuses) {
      try {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: { status }
        });
        console.log(`   ✅ Estado '${status}' - OK`);
      } catch (error) {
        console.log(`   ❌ Estado '${status}' - Error: ${error.message}`);
      }
    }

    // 5. Probar actualización de descripción
    console.log('\n📝 Probando actualización de descripción...');
    
    try {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { 
          description: 'Descripción actualizada',
          status: 'en_proceso'
        }
      });
      console.log('   ✅ Descripción actualizada - OK');
    } catch (error) {
      console.log(`   ❌ Descripción actualizada - Error: ${error.message}`);
    }

    // 6. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    
    await prisma.order.delete({
      where: { id: order.id }
    });
    
    await prisma.client.delete({
      where: { id: client.id }
    });
    
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log('✅ Datos de prueba eliminados');

    console.log('\n🎉 Prueba de actualización de pedidos completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testOrderUpdate()
    .then(() => {
      console.log('🎉 Prueba finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en prueba:', error);
      process.exit(1);
    });
}

module.exports = { testOrderUpdate };
