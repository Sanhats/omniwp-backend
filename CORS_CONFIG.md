# Configuración de CORS para OmniWP Backend

## Problema Resuelto

El frontend en `localhost:3000` no podía conectarse al backend en Railway debido a políticas de CORS.

## Solución Implementada

### 1. Orígenes Permitidos

El backend ahora permite los siguientes orígenes:

**En Producción (Railway):**
- `https://omniwp-frontend.vercel.app`
- `https://omniwp.vercel.app`
- `https://www.omniwp.com`
- `http://localhost:3000` (si está habilitado)
- `http://localhost:3001` (si está habilitado)
- `http://127.0.0.1:3000` (si está habilitado)
- `http://127.0.0.1:3001` (si está habilitado)

**En Desarrollo:**
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

### 2. Variables de Entorno

Para controlar el comportamiento de CORS en producción:

```bash
# Permitir localhost en producción (para desarrollo)
ALLOW_LOCALHOST_IN_PRODUCTION=true

# Otras variables relevantes
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
```

### 3. Configuración de Headers

El backend envía los siguientes headers de CORS:

```
Access-Control-Allow-Origin: [origin específico]
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

### 4. Manejo de Preflight Requests

- Los requests OPTIONS son manejados correctamente
- Se envían todos los headers necesarios
- Se permite el origin específico o `*` para requests sin origin

## Cómo Usar

### Para Desarrollo Local

1. **Backend local + Frontend local:**
   ```bash
   # No se requiere configuración adicional
   npm run dev
   ```

2. **Backend en Railway + Frontend local:**
   ```bash
   # En Railway, configurar:
   ALLOW_LOCALHOST_IN_PRODUCTION=true
   ```

### Para Producción

1. **Backend en Railway + Frontend en Vercel:**
   ```bash
   # No se requiere configuración adicional
   # Los orígenes de Vercel están permitidos por defecto
   ```

## Pruebas

### Probar CORS Localmente

```bash
npm run test-cors
```

### Probar CORS en Railway

```bash
BACKEND_URL=https://omniwp-backend-production.up.railway.app npm run test-cors
```

## Debugging

### Verificar Logs del Servidor

En Railway, revisar los logs para ver:
- `CORS: Verificando origin: [origin]`
- `CORS: Origin permitido: [origin]` o `CORS: Origin bloqueado: [origin]`
- `CORS: Preflight request desde: [origin]`

### Verificar Headers en el Navegador

1. Abrir DevTools → Network
2. Hacer una request al backend
3. Verificar que los headers de CORS estén presentes
4. Si hay error, revisar la pestaña Console

## Solución de Problemas

### Error: "No 'Access-Control-Allow-Origin' header is present"

**Causa:** El origin no está en la lista de orígenes permitidos.

**Solución:**
1. Verificar que `ALLOW_LOCALHOST_IN_PRODUCTION=true` esté configurado en Railway
2. Verificar que el frontend esté usando `http://localhost:3000` (no `https://`)
3. Revisar los logs del servidor para confirmar el origin

### Error: "Response to preflight request doesn't pass access control check"

**Causa:** El request OPTIONS no está siendo manejado correctamente.

**Solución:**
1. Verificar que el endpoint soporte OPTIONS
2. Revisar que los headers de CORS estén configurados correctamente
3. Verificar que el servidor esté respondiendo con status 200 para OPTIONS

### Error: "Credentials flag is true, but Access-Control-Allow-Credentials is not 'true'"

**Causa:** El header `Access-Control-Allow-Credentials` no está configurado.

**Solución:**
1. Verificar que `credentials: true` esté configurado en CORS
2. Asegurar que el origin específico esté permitido (no `*`)

## Configuración Recomendada

### Para Desarrollo
```bash
# En .env local
NODE_ENV=development
# No se requiere ALLOW_LOCALHOST_IN_PRODUCTION
```

### Para Producción con Desarrollo
```bash
# En Railway
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
ALLOW_LOCALHOST_IN_PRODUCTION=true
```

### Para Producción Final
```bash
# En Railway
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
ALLOW_LOCALHOST_IN_PRODUCTION=false
# O simplemente no configurar la variable
```

## Notas Importantes

1. **Seguridad:** Solo habilitar `ALLOW_LOCALHOST_IN_PRODUCTION=true` durante desarrollo
2. **Performance:** Los orígenes se verifican en cada request
3. **Debugging:** Los logs detallados ayudan a identificar problemas de CORS
4. **Compatibilidad:** La configuración es compatible con todos los navegadores modernos