# TestSprite — pendiente de ejecución

TestSprite necesita una **cuenta gratuita** y una **API key personal** (testsprite.com). La key
no se sube al repositorio; se configura solo en el servidor MCP del IDE.

## Configuración del servidor MCP

En VS Code / Cursor / Claude Code:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": { "API_KEY": "tu-api-key" }
    }
  }
}
```

## Pasos

1. Levantar la API y la web:
   ```bash
   cd api && npm run seed && npm run dev     # puerto 3000
   cd web && npm run dev                      # puerto 5173
   ```
2. En el asistente del IDE, pedir: **"Help me test this project with TestSprite"**.
3. Ejecución **backend** contra `http://localhost:3000` cargando `../../../PRD.md`.
4. Ejecución **frontend** contra `http://localhost:5173` cargando el mismo `PRD.md`.
5. Revisar y ajustar el plan antes de ejecutar. Analizar cada fallo (error real, requisito mal
   interpretado o problema de entorno) y corregir lo que sea un error real.
6. Copiar la carpeta generada `testsprite_tests/` (plan, casos y
   `TestSprite_MCP_Test_Report.md`/`.html`) a:
   - `evidencias/testsprite/api/`
   - `evidencias/testsprite/web/`
7. Añadir una captura PNG del panel de TestSprite con los resultados de ambas ejecuciones.
8. Completar la tabla de análisis de fallos en `INFORME_PRUEBAS.md` y hacer una segunda ejecución.
