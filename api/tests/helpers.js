// Utilidades para crear usuarios y obtener tokens en las pruebas.
import Usuario from "../models/usuario.js";
import { generarJWT } from "../helpers/generar-jwt.js";

let contador = 0;

// Emails únicos: las pruebas no dependen del orden ni de datos de otras.
export const emailUnico = (prefijo = "usuario") => `${prefijo}${Date.now()}${contador++}@test.com`;

export async function crearUsuario(overrides = {}) {
  const usuario = new Usuario({
    nombre: "Usuario de prueba",
    email: emailUnico(),
    password: "Password1",
    rol: "usuario",
    ...overrides,
  });
  await usuario.save();
  return usuario;
}

export async function usuarioConToken(overrides = {}) {
  const usuario = await crearUsuario(overrides);
  return { usuario, token: generarJWT(usuario) };
}

export const tokenAdmin = async (overrides = {}) =>
  (await usuarioConToken({ rol: "admin", ...overrides })).token;

export const tokenUsuario = async (overrides = {}) =>
  (await usuarioConToken({ rol: "usuario", ...overrides })).token;
