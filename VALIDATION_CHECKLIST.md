# 📋 Checklist de Validación con Usuarios Reales – OmniWP (MVP)

## 🔐 **Backend - Validación Previa**

### ✅ **1. Seguridad**

#### **JWT Expiration**
- [ ] **Confirmar que JWT expira correctamente**
  ```bash
  # Probar con token expirado
  curl -H "Authorization: Bearer <token_expirado>" \
       https://tu-backend.railway.app/api/v1/clients
  # Debe devolver 401 Unauthorized
  ```

#### **Multi-User Isolation**
- [ ] **Verificar que no se pueda acceder a datos de otro usuario**
  ```bash
  # Login como usuario 1
  TOKEN1=$(curl -X POST https://tu-backend.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tomas@test.com","password":"123456"}' | jq -r '.token')
  
  # Login como usuario 2
  TOKEN2=$(curl -X POST https://tu-backend.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"maria@test.com","password":"123456"}' | jq -r '.token')
  
  # Crear cliente con usuario 1
  CLIENT_ID=$(curl -X POST https://tu-backend.railway.app/api/v1/clients \
    -H "Authorization: Bearer $TOKEN1" \
    -H "Content-Type: application/json" \
    -d '{"name":"Cliente Usuario 1","phone":"1111111111"}' | jq -r '.id')
  
  # Intentar acceder con usuario 2 (debe fallar)
  curl -X GET https://tu-backend.railway.app/api/v1/clients/$CLIENT_ID \
    -H "Authorization: Bearer $TOKEN2"
  # Debe devolver 404 o error
  ```

#### **Rate Limiting**
- [ ] **Probar que el rate limiting en /auth/* funciona**
  ```bash
  # Hacer múltiples requests de login rápidamente
  for i in {1..10}; do
    curl -X POST https://tu-backend.railway.app/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"tomas@test.com","password":"123456"}' &
  done
  wait
  # Algunos requests deben devolver 429 Too Many Requests
  ```

### ✅ **2. Datos y Consistencia**

#### **Duplicados**
- [ ] **Revisar que no existan duplicados al crear clientes/pedidos**
  ```bash
  # Crear cliente duplicado
  curl -X POST https://tu-backend.railway.app/api/v1/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Cliente Duplicado","phone":"5555555555"}'
  
  curl -X POST https://tu-backend.railway.app/api/v1/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Cliente Duplicado","phone":"5555555555"}'
  
  # Verificar que solo hay uno en la lista
  curl -H "Authorization: Bearer $TOKEN" \
       https://tu-backend.railway.app/api/v1/clients | jq 'length'
  ```

#### **Gestión de Pedidos Asociados**
- [ ] **Validar que al eliminar un cliente se gestionen sus pedidos asociados**
  ```bash
  # Crear cliente y pedido
  CLIENT_ID=$(curl -X POST https://tu-backend.railway.app/api/v1/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Cliente Test","phone":"6666666666"}' | jq -r '.id')
  
  ORDER_ID=$(curl -X POST https://tu-backend.railway.app/api/v1/orders \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"clientId\":\"$CLIENT_ID\",\"description\":\"Pedido Test\"}" | jq -r '.id')
  
  # Intentar eliminar cliente (debe fallar)
  curl -X DELETE https://tu-backend.railway.app/api/v1/clients/$CLIENT_ID \
    -H "Authorization: Bearer $TOKEN"
  # Debe devolver 400 con mensaje de error
  
  # Eliminar pedido primero
  curl -X DELETE https://tu-backend.railway.app/api/v1/orders/$ORDER_ID \
    -H "Authorization: Bearer $TOKEN"
  
  # Ahora eliminar cliente (debe funcionar)
  curl -X DELETE https://tu-backend.railway.app/api/v1/clients/$CLIENT_ID \
    -H "Authorization: Bearer $TOKEN"
  ```

#### **Mensajes de Error**
- [ ] **Confirmar mensajes de error claros y consistentes**
  ```bash
  # Probar diferentes errores
  curl -X POST https://tu-backend.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"noexiste@test.com","password":"123456"}'
  # Debe devolver: {"error":true,"message":"Credenciales inválidas","code":"INVALID_CREDENTIALS"}
  
  curl -X GET https://tu-backend.railway.app/api/v1/clients/invalid-id \
    -H "Authorization: Bearer $TOKEN"
  # Debe devolver: {"error":true,"message":"Cliente no encontrado","code":"CLIENT_NOT_FOUND"}
  ```

### ✅ **3. Performance Básica**

#### **Carga de Datos**
- [ ] **Prueba con al menos 20-30 clientes y pedidos por usuario**
  ```bash
  # Ejecutar script de validación automática
  npm run validate
  
  # O crear datos manualmente
  for i in {1..25}; do
    # Crear cliente
    CLIENT_ID=$(curl -X POST https://tu-backend.railway.app/api/v1/clients \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Cliente $i\",\"phone\":\"555$i\"}" | jq -r '.id')
    
    # Crear pedido
    curl -X POST https://tu-backend.railway.app/api/v1/orders \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"clientId\":\"$CLIENT_ID\",\"description\":\"Pedido $i\"}"
  done
  
  # Medir tiempo de respuesta
  time curl -H "Authorization: Bearer $TOKEN" \
            https://tu-backend.railway.app/api/v1/clients
  ```

#### **Monitoreo**
- [ ] **Endpoint /health monitoreado**
  ```bash
  # Verificar health check
  curl https://tu-backend.railway.app/api/v1/health
  
  # Configurar UptimeRobot o similar para monitorear:
  # URL: https://tu-backend.railway.app/api/v1/health
  # Intervalo: 5 minutos
  # Timeout: 30 segundos
  ```

### ✅ **4. Seeds y Entorno de Testing**

#### **Usuarios de Prueba**
- [ ] **Confirmar que los usuarios de prueba funcionan en producción**
  ```bash
  # Login con tomas@test.com
  curl -X POST https://tu-backend.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tomas@test.com","password":"123456"}'
  
  # Login con maria@test.com
  curl -X POST https://tu-backend.railway.app/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"maria@test.com","password":"123456"}'
  ```

#### **Reset de Datos**
- [ ] **Resetear datos de prueba si es necesario**
  ```bash
  # Ejecutar reset completo
  npm run db:reset
  
  # O solo seed
  npm run db:seed
  ```

## 🎯 **Script de Validación Automática**

### **Ejecutar validación completa:**
```bash
npm run validate
```

### **Validaciones incluidas:**
- ✅ JWT expiration
- ✅ Multi-user isolation
- ✅ Data consistency
- ✅ Performance básica
- ✅ Seeds y entorno

## 📊 **Criterios de Aprobación**

### **Backend debe cumplir:**
- [ ] **Seguridad**: JWT expira, multi-user isolation, rate limiting
- [ ] **Datos**: Sin duplicados, consistencia, mensajes de error claros
- [ ] **Performance**: < 1 segundo para consultas con 30+ registros
- [ ] **Monitoreo**: Health check funcionando
- [ ] **Testing**: Usuarios de prueba funcionando

### **Una vez aprobado:**
- [ ] **Documentar resultados** de validación
- [ ] **Configurar monitoreo** en producción
- [ ] **Preparar datos** para usuarios reales
- [ ] **Comunicar al equipo** que el backend está listo

---

**🎉 Una vez completado este checklist, el backend estará listo para validación con usuarios reales!**

