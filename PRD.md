# PRD — App de usuarios (API + web)

Documento de requisitos usado como entrada para las pruebas asistidas por IA (TestSprite).

## Objetivo

Describir el comportamiento esperado de la _App de usuarios_: una API REST (Node.js, Express,
MongoDB y JWT) y una aplicación web (Vue 3, Vite y Vue Router) que permiten registrarse, iniciar
sesión, gestionar el perfil y, a los administradores, administrar el CRUD de usuarios.

## Entorno

| Componente | URL                     |
| ---------- | ----------------------- |
| API        | http://localhost:3000   |
| Web        | http://localhost:5173   |

La web consume la API a través del proxy `/api`. El token JWT viaja en el header `x-token`.

## Roles

- **usuario**: puede ver y editar su perfil y cambiar su contraseña.
- **admin**: además, puede listar, crear, editar y eliminar usuarios.

## Autenticación

- `POST /api/auth/registro` es público. **Siempre** crea usuarios con rol `usuario`, aunque el body
  envíe `rol: "admin"`.
- `POST /api/auth/login` devuelve `token` y `usuario` (con `uid`, sin `password`).
- Las rutas protegidas sin token responden `401`; con token de rol insuficiente, `403`.
- Un usuario con `estado: false` (borrado lógico) no puede iniciar sesión.

## Reglas de contraseña

- Entre 8 y 64 caracteres.
- Al menos una mayúscula, una minúscula y un número.
- Se guarda hasheada con bcrypt; nunca se devuelve en las respuestas JSON.
- Al cambiar la contraseña, la actual debe ser correcta y la nueva debe ser distinta.

## Endpoints de la API

| Método | Ruta                   | Acceso | Descripción                                                        |
| ------ | ---------------------- | ------ | ------------------------------------------------------------------ |
| GET    | `/api/health`          | Público | Responde `200 { status: "ok" }`.                                  |
| POST   | `/api/auth/registro`   | Público | Crea una cuenta con rol `usuario`.                                |
| POST   | `/api/auth/login`      | Público | Valida credenciales y devuelve token.                             |
| GET    | `/api/auth/perfil`     | Sesión | Devuelve el usuario autenticado.                                  |
| PUT    | `/api/auth/perfil`     | Sesión | Actualiza nombre y email propios.                                 |
| PUT    | `/api/auth/password`   | Sesión | Cambia la contraseña.                                             |
| GET    | `/api/usuarios`        | Admin  | Lista con `buscar`, `rol`, `pagina` y `limite` (máx. 50).        |
| GET    | `/api/usuarios/:id`    | Admin  | Devuelve un usuario activo.                                       |
| POST   | `/api/usuarios`        | Admin  | Crea un usuario.                                                  |
| PUT    | `/api/usuarios/:id`    | Admin  | Actualiza parcialmente; contraseña vacía = no se cambia.         |
| DELETE | `/api/usuarios/:id`    | Admin  | Borrado lógico (`estado: false`).                                 |

## Reglas de negocio

1. El email es único (se normaliza a minúsculas) y `GET /api/usuarios?limite=51` responde `400`.
2. Un administrador **no puede cambiar su propio rol** (`400`).
3. Un administrador **no puede eliminarse a sí mismo** (`400`).
4. El borrado es lógico: el usuario deja de aparecer en el listado y no puede iniciar sesión.
5. El listado solo incluye usuarios activos y permite buscar por nombre o email y filtrar por rol.
6. Los ids mal formados responden `400`; un id válido inexistente, `404`.
7. Un body con JSON mal formado responde `400` con
   `"El cuerpo de la petición no es un JSON válido"`.

## Cuentas del seed

| Rol   | Email           | Contraseña   |
| ----- | --------------- | ------------ |
| admin | `admin@demo.com` | `Admin123!`  |
| usuario | `ana@demo.com` | `Usuario123` |

## Web

- `/login` y `/registro` son solo para invitados; con sesión redirigen al inicio.
- `/perfil` requiere sesión.
- `/usuarios` y sus formularios requieren sesión **y** rol `admin`; un usuario normal es
  redirigido a `/perfil`.
- Una ruta inexistente muestra la página "Página no encontrada".
- El admin puede crear, buscar, editar y eliminar usuarios con confirmación.
- El usuario puede cambiar su contraseña, cerrar sesión y volver a entrar con la nueva.

## Criterios de aceptación

- Todas las pruebas automatizadas (`npm test`) pasan en `api/` y `web/`.
- La cobertura cumple: 80% líneas, funciones y sentencias; 70% ramas.
- Los flujos E2E pasan en Chromium y Firefox.
