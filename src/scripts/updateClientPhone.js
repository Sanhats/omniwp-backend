const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para actualizar el teléfono del cliente para pruebas
 */
async function updateClientPhone() {
  try {
    console.log('📱 Actualizando teléfono del cliente para pruebas...\n');

    // Buscar el cliente
    const client = await prisma.client.findFirst({
      where: {
        name: 'Lourdes Gabriela Rocha'
      }
    });

    if (!client) {
      console.log('❌ Cliente no encontrado');
      return;
    }

    console.log('👤 Cliente encontrado:');
    console.log(`   - Nombre: ${client.name}`);
    console.log(`   - Teléfono actual: ${client.phone}`);

    // Actualizar teléfono a tu número de WhatsApp
    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: {
        phone: '5493816355771' // Tu número de WhatsApp
      }
    });

    console.log('\n✅ Cliente actualizado:');
    console.log(`   - Nombre: ${updatedClient.name}`);
    console.log(`   - Teléfono nuevo: ${updatedClient.phone}`);
    console.log(`   - ID: ${updatedClient.id}`);

    console.log('\n🎯 Ahora puedes probar el envío de WhatsApp');
    console.log('   El mensaje se enviará a tu WhatsApp personal');

  } catch (error) {
    console.error('❌ Error actualizando cliente:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
updateClientPhone()
  .then(() => {
    console.log('\n🎉 Actualización completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
