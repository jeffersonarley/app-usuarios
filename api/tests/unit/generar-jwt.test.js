import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { generarJWT } from "../../helpers/generar-jwt.js";

describe("helper generarJWT", () => {
  it("firma un token que contiene uid y rol", () => {
    const token = generarJWT({ id: "64b7f0c2a1b2c3d4e5f60718", rol: "admin" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    expect(payload.uid).toBe("64b7f0c2a1b2c3d4e5f60718");
    expect(payload.rol).toBe("admin");
  });

  it("usa el secreto configurado (otro secreto no puede verificarlo)", () => {
    const token = generarJWT({ id: "64b7f0c2a1b2c3d4e5f60718", rol: "usuario" });

    expect(() => jwt.verify(token, "otro-secreto-distinto")).toThrow();
  });
});
