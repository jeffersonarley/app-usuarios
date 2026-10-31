// ============================================================
// Arranque del servidor: conecta la base de datos, crea el
// administrador inicial y abre el puerto.
// Ejecutar: npm run dev / npm start
// ============================================================

import "dotenv/config";
import { dbConnection } from "./database/config.js";
import { crearAdminInicial } from "./database/seed.js";
import app from "./app.js";

// La BD primero, el servidor después
dbConnection()
  .then(async () => {
    const admin = await crearAdminInicial();
    if (admin) console.log(`Administrador inicial creado: ${admin.email}`);

    const puerto = process.env.PUERTO ?? 3000;
    app
      .listen(puerto, () => {
        console.log(`API en http://localhost:${puerto}/api`);
      })
      .on("error", (error) => {
        console.log(`No se pudo usar el puerto ${puerto}:`, error.message);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.log("No se pudo iniciar:", error.message);
  });
