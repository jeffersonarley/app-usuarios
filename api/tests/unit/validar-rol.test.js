import { describe, expect, it, vi } from "vitest";
import { validarRol } from "../../middlewares/validar-rol.js";

const crearRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("middleware validarRol", () => {
  it("responde 500 si no corrió validarJWT (no hay req.usuario)", () => {
    const req = {};
    const res = crearRes();
    const next = vi.fn();

    validarRol("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Se requiere validarJWT primero" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 cuando el rol no está permitido", () => {
    const req = { usuario: { rol: "usuario" } };
    const res = crearRes();
    const next = vi.fn();

    validarRol("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "No tiene permisos para esto" });
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next() cuando el rol está permitido", () => {
    const req = { usuario: { rol: "admin" } };
    const res = crearRes();
    const next = vi.fn();

    validarRol("admin", "usuario")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
