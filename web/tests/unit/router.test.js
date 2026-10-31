import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/authApi.js", () => ({
  authApi: {
    login: vi.fn(),
    registro: vi.fn(),
    perfil: vi.fn(),
    actualizarPerfil: vi.fn(),
    cambiarPassword: vi.fn(),
  },
}));

vi.mock("@/services/usersApi.js", () => ({
  usersApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

import router from "@/router/index.js";
import { authApi } from "@/services/authApi.js";
import { usersApi } from "@/services/usersApi.js";
import { useAuth } from "@/composables/useAuth.js";

const usuario = { uid: "1", nombre: "Ana Torres", email: "ana@demo.com", rol: "usuario" };
const admin = { uid: "2", nombre: "Marta Ruiz", email: "marta@demo.com", rol: "admin" };

beforeAll(async () => {
  await router.push("/login");
  await router.isReady();
});

beforeEach(async () => {
  vi.clearAllMocks();
  useAuth().clearSession();
  usersApi.listar.mockResolvedValue({
    usuarios: [],
    total: 0,
    pagina: 1,
    limite: 8,
    totalPaginas: 1,
  });
  await router.push("/no-existe");
});

describe("guardas del router", () => {
  it("sin sesión, una ruta protegida redirige a login con redirect", async () => {
    await router.push("/perfil");

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/perfil");
  });

  it("un usuario autenticado que abre /login es enviado a su perfil", async () => {
    authApi.login.mockResolvedValue({ token: "t", usuario });
    await useAuth().login({ email: "ana@demo.com", password: "Usuario123" });

    await router.push("/login");

    expect(router.currentRoute.value.name).toBe("profile");
  });

  it("un usuario normal que abre /usuarios es redirigido a /perfil", async () => {
    authApi.login.mockResolvedValue({ token: "t", usuario });
    await useAuth().login({ email: "ana@demo.com", password: "Usuario123" });

    await router.push("/usuarios");

    expect(router.currentRoute.value.name).toBe("profile");
  });

  it("un administrador puede abrir /usuarios", async () => {
    authApi.login.mockResolvedValue({ token: "t", usuario: admin });
    await useAuth().login({ email: "marta@demo.com", password: "Usuario123" });

    await router.push("/usuarios");

    expect(router.currentRoute.value.name).toBe("users");
  });

  it("una ruta inexistente muestra la página no encontrada", async () => {
    await router.push("/ruta-que-no-existe");

    expect(router.currentRoute.value.name).toBe("not-found");
    expect(document.title).toBe("Página no encontrada · Gestión de usuarios");
  });
});
