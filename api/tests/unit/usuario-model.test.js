import { describe, expect, it } from "vitest";
import Usuario from "../../models/usuario.js";
import { crearUsuario } from "../helpers.js";

describe("modelo Usuario", () => {
  it("hashea la contraseña antes de guardar", async () => {
    const usuario = await crearUsuario({ password: "Password1" });

    expect(usuario.password).not.toBe("Password1");
    expect(usuario.password.startsWith("$2")).toBe(true);
  });

  it("validarPassword compara contra el hash guardado", async () => {
    const usuario = await crearUsuario({ password: "Password1" });

    expect(usuario.validarPassword("Password1")).toBe(true);
    expect(usuario.validarPassword("OtraClave1")).toBe(false);
  });

  it("toJSON no devuelve password ni _id y expone uid", async () => {
    const usuario = await crearUsuario();
    const json = usuario.toJSON();

    expect(String(json.uid)).toBe(usuario.id);
    expect(json.password).toBeUndefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  it("asigna rol usuario y estado activo por defecto", async () => {
    const usuario = await crearUsuario();

    expect(usuario.rol).toBe("usuario");
    expect(usuario.estado).toBe(true);
  });

  it("normaliza el email a minúsculas y sin espacios", async () => {
    const usuario = await crearUsuario({ email: "  MAYUS@Demo.COM " });

    expect(usuario.email).toBe("mayus@demo.com");
  });

  it("no vuelve a hashear la contraseña si no cambió", async () => {
    const usuario = await crearUsuario({ password: "Password1" });
    const hashInicial = usuario.password;

    usuario.nombre = "Nombre nuevo";
    await usuario.save();

    expect(usuario.password).toBe(hashInicial);
    expect(usuario.validarPassword("Password1")).toBe(true);
  });
});
