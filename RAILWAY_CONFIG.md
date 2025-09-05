# 🚂 Configuración de Railway - OmniWP Backend

## 🔧 **Variables de Entorno Requeridas**

Configura estas variables en tu proyecto de Railway:

### **Variables Obligatorias**:

1. **NODE_ENV**
   - **Valor**: `production`
   - **Descripción**: Define el entorno como producción

2. **DATABASE_URL**
   - **Valor**: `mongodb+srv://username:password@cluster.mongodb.net/omniwp?retryWrites=true&w=majority`
   - **Descripción**: URL de conexión a MongoDB Atlas

3. **JWT_SECRET**
   - **Valor**: `tu-secret-key-super-seguro-aqui`
   - **Descripción**: Clave secreta para firmar JWT

### **Variables Opcionales**:

4. **JWT_EXPIRES_IN**
   - **Valor**: `7d`
   - **Descripción**: Tiempo de expiración del JWT

5. **RATE_LIMIT_WINDOW_MS**
   - **Valor**: `900000`
   - **Descripción**: Ventana de tiempo para rate limiting (15 min)

6. **RATE_LIMIT_MAX_REQUESTS**
   - **Valor**: `100`
   - **Descripción**: Máximo de requests por ventana

## 📋 **Pasos para Configurar en Railway**:

1. **Ve a tu proyecto en Railway**
2. **Selecciona tu servicio backend**
3. **Ve a la pestaña "Variables"**
4. **Agrega cada variable** con su valor correspondiente
5. **Guarda los cambios**
6. **Reinicia el servicio** (Railway lo hará automáticamente)

## 🔍 **Verificación**:

Una vez configurado, los logs de Railway deberían mostrar:

```
🔧 Configuración CORS:
NODE_ENV: production
RAILWAY_ENVIRONMENT: production
RENDER: undefined
PORT: 3000
isProduction: true
allowedOrigins: [
  'https://omniwp-frontend.vercel.app',
  'https://omniwp.vercel.app',
  'https://www.omniwp.com'
]
```

## 🚨 **Problema Actual**:

El error que estás viendo indica que Railway está usando la configuración de desarrollo:

```
CORS: Orígenes permitidos: [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]
```

Esto significa que `NODE_ENV` no está configurado como `production` en Railway.

## ✅ **Solución**:

1. **Configurar NODE_ENV=production** en Railway
2. **Hacer commit y push** de los cambios del código
3. **Railway hará auto-deploy** con la nueva configuración
4. **Verificar** que los logs muestren `isProduction: true`

---

**¡Una vez configurado NODE_ENV=production, el CORS funcionará correctamente!** 🚀
