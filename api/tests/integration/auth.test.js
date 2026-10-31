import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { crearUsuario, usuarioConToken } from "../helpers.js";

describe("POST /api/auth/registro", () => {
  it("con datos válidos responde 201, devuelve token y rol usuario aunque se envíe admin", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Nueva Persona",
      email: "nueva@test.com",
      password: "Password1",
      rol: "admin",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.rol).toBe("usuario");
    expect(res.body.usuario.password).toBeUndefined();
    expect(res.body.usuario.uid).toBeTruthy();
  });

  it("con un email ya registrado responde 400 con el error en el campo email", async () => {
    await crearUsuario({ email: "repetido@test.com" });

    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Otra Persona",
      email: "repetido@test.com",
      password: "Password1",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "email")).toBe(true);
  });

  it("con una contraseña sin mayúscula responde 400", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Sin Mayuscula",
      email: "sinmayus@test.com",
      password: "password1",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "password")).toBe(true);
  });

  it("con una contraseña de menos de 8 caracteres responde 400", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "Corta",
      email: "corta@test.com",
      password: "Ab1",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores.some((e) => e.path === "password")).toBe(true);
  });

  it("con un email inválido y nombre corto responde 400 con ambos campos", async () => {
    const res = await request(app).post("/api/auth/registro").send({
      nombre: "A",
      email: "no-es-email",
      password: "Password1",
    });

    expect(res.status).toBe(400);
    expect(res.body.errores.map((e) => e.path)).toEqual(expect.arrayContaining(["nombre", "email"]));
  });
});

describe("POST /api/auth/login", () => {
  it("con credenciales correctas responde 200, token y usuario con uid", async () => {
    const usuario = await crearUsuario({ email: "login@test.com", password: "Password1" });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "Password1",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.uid).toBe(usuario.id);
    expect(res.body.usuario.password).toBeUndefined();
  });

  it("con contraseña incorrecta responde 401 con el mensaje genérico", async () => {
    await crearUsuario({ email: "mala@test.com", password: "Password1" });

    const res = await request(app).post("/api/auth/login").send({
      email: "mala@test.com",
      password: "Incorrecta1",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales inválidas");
  });

  it("con un email inexistente responde 401 con el mismo mensaje genérico", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nadie@test.com",
      password: "Password1",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales inválidas");
  });

  it("con un usuario desactivado responde 401", async () => {
    await crearUsuario({ email: "inactivo@test.com", password: "Password1", estado: false });

    const res = await request(app).post("/api/auth/login").send({
      email: "inactivo@test.com",
      password: "Password1",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Usuario desactivado");
  });
});

describe("GET /api/auth/perfil", () => {
  it("sin token responde 401", async () => {
    const res = await request(app).get("/api/auth/perfil");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No hay token en la petición");
  });

  it("con token inválido responde 401", async () => {
    const res = await request(app).get("/api/auth/perfil").set("x-token", "no.es.un.token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token no válido o expirado");
  });

  it("con token válido responde 200 con el usuario autenticado", async () => {
    const { usuario, token } = await usuarioConToken({ email: "perfil@test.com" });

    const res = await request(app).get("/api/auth/perfil").set("x-token", token);

    expect(res.status).toBe(200);
    expect(res.body.uid).toBe(usuario.id);
    expect(res.body.email).toBe("perfil@test.com");
  });

  it("permite actualizar nombre y email del propio perfil", async () => {
    const { token } = await usuarioConToken({ email: "editar@test.com" });

    const res = await request(app)
      .put("/api/auth/perfil")
      .set("x-token", token)
      .send({ nombre: "Nombre Editado", email: "editado@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Nombre Editado");
    expect(res.body.email).toBe("editado@test.com");
  });
});

describe("PUT /api/auth/password", () => {
  it("con la contraseña actual incorrecta responde 400", async () => {
    const { token } = await usuarioConToken({ email: "pass1@test.com", password: "Password1" });

    const res = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Incorrecta1", passwordNueva: "NuevaClave1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("La contraseña actual no es correcta");
  });

  it("con la nueva contraseña igual a la actual responde 400", async () => {
    const { token } = await usuarioConToken({ email: "pass2@test.com", password: "Password1" });

    const res = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Password1", passwordNueva: "Password1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("La nueva contraseña debe ser distinta de la actual");
  });

  it("con el cambio correcto responde 200 y luego el login funciona con la nueva", async () => {
    const { token } = await usuarioConToken({ email: "pass3@test.com", password: "Password1" });

    const cambio = await request(app)
      .put("/api/auth/password")
      .set("x-token", token)
      .send({ passwordActual: "Password1", passwordNueva: "NuevaClave1" });

    expect(cambio.status).toBe(200);
    expect(cambio.body.mensaje).toBe("Contraseña actualizada");

    const login = await request(app).post("/api/auth/login").send({
      email: "pass3@test.com",
      password: "NuevaClave1",
    });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });
});
