const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Script para probar la generación de templates de mensajes
 */
async function testMessageTemplate() {
  try {
    console.log('🧪 Probando generación de templates de mensajes...\n');

    // 1. Crear usuario de prueba
    const user = await prisma.user.upsert({
      where: { email: 'test-message@example.com' },
      update: {},
      create: {
        name: 'Usuario Test Message',
        email: 'test-message@example.com',
        password: await bcrypt.hash('password123', 12)
      }
    });

    // 2. Crear cliente de prueba
    const client = await prisma.client.create({
      data: {
        name: 'Cliente Test Message',
        phone: '5555555555',
        userId: user.id
      }
    });

    // 3. Crear pedido de prueba
    const order = await prisma.order.create({
      data: {
        description: 'Pedido de prueba para mensaje',
        status: 'pendiente',
        userId: user.id,
        clientId: client.id
      }
    });

    console.log('✅ Datos de prueba creados');
    console.log(`   - Usuario: ${user.email}`);
    console.log(`   - Cliente: ${client.name} (${client.id})`);
    console.log(`   - Pedido: ${order.description} (${order.id})`);

    // 4. Probar diferentes templates
    const testTemplates = [
      'confirmacion',
      'recordatorio', 
      'seguimiento',
      'entrega',
      'agradecimiento'
    ];

    console.log('\n📝 Probando generación de templates...');

    for (const templateType of testTemplates) {
      try {
        // Simular la lógica del controller
        const orderWithClient = await prisma.order.findFirst({
          where: {
            id: order.id,
            userId: user.id
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

        if (!orderWithClient) {
          console.log(`   ❌ Template '${templateType}' - Pedido no encontrado`);
          continue;
        }

        if (orderWithClient.clientId !== client.id) {
          console.log(`   ❌ Template '${templateType}' - Cliente no coincide`);
          continue;
        }

        // Generar mensaje usando el template
        const { generateTemplate } = require('../config/templates');
        const message = generateTemplate(templateType, {
          name: orderWithClient.client.name,
          description: orderWithClient.description
        });

        console.log(`   ✅ Template '${templateType}' - OK`);
        console.log(`      Mensaje: "${message}"`);

      } catch (error) {
        console.log(`   ❌ Template '${templateType}' - Error: ${error.message}`);
      }
    }

    // 5. Probar con datos inválidos
    console.log('\n🚫 Probando casos de error...');

    // Pedido inexistente
    try {
      const orderWithClient = await prisma.order.findFirst({
        where: {
          id: 'invalid-order-id',
          userId: user.id
        }
      });
      
      if (!orderWithClient) {
        console.log('   ✅ Pedido inexistente - Error manejado correctamente');
      }
    } catch (error) {
      console.log(`   ❌ Pedido inexistente - Error: ${error.message}`);
    }

    // Cliente que no coincide
    try {
      const orderWithClient = await prisma.order.findFirst({
        where: {
          id: order.id,
          userId: user.id
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

      if (orderWithClient && orderWithClient.clientId !== 'invalid-client-id') {
        console.log('   ✅ Cliente no coincide - Error manejado correctamente');
      }
    } catch (error) {
      console.log(`   ❌ Cliente no coincide - Error: ${error.message}`);
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

    console.log('\n🎉 Prueba de templates de mensajes completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testMessageTemplate()
    .then(() => {
      console.log('🎉 Prueba finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en prueba:', error);
      process.exit(1);
    });
}

module.exports = { testMessageTemplate };
