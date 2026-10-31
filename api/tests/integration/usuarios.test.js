import { describe, expect, it } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Usuario from "../../models/usuario.js";
import { crearUsuario, tokenAdmin, tokenUsuario, usuarioConToken } from "../helpers.js";

describe("GET /api/usuarios", () => {
  it("sin token responde 401", async () => {
    const res = await request(app).get("/api/usuarios");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No hay token en la petición");
  });

  it("con token de rol usuario responde 403", async () => {
    const token = await tokenUsuario();

    const res = await request(app).get("/api/usuarios").set("x-token", token);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("No tiene permisos para esto");
  });

  it("con token de admin responde 200 con la paginación y solo usuarios activos", async () => {
    const token = await tokenAdmin();
    await crearUsuario({ email: "activo@test.com" });
    await crearUsuario({ email: "inactivo@test.com", estado: false });

    const res = await request(app).get("/api/usuarios").set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ pagina: 1, limite: 10, total: 2, totalPaginas: 1 });
    expect(res.body.usuarios).toHaveLength(2);
    expect(res.body.usuarios.every((u) => u.estado !== false)).toBe(true);
    expect(res.body.usuarios.every((u) => u.password === undefined)).toBe(true);
  });

  it("con limite=51 responde 400 porque el máximo es 50", async () => {
    const token = await tokenAdmin();

    const res = await request(app).get("/api/usuarios?limite=51").set("x-token", token);

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "limite")).toBe(true);
  });

  it("combina la búsqueda por nombre con el filtro de rol", async () => {
    const token = await tokenAdmin();
    await crearUsuario({ nombre: "Ana Torres", email: "torres@test.com", rol: "usuario" });
    await crearUsuario({ nombre: "Ana Admin", email: "jefa@test.com", rol: "admin" });
    await crearUsuario({ nombre: "Luis Gómez", email: "luis@test.com", rol: "usuario" });

    const res = await request(app).get("/api/usuarios?buscar=ana&rol=usuario").set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.usuarios[0].email).toBe("torres@test.com");
    expect(res.body.usuarios[0].rol).toBe("usuario");
  });

  it("con un rol inexistente en el filtro responde 400", async () => {
    const token = await tokenAdmin();

    const res = await request(app).get("/api/usuarios?rol=superadmin").set("x-token", token);

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "rol")).toBe(true);
  });
});

describe("GET /api/usuarios/:id", () => {
  it("con un id mal formado responde 400", async () => {
    const token = await tokenAdmin();

    const res = await request(app).get("/api/usuarios/abc").set("x-token", token);

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "id")).toBe(true);
  });

  it("con un id válido que no existe responde 404", async () => {
    const token = await tokenAdmin();
    const id = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/usuarios/${id}`).set("x-token", token);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });

  it("con un id de un usuario activo responde 200", async () => {
    const token = await tokenAdmin();
    const usuario = await crearUsuario({ email: "detalle@test.com" });

    const res = await request(app).get(`/api/usuarios/${usuario.id}`).set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body.uid).toBe(usuario.id);
    expect(res.body.password).toBeUndefined();
  });
});

describe("POST /api/usuarios", () => {
  it("el admin crea un usuario y la contraseña queda hasheada en la base de datos", async () => {
    const token = await tokenAdmin();

    const res = await request(app)
      .post("/api/usuarios")
      .set("x-token", token)
      .send({ nombre: "Creado Por Admin", email: "creado@test.com", password: "Password1", rol: "usuario" });

    expect(res.status).toBe(201);
    expect(res.body.uid).toBeTruthy();
    expect(res.body.password).toBeUndefined();

    const guardado = await Usuario.findOne({ email: "creado@test.com" });
    expect(guardado.password).not.toBe("Password1");
    expect(guardado.validarPassword("Password1")).toBe(true);
  });

  it("con un email ya registrado responde 400", async () => {
    const token = await tokenAdmin();
    await crearUsuario({ email: "duplicado@test.com" });

    const res = await request(app)
      .post("/api/usuarios")
      .set("x-token", token)
      .send({ nombre: "Duplicado", email: "duplicado@test.com", password: "Password1" });

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "email")).toBe(true);
  });

  it("con un rol inválido responde 400", async () => {
    const token = await tokenAdmin();

    const res = await request(app)
      .post("/api/usuarios")
      .set("x-token", token)
      .send({ nombre: "Rol Malo", email: "rolmalo@test.com", password: "Password1", rol: "root" });

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "rol")).toBe(true);
  });
});

describe("PUT /api/usuarios/:id", () => {
  it("el admin no puede cambiar su propio rol", async () => {
    const { usuario, token } = await usuarioConToken({ rol: "admin", email: "miadmin@test.com" });

    const res = await request(app)
      .put(`/api/usuarios/${usuario.id}`)
      .set("x-token", token)
      .send({ rol: "usuario" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No puedes cambiar tu propio rol");
  });

  it("con la contraseña vacía no la cambia y el login sigue funcionando", async () => {
    const token = await tokenAdmin();
    const usuario = await crearUsuario({ email: "sinespwd@test.com", password: "Password1" });

    const res = await request(app)
      .put(`/api/usuarios/${usuario.id}`)
      .set("x-token", token)
      .send({ nombre: "Nombre Actualizado", email: "sinespwd@test.com", password: "" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Nombre Actualizado");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "sinespwd@test.com", password: "Password1" });
    expect(login.status).toBe(200);
  });

  it("con un id que no existe responde 404", async () => {
    const token = await tokenAdmin();
    const id = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put(`/api/usuarios/${id}`)
      .set("x-token", token)
      .send({ nombre: "Nadie" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Usuario no encontrado");
  });
});

describe("DELETE /api/usuarios/:id", () => {
  it("el admin no puede eliminarse a sí mismo", async () => {
    const { usuario, token } = await usuarioConToken({ rol: "admin", email: "autoadmin@test.com" });

    const res = await request(app).delete(`/api/usuarios/${usuario.id}`).set("x-token", token);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No puedes eliminar tu propia cuenta");
  });

  it("hace borrado lógico: deja de listarse y el usuario ya no puede iniciar sesión", async () => {
    const token = await tokenAdmin();
    const usuario = await crearUsuario({ email: "borrado@test.com", password: "Password1" });

    const res = await request(app).delete(`/api/usuarios/${usuario.id}`).set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe("Usuario eliminado");

    const listado = await request(app).get("/api/usuarios?buscar=borrado@test.com").set("x-token", token);
    expect(listado.body.total).toBe(0);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "borrado@test.com", password: "Password1" });
    expect(login.status).toBe(401);
    expect(login.body.error).toBe("Usuario desactivado");
  });
});

describe("otros casos de la API", () => {
  it("GET /api/health responde 200 con { status: 'ok' }", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("una ruta inexistente responde 404 en JSON", async () => {
    const res = await request(app).get("/api/no-existe");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Ruta no encontrada");
  });

  it("un body con JSON mal formado responde 400 con el mensaje esperado", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "roto@test.com", ');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El cuerpo de la petición no es un JSON válido");
  });
});
