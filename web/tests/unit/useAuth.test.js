import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/authApi.js", () => ({
  authApi: {
    login: vi.fn(),
    registro: vi.fn(),
    perfil: vi.fn(),
  },
}));

import { authApi } from "@/services/authApi.js";
import { tokenStorage } from "@/services/http.js";
import { useAuth } from "@/composables/useAuth.js";

const usuario = { uid: "1", nombre: "Ana Torres", email: "ana@demo.com", rol: "usuario" };
const admin = { uid: "2", nombre: "Marta Ruiz", email: "marta@demo.com", rol: "admin" };

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().clearSession();
});

describe("useAuth", () => {
  it("login guarda el token y el usuario en el estado", async () => {
    authApi.login.mockResolvedValue({ token: "token-1", usuario });
    const auth = useAuth();

    await auth.login({ email: "ana@demo.com", password: "Usuario123" });

    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.isAdmin.value).toBe(false);
    expect(auth.state.user).toEqual(usuario);
    expect(tokenStorage.get()).toBe("token-1");
  });

  it("isAdmin es true cuando el usuario tiene rol admin", async () => {
    authApi.login.mockResolvedValue({ token: "token-2", usuario: admin });
    const auth = useAuth();

    await auth.login({ email: "marta@demo.com", password: "Usuario123" });

    expect(auth.isAdmin.value).toBe(true);
  });

  it("register inicia la sesión con el usuario creado", async () => {
    authApi.registro.mockResolvedValue({ token: "token-3", usuario });
    const auth = useAuth();

    await auth.register({ nombre: "Ana", email: "ana@demo.com", password: "Usuario123" });

    expect(auth.isAuthenticated.value).toBe(true);
    expect(tokenStorage.get()).toBe("token-3");
  });

  it("logout limpia el estado y el almacenamiento", async () => {
    authApi.login.mockResolvedValue({ token: "token-4", usuario });
    const auth = useAuth();
    await auth.login({ email: "ana@demo.com", password: "Usuario123" });

    auth.logout();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.state.user).toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it("setUser actualiza el usuario de la sesión", () => {
    const auth = useAuth();

    auth.setUser(admin);

    expect(auth.state.user).toEqual(admin);
  });

  it("restoreSession sin token deja la sesión cerrada", async () => {
    vi.resetModules();
    const { useAuth: useAuthFresca } = await import("@/composables/useAuth.js");
    const auth = useAuthFresca();

    await auth.restoreSession();

    expect(auth.isAuthenticated.value).toBe(false);
  });

  it("restoreSession con token válido recupera el perfil", async () => {
    vi.resetModules();
    localStorage.setItem("x-token", "token-guardado");
    const { authApi: apiFresca } = await import("@/services/authApi.js");
    apiFresca.perfil.mockResolvedValue(usuario);
    const { useAuth: useAuthFresca } = await import("@/composables/useAuth.js");
    const auth = useAuthFresca();

    await auth.restoreSession();

    expect(apiFresca.perfil).toHaveBeenCalledTimes(1);
    expect(auth.state.user).toEqual(usuario);
    expect(auth.isAuthenticated.value).toBe(true);
  });

  it("restoreSession con token inválido cierra la sesión", async () => {
    vi.resetModules();
    localStorage.setItem("x-token", "token-vencido");
    const { authApi: apiFresca } = await import("@/services/authApi.js");
    apiFresca.perfil.mockRejectedValue(new Error("Token no válido"));
    const { useAuth: useAuthFresca } = await import("@/composables/useAuth.js");
    const auth = useAuthFresca();

    await auth.restoreSession();

    expect(auth.isAuthenticated.value).toBe(false);
    expect(localStorage.getItem("x-token")).toBeNull();
  });
});
