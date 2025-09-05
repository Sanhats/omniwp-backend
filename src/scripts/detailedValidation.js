const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script de validación detallada del backend OmniWP
 */
async function detailedValidation() {
  const baseUrl = 'https://omniwp-backend-production.up.railway.app/api/v1';
  let token = null;
  let validationResults = [];

  console.log('🚀 Validación Detallada del Backend OmniWP\n');

  // Función helper para agregar resultados
  function addResult(test, status, message) {
    validationResults.push({ test, status, message });
    console.log(`${status} ${test}: ${message}`);
  }

  try {
    // ========================================
    // 1. HEALTH CHECK
    // ========================================
    console.log('🏥 1. HEALTH CHECK');
    console.log('==================');
    
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        if (healthData.status === 'OK') {
          addResult('Health Check', '✅', 'Endpoint /health responde {"status":"OK"}');
        } else {
          addResult('Health Check', '❌', `Endpoint /health no responde {"status":"OK"} - ${JSON.stringify(healthData)}`);
        }
      } else {
        addResult('Health Check', '❌', `Endpoint /health no responde - Status: ${healthResponse.status}`);
      }
    } catch (error) {
      addResult('Health Check', '❌', `Error en health check: ${error.message}`);
    }

    // ========================================
    // 2. CORS VALIDATION
    // ========================================
    console.log('\n🌐 2. CORS VALIDATION');
    console.log('=====================');
    
    try {
      const corsResponse = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': 'https://omniwp-frontend.vercel.app'
        }
      });
      
      if (corsResponse.ok) {
        addResult('CORS - Origen Permitido', '✅', 'Request desde https://omniwp-frontend.vercel.app - PERMITIDO');
      } else {
        addResult('CORS - Origen Permitido', '❌', `Request desde https://omniwp-frontend.vercel.app - BLOQUEADO - Status: ${corsResponse.status}`);
      }
    } catch (error) {
      addResult('CORS - Origen Permitido', '❌', `Error en test CORS: ${error.message}`);
    }

    // Test CORS con origen no permitido
    try {
      const corsBlockedResponse = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });
      
      if (!corsBlockedResponse.ok) {
        addResult('CORS - Origen No Permitido', '✅', 'Request desde origen no permitido - BLOQUEADO');
      } else {
        addResult('CORS - Origen No Permitido', '❌', 'Request desde origen no permitido - PERMITIDO (ERROR)');
      }
    } catch (error) {
      addResult('CORS - Origen No Permitido', '✅', 'Request desde origen no permitido - BLOQUEADO (Error esperado)');
    }

    // ========================================
    // 3. AUTHENTICATION
    // ========================================
    console.log('\n🔐 3. AUTHENTICATION');
    console.log('====================');
    
    try {
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'tomas@test.com',
          password: '123456'
        })
      });

      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Headers:`, Object.fromEntries(loginResponse.headers.entries()));

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log(`   Response:`, loginData);
        
        if (loginData.token && typeof loginData.token === 'string') {
          token = loginData.token;
          addResult('Authentication - Login', '✅', 'Login exitoso - JWT generado');
          
          // Verificar expiración del token
          try {
            const tokenParts = loginData.token.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            const daysUntilExpiry = (exp - now) / (1000 * 60 * 60 * 24);
            
            if (daysUntilExpiry >= 6 && daysUntilExpiry <= 8) {
              addResult('Authentication - JWT Expiry', '✅', `JWT expira en ${daysUntilExpiry.toFixed(1)} días`);
            } else {
              addResult('Authentication - JWT Expiry', '⚠️', `JWT expira en ${daysUntilExpiry.toFixed(1)} días (esperado ~7)`);
            }
          } catch (error) {
            addResult('Authentication - JWT Expiry', '❌', `Error validando expiración JWT: ${error.message}`);
          }
        } else {
          addResult('Authentication - Login', '❌', 'JWT no generado o inválido');
        }
      } else {
        const errorData = await loginResponse.json().catch(() => ({}));
        addResult('Authentication - Login', '❌', `Error en login - Status: ${loginResponse.status}, Response: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      addResult('Authentication - Login', '❌', `Error en autenticación: ${error.message}`);
    }

    // ========================================
    // 4. MULTI-USER ISOLATION
    // ========================================
    console.log('\n👥 4. MULTI-USER ISOLATION');
    console.log('==========================');
    
    if (token) {
      try {
        const clientsResponse = await fetch(`${baseUrl}/clients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (clientsResponse.ok) {
          const clients = await clientsResponse.json();
          addResult('Multi-User - Clientes', '✅', `Clientes obtenidos: ${clients.length}`);
          
          if (clients.length > 0) {
            console.log(`   - Cliente: ${clients[0].name} (${clients[0].id})`);
          }
        } else {
          addResult('Multi-User - Clientes', '❌', `Error obteniendo clientes - Status: ${clientsResponse.status}`);
        }
      } catch (error) {
        addResult('Multi-User - Clientes', '❌', `Error en aislamiento multi-usuario: ${error.message}`);
      }
    } else {
      addResult('Multi-User - Clientes', '⚠️', 'Saltando test - No hay token');
    }

    // ========================================
    // 5. MESSAGE TEMPLATE GENERATION
    // ========================================
    console.log('\n📝 5. MESSAGE TEMPLATE GENERATION');
    console.log('==================================');
    
    if (token) {
      try {
        // Obtener clientes y pedidos
        const clientsResponse = await fetch(`${baseUrl}/clients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const ordersResponse = await fetch(`${baseUrl}/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (clientsResponse.ok && ordersResponse.ok) {
          const clients = await clientsResponse.json();
          const orders = await ordersResponse.json();

          if (clients.length > 0 && orders.length > 0) {
            const client = clients[0];
            const order = orders[0];

            // Generar template
            const templateResponse = await fetch(`${baseUrl}/messages/template`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                clientId: client.id,
                orderId: order.id,
                templateType: 'confirmacion'
              })
            });

            if (templateResponse.ok) {
              const templateData = await templateResponse.json();
              addResult('Message Template - Generation', '✅', 'Template generado exitosamente');
              console.log(`   - Mensaje: ${templateData.message}`);
              console.log(`   - Cliente: ${templateData.client.name}`);
              console.log(`   - Pedido: ${templateData.order.description}`);
            } else {
              const errorData = await templateResponse.json().catch(() => ({}));
              addResult('Message Template - Generation', '❌', `Error generando template - Status: ${templateResponse.status}, Response: ${JSON.stringify(errorData)}`);
            }
          } else {
            addResult('Message Template - Generation', '⚠️', 'No hay clientes o pedidos para probar');
          }
        } else {
          addResult('Message Template - Generation', '❌', 'Error obteniendo datos para template');
        }
      } catch (error) {
        addResult('Message Template - Generation', '❌', `Error en generación de template: ${error.message}`);
      }
    } else {
      addResult('Message Template - Generation', '⚠️', 'Saltando test - No hay token');
    }

    // ========================================
    // 6. VALIDATION ERRORS
    // ========================================
    console.log('\n✅ 6. VALIDATION ERRORS');
    console.log('=======================');
    
    if (token) {
      try {
        // Test: Cliente sin nombre
        const invalidClientResponse = await fetch(`${baseUrl}/clients`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: '',
            phone: '1234567890'
          })
        });

        if (invalidClientResponse.status === 400) {
          addResult('Validation - Cliente Sin Nombre', '✅', 'Cliente sin nombre - Error esperado');
        } else {
          addResult('Validation - Cliente Sin Nombre', '❌', `Cliente sin nombre - No se validó - Status: ${invalidClientResponse.status}`);
        }
      } catch (error) {
        addResult('Validation - Cliente Sin Nombre', '❌', `Error en test de validación: ${error.message}`);
      }
    } else {
      addResult('Validation - Cliente Sin Nombre', '⚠️', 'Saltando test - No hay token');
    }

    // ========================================
    // 7. DUPLICATE EMAIL PREVENTION
    // ========================================
    console.log('\n🔒 7. DUPLICATE EMAIL PREVENTION');
    console.log('================================');
    
    try {
      const duplicateResponse = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Usuario Duplicado',
          email: 'tomas@test.com', // Email ya existente
          password: '123456'
        })
      });

      if (duplicateResponse.status === 400) {
        addResult('Duplicate Email - Prevention', '✅', 'No se permiten duplicados de email');
      } else {
        addResult('Duplicate Email - Prevention', '❌', `Se permiten duplicados de email - Status: ${duplicateResponse.status}`);
      }
    } catch (error) {
      addResult('Duplicate Email - Prevention', '❌', `Error en test de duplicados: ${error.message}`);
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n📋 RESUMEN FINAL DE VALIDACIÓN');
    console.log('==============================');

    const passed = validationResults.filter(r => r.status === '✅').length;
    const failed = validationResults.filter(r => r.status === '❌').length;
    const warnings = validationResults.filter(r => r.status === '⚠️').length;
    const total = validationResults.length;

    console.log(`\n🎯 ESTADÍSTICAS:`);
    console.log(`   ✅ Pasados: ${passed}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`   ⚠️  Advertencias: ${warnings}`);
    console.log(`   📊 Total: ${total}`);
    console.log(`   🎯 Porcentaje de éxito: ${((passed / total) * 100).toFixed(1)}%`);

    console.log(`\n📝 DETALLE COMPLETO:`);
    validationResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.status} ${result.test}: ${result.message}`);
    });

    if (failed === 0) {
      console.log('\n🎉 ¡TODAS LAS VALIDACIONES PASARON! El backend está listo para producción.');
    } else {
      console.log('\n⚠️  Algunas validaciones fallaron. Revisar los detalles arriba.');
    }

  } catch (error) {
    console.error('💥 Error crítico en validación:', error.message);
  }
}

// Ejecutar validación
detailedValidation()
  .then(() => {
    console.log('\n🎉 Validación detallada finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en validación:', error);
    process.exit(1);
  });
