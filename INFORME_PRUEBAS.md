# Informe de pruebas — App de usuarios

Fecha: 31 de octubre de 2026
Proyecto: API REST (Node.js, Express, MongoDB, JWT) + web (Vue 3, Vite, Vue Router)

## 1. Resumen por proyecto y tipo de prueba

| Proyecto | Herramienta | Nº pruebas | Pasan | Fallan | Cobertura (líneas / ramas / funciones / sentencias) |
| -------- | ----------- | ---------: | ----: | -----: | --------------------------------------------------- |
| API | Vitest + Supertest + mongodb-memory-server | 57 | 57 | 0 | 93.42% / 84.61% / 100% / 93.42% |
| Web | Vitest + Vue Test Utils + jsdom | 89 | 89 | 0 | 94.71% / 87.39% / 89.36% / 93.80% |
| E2E | Playwright (Chromium y Firefox) | 18 (9 flujos × 2 navegadores) | 18 | 0 | No aplica (Playwright no suma a coverage) |
| TestSprite | Agente de pruebas con IA | Pendiente | — | — | — |

Umbrales exigidos: 80% líneas, 80% funciones, 80% sentencias y 70% ramas. **Ambos proyectos los
cumplen** y `npm run coverage` termina con código de salida 0.

Comandos ejecutados:

```bash
cd api && npm test && npm run coverage
cd web && npm test && npm run coverage
cd web && npm run test:e2e
```

## 2. Detalle de lo que se probó

### API (57 pruebas)

- `tests/unit/`: `validarRol` (500 sin `req.usuario`, 403 y `next()`), `validarJWT` (sin token,
  token inválido, usuario inexistente/desactivado y token válido), `esRolValido`, `emailExiste`,
  `generarJWT` (payload `uid`/`rol` y firma) y el modelo `Usuario` (hash, `validarPassword`,
  `toJSON` sin `password`/`_id`, valores por defecto, normalización del email y no re-hash).
- `tests/integration/auth.test.js`: registro (201, rol forzado a `usuario`, email duplicado,
  contraseñas inválidas), login (200, credenciales inválidas, usuario desactivado), perfil
  (401/401/200 y actualización) y cambio de contraseña (actual incorrecta, nueva igual, éxito).
- `tests/integration/usuarios.test.js`: 401 sin token, 403 con rol usuario, listado y paginación,
  `limite=51` → 400, búsqueda + filtro de rol, id mal formado/existente/inexistente, creación con
  hash en la base, email duplicado, rol inválido, cambio de rol propio → 400, contraseña vacía,
  auto-eliminación → 400, borrado lógico (no se lista y no puede iniciar sesión), health, 404 y
  JSON mal formado.
- Aislamiento: `tests/setup.js` levanta `mongodb-memory-server`, vacía `usuarios` antes de cada
  prueba y desconecta al final; `tests/helpers.js` crea usuarios y tokens únicos.

### Web (89 pruebas)

- `utils/validators.js`: una prueba por regla de nombre, email, contraseña y confirmación, más
  `isValid`.
- `services/http.js`: header `x-token`, serialización JSON, query string, conversión de `{errores}`
  y `{error}` a `ApiError`, fallo de red (status 0) y 401 con/sin token.
- `services/authApi.js` y `usersApi.js`: cada método llama a `request` con la ruta y verbo correctos.
- `composables/useToast.js`: success/error, auto-cierre con temporizadores falsos y `dismiss`.
- `composables/useAuth.js`: login, register, logout, `setUser` y `restoreSession` (sin token, token
  válido y token inválido).
- Componentes: `AlertMessage`, `FormField` (error y mostrar/ocultar), `PaginationBar` (límites y
  evento `change`), `ConfirmDialog` (confirm/cancel), `ToastContainer` y `AppHeader`.
- Vistas: `LoginView` (validación local y error del servidor), `RegisterView`, `ProfileView`
  (perfil y contraseña), `UserFormView` (crear, editar, no encontrado y auto-edición),
  `UsersView` (listado, búsqueda, filtro, paginación, borrado y reintento), `NotFoundView` y `App`.
- Guardas del router: `requiresAuth`, `guestOnly`, `requiresAdmin`, redirección de `/` y 404.

### E2E (18 ejecuciones)

- Login incorrecto, registro con rol Usuario, redirección de usuario a `/perfil`, acceso sin sesión
  a `/usuarios`, ruta inexistente, creación/búsqueda/edición de usuario por el admin, borrado con
  confirmación y bloqueo posterior del login, filtro por rol + paginación, y cambio de contraseña
  con logout y nuevo login.
- La configuración usa `webServer` para levantar API y web, base `app-usuarios-e2e`, atributos
  `data-test`, captura en fallo y traza en el primer reintento.

## 3. Hallazgos de las pruebas y decisiones

| # | Hallazgo | ¿Dónde se detectó? | Decisión |
| - | -------- | ------------------ | -------- |
| 1 | El login distingue entre `"Credenciales inválidas"` y `"Usuario desactivado"`, lo que revela el estado de una cuenta. | `auth.test.js` (usuario desactivado) | Se mantuvo porque el requisito pide `401` y el comportamiento ya existía; se documenta como riesgo de información. Si se quisiera mitigar, ambos casos deberían devolver el mismo mensaje. |
| 2 | `toJSON()` devuelve `uid` como `ObjectId` en llamadas directas (solo se convierte a string al serializar la respuesta HTTP). | `usuario-model.test.js` | No es un error de la API (Express lo serializa bien). Se ajustó la prueba a comparar `String(uid)` y se mantuvo la cobertura del método. |
| 3 | La búsqueda de `UsersView` tiene un retardo (debounce) de 300 ms: durante ese tiempo se sigue viendo la lista anterior. | Pruebas E2E de crear/editar y eliminar | No es un defecto, pero hacía que Playwright interactuara con la fila equivocada. Se endurecieron las pruebas esperando a que la fila contenga el email buscado antes de pulsar Editar/Eliminar. |
| 4 | El borrado lógico también oculta al usuario en `GET /api/usuarios/:id` (responde 404). | `usuarios.test.js` | Es el comportamiento esperado según el PRD; queda cubierto para evitar regresiones. |

## 4. Análisis de cobertura

### API

| Archivo | Cobertura de líneas | Líneas sin cubrir | Explicación |
| ------- | ------------------: | ----------------- | ----------- |
| `app.js` | 79.16% | 44-54 | Ramas del manejador de errores para duplicado por índice único, `ValidationError` del Schema y error 500 genérico. No se simulan fallos de infraestructura. |
| `controllers/auth.js` | 88.05% | bloques `catch` y ramas de error | `next(error)` solo se ejecuta ante fallos inesperados de Mongoose; se probaron los caminos de negocio. |
| `controllers/usuarios.js` | 88.11% | bloques `catch` | Igual que el anterior: los caminos felices y las reglas de negocio están cubiertos. |
| `generar-jwt.js` | 100% líneas | rama 6 | La rama del valor por defecto de `JWT_EXPIRA` no se recorre porque la variable siempre está definida en las pruebas. |
| Resto (`middlewares`, `helpers`, `models`, `routes`) | 100% | — | Cubiertos por pruebas unitarias y de integración. |

Para subir la cobertura se añadieron pruebas unitarias de los middlewares con `vi.fn()`, del modelo
y de los helpers, además de los casos de error y de reglas de negocio en las pruebas de integración.

### Web

| Archivo | Cobertura de líneas | Líneas sin cubrir | Explicación |
| ------- | ------------------: | ----------------- | ----------- |
| `components/ConfirmDialog.vue` | 86.66% | 27, 34 | Rama de cierre con `Escape` y clic en el fondo; se prueba confirm/cancel con los botones. |
| `composables/useToast.js` | 100% | ramas 10, 16 | Ramas de `duration` falsy y de toast inexistente; se cubren success/error y auto-cierre. |
| `router/index.js` | 86.95% | 20, 32-38 | Ramas del redirect de `/` y del guard `requiresAdmin` ya cubiertas en parte; se añadieron pruebas de las guardas. |
| `views/UsersView.vue` | 86.36% | varias ramas | Reintento, filtros y paginación cubiertos; quedan ramas de limpieza de filtros y del botón de borrado deshabilitado. |
| `services/http.js` | 100% líneas | rama 39 | `data` nulo al parsear una respuesta no JSON; se cubren los dos formatos de error. |

Las pruebas de vistas se hicieron con la API simulada (`vi.mock`) para que sean rápidas y no
dependan de la red, y los componentes se montaron con Vue Test Utils y `jsdom`.

## 5. TestSprite

**Estado: pendiente de ejecución.** El taller exige una cuenta gratuita en testsprite.com y una API
key personal que no está disponible en este entorno (y que nunca debe subirse al repositorio). Ya
está preparado:

- `PRD.md` con endpoints, roles, reglas y cuentas del seed.
- `evidencias/testsprite/README.md` con los pasos para ejecutar TestSprite en API y web.
- Carpetas `evidencias/testsprite/api` y `evidencias/testsprite/web`.

Pasos para completarlo:

1. Configurar el servidor MCP `TestSprite` en el IDE con la API key.
2. Levantar `api` (`npm run seed && npm run dev`) y `web` (`npm run dev`).
3. Pedir al asistente: "Help me test this project with TestSprite" para backend (3000) y frontend
   (5173), cargando `PRD.md`.
4. Copiar `testsprite_tests/` a `evidencias/testsprite/api` y `evidencias/testsprite/web`.
5. Completar la siguiente tabla con los casos fallidos y repetir la ejecución.

| Caso | Descripción | Resultado | Causa | Decisión |
| ---- | ----------- | --------- | ----- | -------- |
| — | Pendiente de ejecución con API key | — | — | — |

### Comparación con las pruebas escritas a mano

Todavía no se puede hacer una comparación con resultados reales de TestSprite. Las pruebas
escritas a mano cubren reglas concretas y reproducibles (401/403, reglas de contraseña, borrado
lógico, guardas del router), mientras que TestSprite aporta casos exploratorios generados desde el
PRD que pueden descubrir combinaciones no previstas. Una vez ejecutado, se comparará qué encontró
la IA que no cubrían las pruebas manuales, qué no detectó y en qué conviene cada enfoque.

## 6. Evidencias

| Evidencia | Archivo |
| --------- | ------- |
| `npm test` en API | [`evidencias/coverage/api-test.txt`](./evidencias/coverage/api-test.txt) |
| `npm test` en web | [`evidencias/coverage/web-test.txt`](./evidencias/coverage/web-test.txt) |
| Cobertura en terminal (API) | [`evidencias/coverage/api-coverage.txt`](./evidencias/coverage/api-coverage.txt) |
| Cobertura en terminal (web) | [`evidencias/coverage/web-coverage.txt`](./evidencias/coverage/web-coverage.txt) |
| Tabla general de cobertura API | [`evidencias/coverage/api-coverage-tabla.png`](./evidencias/coverage/api-coverage-tabla.png) |
| Líneas sin cubrir API | [`evidencias/coverage/api-lineas-sin-cubrir.png`](./evidencias/coverage/api-lineas-sin-cubrir.png) |
| Tabla general de cobertura web | [`evidencias/coverage/web-coverage-tabla.png`](./evidencias/coverage/web-coverage-tabla.png) |
| Líneas sin cubrir web | [`evidencias/coverage/web-lineas-sin-cubrir.png`](./evidencias/coverage/web-lineas-sin-cubrir.png) |
| `coverage-summary.json` API | [`evidencias/coverage/api-coverage-summary.json`](./evidencias/coverage/api-coverage-summary.json) |
| `coverage-summary.json` web | [`evidencias/coverage/web-coverage-summary.json`](./evidencias/coverage/web-coverage-summary.json) |
| Reporte Playwright (captura) | [`evidencias/playwright/reporte-playwright.png`](./evidencias/playwright/reporte-playwright.png) |
| Reporte Playwright (HTML) | [`evidencias/playwright/reporte-html/index.html`](./evidencias/playwright/reporte-html/index.html) |
| TestSprite API/web | `evidencias/testsprite/` (pendiente) |
