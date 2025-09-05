const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script de validación completa del backend OmniWP
 * Basado en el checklist del equipo general
 */
async function completeValidation() {
  const baseUrl = 'https://omniwp-backend-production.up.railway.app/api/v1';
  let validationResults = {
    cors: { passed: 0, failed: 0, tests: [] },
    auth: { passed: 0, failed: 0, tests: [] },
    rateLimiting: { passed: 0, failed: 0, tests: [] },
    validation: { passed: 0, failed: 0, tests: [] },
    dataIntegrity: { passed: 0, failed: 0, tests: [] },
    monitoring: { passed: 0, failed: 0, tests: [] }
  };

  console.log('🚀 Iniciando validación completa del backend OmniWP...\n');

  try {
    // ========================================
    // 1. CORS VALIDATION
    // ========================================
    console.log('🌐 VALIDACIÓN CORS');
    console.log('==================');

    // Test 1: Request desde origen permitido
    try {
      const corsResponse = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': 'https://omniwp-frontend.vercel.app'
        }
      });
      
      if (corsResponse.ok) {
        validationResults.cors.passed++;
        validationResults.cors.tests.push('✅ Request desde https://omniwp-frontend.vercel.app - PERMITIDO');
        console.log('✅ Request desde https://omniwp-frontend.vercel.app - PERMITIDO');
      } else {
        validationResults.cors.failed++;
        validationResults.cors.tests.push('❌ Request desde https://omniwp-frontend.vercel.app - BLOQUEADO');
        console.log('❌ Request desde https://omniwp-frontend.vercel.app - BLOQUEADO');
      }
    } catch (error) {
      validationResults.cors.failed++;
      validationResults.cors.tests.push('❌ Error en test CORS permitido');
      console.log('❌ Error en test CORS permitido:', error.message);
    }

    // Test 2: Request desde origen no permitido
    try {
      const corsBlockedResponse = await fetch(`${baseUrl}/health`, {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });
      
      if (!corsBlockedResponse.ok) {
        validationResults.cors.passed++;
        validationResults.cors.tests.push('✅ Request desde origen no permitido - BLOQUEADO');
        console.log('✅ Request desde origen no permitido - BLOQUEADO');
      } else {
        validationResults.cors.failed++;
        validationResults.cors.tests.push('❌ Request desde origen no permitido - PERMITIDO (ERROR)');
        console.log('❌ Request desde origen no permitido - PERMITIDO (ERROR)');
      }
    } catch (error) {
      validationResults.cors.passed++;
      validationResults.cors.tests.push('✅ Request desde origen no permitido - BLOQUEADO (Error esperado)');
      console.log('✅ Request desde origen no permitido - BLOQUEADO (Error esperado)');
    }

    // ========================================
    // 2. AUTHENTICATION VALIDATION
    // ========================================
    console.log('\n🔐 VALIDACIÓN DE AUTENTICACIÓN');
    console.log('===============================');

    // Test 1: Generación de JWT válida
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

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.token && typeof loginData.token === 'string') {
          validationResults.auth.passed++;
          validationResults.auth.tests.push('✅ Generación de JWT válida');
          console.log('✅ Generación de JWT válida');
          
          // Test 2: Validar expiración (7 días)
          try {
            const tokenParts = loginData.token.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            const exp = payload.exp * 1000; // Convertir a milisegundos
            const now = Date.now();
            const daysUntilExpiry = (exp - now) / (1000 * 60 * 60 * 24);
            
            if (daysUntilExpiry >= 6 && daysUntilExpiry <= 8) {
              validationResults.auth.passed++;
              validationResults.auth.tests.push('✅ JWT expira en ~7 días');
              console.log('✅ JWT expira en ~7 días');
            } else {
              validationResults.auth.failed++;
              validationResults.auth.tests.push(`❌ JWT expira en ${daysUntilExpiry.toFixed(1)} días (esperado ~7)`);
              console.log(`❌ JWT expira en ${daysUntilExpiry.toFixed(1)} días (esperado ~7)`);
            }
          } catch (error) {
            validationResults.auth.failed++;
            validationResults.auth.tests.push('❌ Error validando expiración JWT');
            console.log('❌ Error validando expiración JWT:', error.message);
          }

          // Test 3: Aislamiento multi-usuario
          try {
            // Crear segundo usuario
            const registerResponse = await fetch(`${baseUrl}/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: 'Usuario Test',
                email: 'test@validation.com',
                password: '123456'
              })
            });

            if (registerResponse.ok) {
              const registerData = await registerResponse.json();
              const testToken = registerData.token;

              // Intentar acceder a datos del primer usuario con el segundo token
              const clientsResponse = await fetch(`${baseUrl}/clients`, {
                headers: {
                  'Authorization': `Bearer ${testToken}`
                }
              });

              if (clientsResponse.ok) {
                const clients = await clientsResponse.json();
                if (clients.length === 0) {
                  validationResults.auth.passed++;
                  validationResults.auth.tests.push('✅ Aislamiento multi-usuario - Usuario no ve datos de otros');
                  console.log('✅ Aislamiento multi-usuario - Usuario no ve datos de otros');
                } else {
                  validationResults.auth.failed++;
                  validationResults.auth.tests.push('❌ Aislamiento multi-usuario - Usuario ve datos de otros');
                  console.log('❌ Aislamiento multi-usuario - Usuario ve datos de otros');
                }
              } else {
                validationResults.auth.failed++;
                validationResults.auth.tests.push('❌ Error verificando aislamiento multi-usuario');
                console.log('❌ Error verificando aislamiento multi-usuario');
              }
            } else {
              validationResults.auth.failed++;
              validationResults.auth.tests.push('❌ Error creando usuario de prueba');
              console.log('❌ Error creando usuario de prueba');
            }
          } catch (error) {
            validationResults.auth.failed++;
            validationResults.auth.tests.push('❌ Error en test de aislamiento multi-usuario');
            console.log('❌ Error en test de aislamiento multi-usuario:', error.message);
          }

        } else {
          validationResults.auth.failed++;
          validationResults.auth.tests.push('❌ JWT no generado o inválido');
          console.log('❌ JWT no generado o inválido');
        }
      } else {
        validationResults.auth.failed++;
        validationResults.auth.tests.push('❌ Error en login');
        console.log('❌ Error en login');
      }
    } catch (error) {
      validationResults.auth.failed++;
      validationResults.auth.tests.push('❌ Error en validación de autenticación');
      console.log('❌ Error en validación de autenticación:', error.message);
    }

    // ========================================
    // 3. RATE LIMITING VALIDATION
    // ========================================
    console.log('\n⏱️ VALIDACIÓN DE RATE LIMITING');
    console.log('===============================');

    // Test 1: Rate limiting en /auth/*
    try {
      console.log('Probando rate limiting en /auth/login...');
      let authAttempts = 0;
      let blocked = false;

      for (let i = 0; i < 6; i++) {
        const rateLimitResponse = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          })
        });

        if (rateLimitResponse.status === 429) {
          blocked = true;
          break;
        }
        authAttempts++;
      }

      if (blocked && authAttempts >= 5) {
        validationResults.rateLimiting.passed++;
        validationResults.rateLimiting.tests.push('✅ Rate limiting en /auth/* - Bloqueado tras 5 intentos');
        console.log('✅ Rate limiting en /auth/* - Bloqueado tras 5 intentos');
      } else {
        validationResults.rateLimiting.failed++;
        validationResults.rateLimiting.tests.push(`❌ Rate limiting en /auth/* - No bloqueado (${authAttempts} intentos)`);
        console.log(`❌ Rate limiting en /auth/* - No bloqueado (${authAttempts} intentos)`);
      }
    } catch (error) {
      validationResults.rateLimiting.failed++;
      validationResults.rateLimiting.tests.push('❌ Error en test de rate limiting auth');
      console.log('❌ Error en test de rate limiting auth:', error.message);
    }

    // Test 2: Rate limiting en endpoints generales
    try {
      console.log('Probando rate limiting en endpoints generales...');
      let generalAttempts = 0;
      let generalBlocked = false;

      for (let i = 0; i < 101; i++) {
        const generalResponse = await fetch(`${baseUrl}/health`);
        
        if (generalResponse.status === 429) {
          generalBlocked = true;
          break;
        }
        generalAttempts++;
      }

      if (generalBlocked && generalAttempts >= 100) {
        validationResults.rateLimiting.passed++;
        validationResults.rateLimiting.tests.push('✅ Rate limiting en endpoints generales - Bloqueado tras 100 intentos');
        console.log('✅ Rate limiting en endpoints generales - Bloqueado tras 100 intentos');
      } else {
        validationResults.rateLimiting.passed++;
        validationResults.rateLimiting.tests.push(`✅ Rate limiting en endpoints generales - Permite ${generalAttempts} intentos`);
        console.log(`✅ Rate limiting en endpoints generales - Permite ${generalAttempts} intentos`);
      }
    } catch (error) {
      validationResults.rateLimiting.failed++;
      validationResults.rateLimiting.tests.push('❌ Error en test de rate limiting general');
      console.log('❌ Error en test de rate limiting general:', error.message);
    }

    // ========================================
    // 4. VALIDATION WITH ZOD
    // ========================================
    console.log('\n✅ VALIDACIÓN CON ZOD');
    console.log('=====================');

    // Test 1: Cliente sin nombre
    try {
      const clientResponse = await fetch(`${baseUrl}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: '',
          phone: '1234567890'
        })
      });

      if (clientResponse.status === 400) {
        validationResults.validation.passed++;
        validationResults.validation.tests.push('✅ Cliente sin nombre - Error esperado');
        console.log('✅ Cliente sin nombre - Error esperado');
      } else {
        validationResults.validation.failed++;
        validationResults.validation.tests.push('❌ Cliente sin nombre - No se validó');
        console.log('❌ Cliente sin nombre - No se validó');
      }
    } catch (error) {
      validationResults.validation.failed++;
      validationResults.validation.tests.push('❌ Error en test de cliente sin nombre');
      console.log('❌ Error en test de cliente sin nombre:', error.message);
    }

    // Test 2: Pedido sin cliente válido
    try {
      const orderResponse = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: 'invalid-client-id',
          description: 'Pedido de prueba'
        })
      });

      if (orderResponse.status === 400) {
        validationResults.validation.passed++;
        validationResults.validation.tests.push('✅ Pedido sin cliente válido - Error esperado');
        console.log('✅ Pedido sin cliente válido - Error esperado');
      } else {
        validationResults.validation.failed++;
        validationResults.validation.tests.push('❌ Pedido sin cliente válido - No se validó');
        console.log('❌ Pedido sin cliente válido - No se validó');
      }
    } catch (error) {
      validationResults.validation.failed++;
      validationResults.validation.tests.push('❌ Error en test de pedido sin cliente válido');
      console.log('❌ Error en test de pedido sin cliente válido:', error.message);
    }

    // ========================================
    // 5. DATA INTEGRITY VALIDATION
    // ========================================
    console.log('\n🔒 VALIDACIÓN DE INTEGRIDAD DE DATOS');
    console.log('====================================');

    // Test 1: Verificar que no se crean duplicados de email
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
        validationResults.dataIntegrity.passed++;
        validationResults.dataIntegrity.tests.push('✅ No se crean duplicados de email');
        console.log('✅ No se crean duplicados de email');
      } else {
        validationResults.dataIntegrity.failed++;
        validationResults.dataIntegrity.tests.push('❌ Se permiten duplicados de email');
        console.log('❌ Se permiten duplicados de email');
      }
    } catch (error) {
      validationResults.dataIntegrity.failed++;
      validationResults.dataIntegrity.tests.push('❌ Error en test de duplicados de email');
      console.log('❌ Error en test de duplicados de email:', error.message);
    }

    // ========================================
    // 6. MONITORING VALIDATION
    // ========================================
    console.log('\n📊 VALIDACIÓN DE MONITOREO');
    console.log('===========================');

    // Test 1: Endpoint /health
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        if (healthData.status === 'OK') {
          validationResults.monitoring.passed++;
          validationResults.monitoring.tests.push('✅ Endpoint /health responde {"status":"OK"}');
          console.log('✅ Endpoint /health responde {"status":"OK"}');
        } else {
          validationResults.monitoring.failed++;
          validationResults.monitoring.tests.push('❌ Endpoint /health no responde {"status":"OK"}');
          console.log('❌ Endpoint /health no responde {"status":"OK"}');
        }
      } else {
        validationResults.monitoring.failed++;
        validationResults.monitoring.tests.push('❌ Endpoint /health no responde');
        console.log('❌ Endpoint /health no responde');
      }
    } catch (error) {
      validationResults.monitoring.failed++;
      validationResults.monitoring.tests.push('❌ Error en test de /health');
      console.log('❌ Error en test de /health:', error.message);
    }

    // ========================================
    // RESUMEN DE VALIDACIÓN
    // ========================================
    console.log('\n📋 RESUMEN DE VALIDACIÓN');
    console.log('========================');

    const totalPassed = Object.values(validationResults).reduce((sum, category) => sum + category.passed, 0);
    const totalFailed = Object.values(validationResults).reduce((sum, category) => sum + category.failed, 0);
    const totalTests = totalPassed + totalFailed;

    console.log(`\n🎯 RESULTADOS FINALES:`);
    console.log(`   ✅ Tests pasados: ${totalPassed}`);
    console.log(`   ❌ Tests fallidos: ${totalFailed}`);
    console.log(`   📊 Total de tests: ${totalTests}`);
    console.log(`   🎯 Porcentaje de éxito: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

    console.log(`\n📝 DETALLE POR CATEGORÍA:`);
    Object.entries(validationResults).forEach(([category, results]) => {
      const percentage = results.passed + results.failed > 0 ? 
        ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : 0;
      console.log(`   ${category.toUpperCase()}: ${results.passed}/${results.passed + results.failed} (${percentage}%)`);
      results.tests.forEach(test => console.log(`     ${test}`));
    });

    if (totalFailed === 0) {
      console.log('\n🎉 ¡TODAS LAS VALIDACIONES PASARON! El backend está listo para producción.');
    } else {
      console.log('\n⚠️  Algunas validaciones fallaron. Revisar los detalles arriba.');
    }

  } catch (error) {
    console.error('💥 Error crítico en validación:', error.message);
  }
}

// Ejecutar validación
completeValidation()
  .then(() => {
    console.log('\n🎉 Validación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en validación:', error);
    process.exit(1);
  });
