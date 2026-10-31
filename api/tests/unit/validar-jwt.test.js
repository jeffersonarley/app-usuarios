import { afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import Usuario from "../../models/usuario.js";
import { validarJWT } from "../../middlewares/validar-jwt.js";
import { crearUsuario } from "../helpers.js";

const crearRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

afterEach(() => vi.restoreAllMocks());

describe("middleware validarJWT", () => {
  it("responde 401 cuando no hay token en el header", async () => {
    const req = { header: () => undefined };
    const res = crearRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No hay token en la petición" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 cuando el token es inválido", async () => {
    const req = { header: () => "token.invalido.firma" };
    const res = crearRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token no válido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 cuando el usuario del token ya no existe", async () => {
    vi.spyOn(Usuario, "findById").mockResolvedValue(null);
    const token = jwt.sign({ uid: "000000000000000000000000" }, process.env.JWT_SECRET);
    const req = { header: () => token };
    const res = crearRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario desactivado" });
  });

  it("responde 401 cuando el usuario está desactivado", async () => {
    vi.spyOn(Usuario, "findById").mockResolvedValue({ estado: false, rol: "usuario" });
    const token = jwt.sign({ uid: "000000000000000000000000" }, process.env.JWT_SECRET);
    const req = { header: () => token };
    const res = crearRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario desactivado" });
  });

  it("con token válido deja el usuario en req.usuario y llama a next()", async () => {
    const usuario = await crearUsuario();
    const token = jwt.sign({ uid: usuario.id }, process.env.JWT_SECRET);
    const req = { header: () => token };
    const res = crearRes();
    const next = vi.fn();

    await validarJWT(req, res, next);

    expect(req.usuario.id).toBe(usuario.id);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
