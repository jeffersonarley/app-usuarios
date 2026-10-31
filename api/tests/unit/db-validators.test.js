import { describe, expect, it } from "vitest";
import { emailExiste, esRolValido } from "../../helpers/db-validators.js";
import { crearUsuario } from "../helpers.js";

describe("helper esRolValido", () => {
  it("acepta los roles permitidos", () => {
    expect(esRolValido("admin")).toBe(true);
    expect(esRolValido("usuario")).toBe(true);
  });

  it("rechaza un rol desconocido", () => {
    expect(() => esRolValido("superadmin")).toThrow("El rol debe ser uno de: admin, usuario");
  });
});

describe("helper emailExiste", () => {
  it("lanza un error cuando el email ya está registrado", async () => {
    const usuario = await crearUsuario({ email: "ocupado@test.com" });

    await expect(emailExiste("ocupado@test.com")).rejects.toThrow("Ese email ya está registrado");
    expect(usuario.email).toBe("ocupado@test.com");
  });

  it("no lanza error cuando el email pertenece al mismo usuario que se edita", async () => {
    const usuario = await crearUsuario({ email: "propio@test.com" });

    await expect(emailExiste("propio@test.com", usuario.id)).resolves.toBeUndefined();
  });

  it("no lanza error cuando el email no está registrado", async () => {
    await expect(emailExiste("libre@test.com")).resolves.toBeUndefined();
  });
});
