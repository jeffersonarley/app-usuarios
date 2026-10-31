import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/http.js", () => ({
  request: vi.fn().mockResolvedValue({}),
}));

import { request } from "@/services/http.js";
import { authApi } from "@/services/authApi.js";
import { usersApi } from "@/services/usersApi.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authApi", () => {
  it("cada método llama a request con la ruta y el verbo correctos", async () => {
    await authApi.login({ email: "ana@demo.com", password: "Usuario123" });
    await authApi.registro({ nombre: "Ana" });
    await authApi.perfil();
    await authApi.actualizarPerfil({ nombre: "Ana" });
    await authApi.cambiarPassword({ passwordActual: "a", passwordNueva: "b" });

    expect(request).toHaveBeenNthCalledWith(1, "/auth/login", {
      method: "POST",
      body: { email: "ana@demo.com", password: "Usuario123" },
    });
    expect(request).toHaveBeenNthCalledWith(2, "/auth/registro", { method: "POST", body: { nombre: "Ana" } });
    expect(request).toHaveBeenNthCalledWith(3, "/auth/perfil");
    expect(request).toHaveBeenNthCalledWith(4, "/auth/perfil", { method: "PUT", body: { nombre: "Ana" } });
    expect(request).toHaveBeenNthCalledWith(5, "/auth/password", {
      method: "PUT",
      body: { passwordActual: "a", passwordNueva: "b" },
    });
  });
});

describe("usersApi", () => {
  it("cada método llama a request con la ruta y el verbo correctos", async () => {
    await usersApi.listar({ buscar: "ana", rol: "usuario", pagina: 2, limite: 8 });
    await usersApi.obtener("uid-1");
    await usersApi.crear({ nombre: "Ana" });
    await usersApi.actualizar("uid-1", { nombre: "Ana" });
    await usersApi.eliminar("uid-1");

    expect(request).toHaveBeenNthCalledWith(1, "/usuarios", {
      query: { buscar: "ana", rol: "usuario", pagina: 2, limite: 8 },
    });
    expect(request).toHaveBeenNthCalledWith(2, "/usuarios/uid-1");
    expect(request).toHaveBeenNthCalledWith(3, "/usuarios", { method: "POST", body: { nombre: "Ana" } });
    expect(request).toHaveBeenNthCalledWith(4, "/usuarios/uid-1", { method: "PUT", body: { nombre: "Ana" } });
    expect(request).toHaveBeenNthCalledWith(5, "/usuarios/uid-1", { method: "DELETE" });
  });
});
