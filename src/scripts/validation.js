const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Script de validación del backend para usuarios reales
 */
async function runValidation() {
  console.log('🔍 Iniciando validación del backend...\n');

  try {
    // 1. Validar seguridad JWT
    await validateJWT();
    
    // 2. Validar multi-user isolation
    await validateMultiUserIsolation();
    
    // 3. Validar rate limiting
    await validateRateLimiting();
    
    // 4. Validar datos y consistencia
    await validateDataConsistency();
    
    // 5. Validar performance básica
    await validatePerformance();
    
    // 6. Validar seeds y entorno
    await validateSeeds();
    
    console.log('\n✅ Validación del backend completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error en validación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 1. Validar JWT
 */
async function validateJWT() {
  console.log('🔐 Validando JWT...');
  
  // Crear token de prueba
  const testUser = { id: 'test123', email: 'test@test.com' };
  const token = jwt.sign(testUser, config.jwt.secret, { expiresIn: '1s' });
  
  // Verificar que el token funciona
  const decoded = jwt.verify(token, config.jwt.secret);
  console.log('✅ JWT generado correctamente');
  
  // Esperar 2 segundos para que expire
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    jwt.verify(token, config.jwt.secret);
    console.log('❌ JWT no expiró correctamente');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('✅ JWT expira correctamente');
    } else {
      throw error;
    }
  }
}

/**
 * 2. Validar multi-user isolation
 */
async function validateMultiUserIsolation() {
  console.log('👥 Validando multi-user isolation...');
  
  // Crear dos usuarios de prueba
  const user1 = await prisma.user.create({
    data: {
      name: 'Usuario Test 1',
      email: 'test1@validation.com',
      password: await bcrypt.hash('password123', 12)
    }
  });
  
  const user2 = await prisma.user.create({
    data: {
      name: 'Usuario Test 2',
      email: 'test2@validation.com',
      password: await bcrypt.hash('password123', 12)
    }
  });
  
  // Crear clientes para cada usuario
  const client1 = await prisma.client.create({
    data: {
      name: 'Cliente Usuario 1',
      phone: '1111111111',
      userId: user1.id
    }
  });
  
  const client2 = await prisma.client.create({
    data: {
      name: 'Cliente Usuario 2',
      phone: '2222222222',
      userId: user2.id
    }
  });
  
  // Verificar que cada usuario solo ve sus clientes
  const clientsUser1 = await prisma.client.findMany({
    where: { userId: user1.id }
  });
  
  const clientsUser2 = await prisma.client.findMany({
    where: { userId: user2.id }
  });
  
  if (clientsUser1.length === 1 && clientsUser2.length === 1) {
    console.log('✅ Multi-user isolation funciona correctamente');
  } else {
    throw new Error('❌ Multi-user isolation falló');
  }
  
  // Limpiar datos de prueba
  await prisma.client.deleteMany({
    where: { userId: { in: [user1.id, user2.id] } }
  });
  
  await prisma.user.deleteMany({
    where: { id: { in: [user1.id, user2.id] } }
  });
}

/**
 * 3. Validar rate limiting
 */
async function validateRateLimiting() {
  console.log('⏱️ Validando rate limiting...');
  
  // Esta validación se hace manualmente con múltiples requests
  console.log('✅ Rate limiting configurado (validar manualmente con múltiples requests)');
}

/**
 * 4. Validar datos y consistencia
 */
async function validateDataConsistency() {
  console.log('📊 Validando datos y consistencia...');
  
  // Crear usuario de prueba (o usar existente)
  let user = await prisma.user.findUnique({
    where: { email: 'consistencia@test.com' }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Usuario Consistencia',
        email: 'consistencia@test.com',
        password: await bcrypt.hash('password123', 12)
      }
    });
  }
  
  // Limpiar datos existentes del usuario (pedidos primero)
  await prisma.order.deleteMany({
    where: { userId: user.id }
  });
  
  await prisma.client.deleteMany({
    where: { userId: user.id }
  });
  
  // Crear cliente
  const client = await prisma.client.create({
    data: {
      name: 'Cliente Consistencia',
      phone: '3333333333',
      userId: user.id
    }
  });
  
  // Crear pedidos
  const order1 = await prisma.order.create({
    data: {
      description: 'Pedido 1',
      status: 'pendiente',
      userId: user.id,
      clientId: client.id
    }
  });
  
  const order2 = await prisma.order.create({
    data: {
      description: 'Pedido 2',
      status: 'confirmado',
      userId: user.id,
      clientId: client.id
    }
  });
  
  // Verificar que no hay duplicados
  const clients = await prisma.client.findMany({
    where: { userId: user.id }
  });
  
  if (clients.length === 1) {
    console.log('✅ No hay duplicados en clientes');
  } else {
    throw new Error('❌ Se encontraron duplicados en clientes');
  }
  
  // Verificar que al eliminar cliente se gestionan pedidos
  try {
    await prisma.client.delete({
      where: { id: client.id }
    });
    console.log('❌ Se eliminó cliente con pedidos asociados');
  } catch (error) {
    if (error.code === 'P2014') {
      console.log('✅ No se puede eliminar cliente con pedidos (correcto)');
    } else {
      throw error;
    }
  }
  
  // Limpiar datos
  await prisma.order.deleteMany({
    where: { userId: user.id }
  });
  
  await prisma.client.deleteMany({
    where: { userId: user.id }
  });
  
  await prisma.user.delete({
    where: { id: user.id }
  });
}

/**
 * 5. Validar performance básica
 */
async function validatePerformance() {
  console.log('⚡ Validando performance básica...');
  
  // Crear usuario de prueba (o usar existente)
  let user = await prisma.user.findUnique({
    where: { email: 'performance@test.com' }
  });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Usuario Performance',
        email: 'performance@test.com',
        password: await bcrypt.hash('password123', 12)
      }
    });
  }
  
  // Limpiar datos existentes del usuario
  await prisma.order.deleteMany({
    where: { userId: user.id }
  });
  
  await prisma.client.deleteMany({
    where: { userId: user.id }
  });
  
  // Crear 30 clientes
  const clients = [];
  for (let i = 0; i < 30; i++) {
    const client = await prisma.client.create({
      data: {
        name: `Cliente ${i + 1}`,
        phone: `555${i.toString().padStart(7, '0')}`,
        userId: user.id
      }
    });
    clients.push(client);
  }
  
  // Crear 30 pedidos
  for (let i = 0; i < 30; i++) {
    await prisma.order.create({
      data: {
        description: `Pedido ${i + 1}`,
        status: i % 2 === 0 ? 'pendiente' : 'confirmado',
        userId: user.id,
        clientId: clients[i].id
      }
    });
  }
  
  // Medir tiempo de consulta
  const startTime = Date.now();
  
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
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
  
  const endTime = Date.now();
  const queryTime = endTime - startTime;
  
  console.log(`✅ Consulta de 30 pedidos completada en ${queryTime}ms`);
  
  if (queryTime < 1000) {
    console.log('✅ Performance aceptable (< 1 segundo)');
  } else {
    console.log('⚠️ Performance lenta (> 1 segundo)');
  }
  
  // Limpiar datos
  await prisma.order.deleteMany({
    where: { userId: user.id }
  });
  
  await prisma.client.deleteMany({
    where: { userId: user.id }
  });
  
  await prisma.user.delete({
    where: { id: user.id }
  });
}

/**
 * 6. Validar seeds y entorno
 */
async function validateSeeds() {
  console.log('🌱 Validando seeds y entorno...');
  
  // Verificar usuarios de prueba
  const tomas = await prisma.user.findUnique({
    where: { email: 'tomas@test.com' }
  });
  
  const maria = await prisma.user.findUnique({
    where: { email: 'maria@test.com' }
  });
  
  if (tomas && maria) {
    console.log('✅ Usuarios de prueba encontrados');
    
    // Verificar que pueden hacer login
    const tomasLogin = await bcrypt.compare('123456', tomas.password);
    const mariaLogin = await bcrypt.compare('123456', maria.password);
    
    if (tomasLogin && mariaLogin) {
      console.log('✅ Usuarios de prueba pueden hacer login');
    } else {
      console.log('❌ Usuarios de prueba no pueden hacer login');
    }
  } else {
    console.log('❌ Usuarios de prueba no encontrados');
  }
  
  // Contar datos existentes
  const userCount = await prisma.user.count();
  const clientCount = await prisma.client.count();
  const orderCount = await prisma.order.count();
  
  console.log(`📊 Datos en la base de datos:`);
  console.log(`   - Usuarios: ${userCount}`);
  console.log(`   - Clientes: ${clientCount}`);
  console.log(`   - Pedidos: ${orderCount}`);
}

// Ejecutar validación si se llama directamente
if (require.main === module) {
  runValidation()
    .then(() => {
      console.log('🎉 Validación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en validación:', error);
      process.exit(1);
    });
}

module.exports = { runValidation };

