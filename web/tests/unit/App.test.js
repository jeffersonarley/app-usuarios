import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/authApi.js", () => ({
  authApi: {
    login: vi.fn(),
    registro: vi.fn(),
    perfil: vi.fn(),
    actualizarPerfil: vi.fn(),
    cambiarPassword: vi.fn(),
  },
}));

import { mount } from "@vue/test-utils";
import App from "@/App.vue";
import { authApi } from "@/services/authApi.js";
import { useAuth } from "@/composables/useAuth.js";

const stubs = { AppHeader: true, ToastContainer: true, RouterView: true };

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().clearSession();
});

describe("App", () => {
  it("sin sesión no muestra el header y centra el contenido", () => {
    const wrapper = mount(App, { global: { stubs } });

    expect(wrapper.find("app-header-stub").exists()).toBe(false);
    expect(wrapper.find("main").classes()).toContain("layout__content--centered");
  });

  it("con sesión muestra el header y quita el centrado", async () => {
    authApi.login.mockResolvedValue({
      token: "token-1",
      usuario: { uid: "1", nombre: "Ana", email: "ana@demo.com", rol: "usuario" },
    });
    await useAuth().login({ email: "ana@demo.com", password: "Usuario123" });

    const wrapper = mount(App, { global: { stubs } });

    expect(wrapper.find("app-header-stub").exists()).toBe(true);
    expect(wrapper.find("main").classes()).not.toContain("layout__content--centered");
  });
});
