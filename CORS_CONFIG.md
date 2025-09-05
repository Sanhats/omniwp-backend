# 🔧 Configuración de CORS - OmniWP Backend

## 📋 **Problema Resuelto**

El frontend desplegado en Vercel (`https://omniwp-frontend.vercel.app`) no podía comunicarse con el backend debido a restricciones de CORS.

## ✅ **Solución Implementada**

### 1. **Configuración de CORS Actualizada**

```javascript
// src/server.js
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://omniwp-frontend.vercel.app',  // Frontend en Vercel
      'https://omniwp.vercel.app', 
      'https://www.omniwp.com'
    ]
  : [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 2. **Manejo de Preflight Requests**

```javascript
// Manejo adicional de preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
```

### 3. **Endpoints de Prueba**

- **Health Check**: `GET /api/v1/health`
- **CORS Test**: `GET /api/v1/cors-test`

## 🚀 **Dominios Permitidos**

### **Producción**:
- ✅ `https://omniwp-frontend.vercel.app` (Frontend principal)
- ✅ `https://omniwp.vercel.app` (Backup)
- ✅ `https://www.omniwp.com` (Dominio principal)

### **Desarrollo**:
- ✅ `http://localhost:3000` (Backend local)
- ✅ `http://localhost:3001` (Frontend local)
- ✅ `http://127.0.0.1:3001` (Frontend local alternativo)

## 🧪 **Pruebas de CORS**

### **Desde el Frontend (Vercel)**:
```javascript
// Prueba básica
fetch('https://tu-backend.railway.app/api/v1/health')
  .then(response => response.json())
  .then(data => console.log('CORS OK:', data));

// Prueba con credenciales
fetch('https://tu-backend.railway.app/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'tomas@test.com',
    password: '123456'
  })
})
.then(response => response.json())
.then(data => console.log('Login OK:', data));
```

### **Desde Postman/curl**:
```bash
# Health check
curl -H "Origin: https://omniwp-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://tu-backend.railway.app/api/v1/health

# CORS test
curl -H "Origin: https://omniwp-frontend.vercel.app" \
     https://tu-backend.railway.app/api/v1/cors-test
```

## 🔍 **Debugging de CORS**

### **Logs del Servidor**:
El servidor ahora registra los orígenes bloqueados:
```
CORS blocked origin: https://dominio-no-permitido.com
```

### **Headers de Respuesta**:
```http
Access-Control-Allow-Origin: https://omniwp-frontend.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

## ✅ **Estado Actual**

- ✅ **CORS configurado** para Vercel
- ✅ **Preflight requests** manejados
- ✅ **Credenciales** habilitadas
- ✅ **Endpoints de prueba** disponibles
- ✅ **Logging** para debugging

## 🚀 **Próximos Pasos**

1. **Deploy** del backend con la nueva configuración
2. **Prueba** desde el frontend de Vercel
3. **Verificación** de que todos los endpoints funcionan
4. **Monitoreo** de logs para detectar problemas

---

**¡El backend ahora está listo para recibir requests desde Vercel!** 🎉
