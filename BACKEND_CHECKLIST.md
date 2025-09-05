✅ Checklist de Entregables – Backend OmniWP (MVP)
📂 1. Configuración inicial

 package.json con dependencias:

express, prisma, @prisma/client, mongodb

zod, jsonwebtoken, bcryptjs

morgan, express-rate-limit, dotenv

 .env.example con:

DATABASE_URL=
JWT_SECRET=
PORT=


 Configuración de Prisma (schema.prisma) + npx prisma generate

 Script de arranque en package.json (npm run dev con nodemon)

🏗️ 2. Estructura del proyecto (src/)

 src/config/ → variables de entorno, templates, opciones de seguridad

 src/routes/ → definición de endpoints

 src/controllers/ → lógica de endpoints

 src/services/ → generación de templates y lógica de negocio

 src/middleware/ → auth JWT, validaciones Zod, rate limit

 src/utils/ → helpers (ej: formateo de errores, manejo de fechas)

🔐 3. Autenticación

 POST /auth/register con hash de password (bcrypt)

 POST /auth/login con JWT válido

 Middleware authMiddleware que valide token en endpoints privados

👥 4. Clientes

 GET /clients → listar clientes del usuario autenticado

 POST /clients → crear cliente (validación con Zod)

 PUT /clients/:id → actualizar cliente (validar propiedad del recurso)

 DELETE /clients/:id → eliminar cliente

📦 5. Pedidos

 GET /orders → listar pedidos del usuario autenticado

 POST /orders → crear pedido vinculado a cliente

 PUT /orders/:id → actualizar descripción/estado

 DELETE /orders/:id → eliminar pedido

💬 6. Mensajes

 POST /messages/template → devolver texto generado desde src/config/templates.js

 Soporte a templateType = confirmación, recordatorio, seguimiento

🛡️ 7. Seguridad

 Middleware JWT funcionando

 Rate limit en /auth/*

 Sanitización de inputs con Zod

 Manejo global de errores → respuestas consistentes:

{
  "error": true,
  "message": "Mensaje de error",
  "code": "ERROR_CODE"
}

📊 8. Seeds & Testing

 Script prisma/seed.js con:

Usuario test (test@test.com / 123456)

2 clientes de ejemplo

2 pedidos de ejemplo

 Endpoint /health que devuelva { "status": "ok" }

 Tests básicos con supertest o Postman collection exportada

📄 9. Documentación

 README con:

Setup local (npm install, env, prisma db push)

Endpoints (copiar el API Contract resumido)

Ejemplo de uso con curl o Postman

Deploy target (Railway/Render)

🚀 Criterio de "Done"

El backend se considera entregado cuando:
✔️ Todos los endpoints funcionan según API Contract.
✔️ Validaciones + seguridad básicas implementadas.
✔️ Seeds permiten al frontend probar flujo completo.
✔️ Documentación lista para devs.