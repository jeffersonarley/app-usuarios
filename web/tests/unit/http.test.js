import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, request, setUnauthorizedHandler, tokenStorage } from "@/services/http.js";

const respuesta = (status, data) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(data),
});

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setUnauthorizedHandler(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tokenStorage", () => {
  it("guarda, lee y limpia el token", () => {
    tokenStorage.set("abc");
    expect(tokenStorage.get()).toBe("abc");
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});

describe("request", () => {
  it("envía el header x-token y serializa el body como JSON", async () => {
    tokenStorage.set("token-guardado");
    fetchMock.mockResolvedValue(respuesta(200, { ok: true }));

    await request("/auth/login", { method: "POST", body: { email: "ana@demo.com" } });

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/auth/login");
    expect(opciones.method).toBe("POST");
    expect(opciones.headers["x-token"]).toBe("token-guardado");
    expect(opciones.headers["Content-Type"]).toBe("application/json");
    expect(opciones.body).toBe(JSON.stringify({ email: "ana@demo.com" }));
  });

  it("no envía x-token cuando no hay token guardado", async () => {
    fetchMock.mockResolvedValue(respuesta(200, {}));

    await request("/auth/perfil");

    const [, opciones] = fetchMock.mock.calls[0];
    expect(opciones.headers["x-token"]).toBeUndefined();
    expect(opciones.body).toBeUndefined();
  });

  it("agrega solo los parámetros de query con valor", async () => {
    fetchMock.mockResolvedValue(respuesta(200, {}));

    await request("/usuarios", { query: { buscar: "ana", rol: "", pagina: undefined, limite: 8 } });

    const [url] = fetchMock.mock.calls[0];
    expect(url.searchParams.get("buscar")).toBe("ana");
    expect(url.searchParams.get("limite")).toBe("8");
    expect(url.searchParams.has("rol")).toBe(false);
    expect(url.searchParams.has("pagina")).toBe(false);
  });

  it("convierte { errores } en ApiError con details por campo", async () => {
    fetchMock.mockResolvedValue(
      respuesta(400, { errores: [{ path: "email", msg: "Ese email ya está registrado" }] }),
    );

    const error = await request("/auth/registro", { method: "POST", body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Revisa los datos del formulario");
    expect(error.details).toEqual({ email: "Ese email ya está registrado" });
  });

  it("convierte { error } en ApiError con ese mensaje", async () => {
    fetchMock.mockResolvedValue(respuesta(401, { error: "Credenciales inválidas" }));

    const error = await request("/auth/login", { method: "POST", body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Credenciales inválidas");
  });

  it("si fetch falla lanza ApiError con status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network error"));

    const error = await request("/auth/perfil").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toContain("No se pudo conectar con el servidor");
  });

  it("con 401 y token guardado llama al manejador de sesión expirada", async () => {
    tokenStorage.set("token-viejo");
    const manejador = vi.fn();
    setUnauthorizedHandler(manejador);
    fetchMock.mockResolvedValue(respuesta(401, { error: "Token no válido o expirado" }));

    await request("/auth/perfil").catch(() => {});

    expect(manejador).toHaveBeenCalledTimes(1);
  });

  it("con 401 sin token guardado no llama al manejador", async () => {
    const manejador = vi.fn();
    setUnauthorizedHandler(manejador);
    fetchMock.mockResolvedValue(respuesta(401, { error: "Credenciales inválidas" }));

    await request("/auth/login", { method: "POST", body: {} }).catch(() => {});

    expect(manejador).not.toHaveBeenCalled();
  });
});
