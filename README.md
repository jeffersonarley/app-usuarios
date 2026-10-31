# Taller de Pruebas de Software — App de usuarios

Proyecto del taller: API REST (Node.js, Express, MongoDB y JWT) + web (Vue 3, Vite y Vue Router)
con pruebas unitarias, de integración, de componentes, end-to-end y de cobertura.

## Integrantes

- _(Escribe aquí tu nombre y el de tu compañero/a)_

## Estructura

```
app-usuarios/
├── api/                 API + pruebas con Vitest y Supertest
│   ├── app.js           crea y exporta la app de Express (sin listen)
│   ├── server.js        conecta MongoDB y llama a listen()
│   └── tests/           setup, helpers, unit/ e integration/
├── web/                 web + pruebas con Vitest/Vue Test Utils y Playwright
│   ├── tests/unit/      validators, http, composables, componentes y vistas
│   └── e2e/             flujos con Playwright
├── evidencias/          reportes de cobertura, Playwright y TestSprite
├── PRD.md               requisitos usados por TestSprite
├── INFORME_PRUEBAS.md   resumen, hallazgos y análisis
└── README.md
```

## Requisitos

- Node.js 22 o superior.
- MongoDB local en `mongodb://127.0.0.1:27017` para `npm run seed` y las pruebas E2E
  (las pruebas de Vitest de la API usan `mongodb-memory-server`, no necesitan MongoDB).
- Para Playwright: `npx playwright install chromium firefox`.

## Instalación

```bash
cd api && npm install
cd ../web && npm install
cp ../api/.env.example ../api/.env   # solo si no existe
```

## API

```bash
cd api
npm run seed      # carga admin@demo.com / Admin123! y usuarios de ejemplo
npm run dev       # http://localhost:3000
npm test          # pruebas unitarias y de integración
npm run coverage  # reporte de cobertura con umbrales
```

## Web

```bash
cd web
npm run dev       # http://localhost:5173
npm test          # pruebas unitarias y de componentes
npm run coverage  # reporte de cobertura con umbrales
npm run test:e2e  # Playwright en Chromium y Firefox
```

Playwright levanta la API y la web automáticamente y usa la base
`app-usuarios-e2e` (nunca la de desarrollo). Requiere MongoDB escuchando en el puerto 27017.

## Cuentas de prueba

| Rol     | Email           | Contraseña  |
| ------- | --------------- | ----------- |
| Admin   | `admin@demo.com` | `Admin123!` |
| Usuario | `ana@demo.com`   | `Usuario123` |

## TestSprite

El plan de pruebas de TestSprite se genera a partir de [`PRD.md`](./PRD.md). Consulta
[`evidencias/testsprite/README.md`](./evidencias/testsprite/README.md) para los pasos de
ejecución (requiere una API key personal, que no se sube al repositorio).

## Resultados

Consulta [`INFORME_PRUEBAS.md`](./INFORME_PRUEBAS.md) para el resumen de pruebas, cobertura,
hallazgos y comparación con TestSprite.
