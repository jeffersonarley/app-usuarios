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

import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import { authApi } from "@/services/authApi.js";
import { ApiError } from "@/services/http.js";
import { useAuth } from "@/composables/useAuth.js";

const Pagina = { template: "<div />" };

const montar = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/login", name: "login", component: LoginView },
      { path: "/registro", name: "register", component: Pagina },
      { path: "/", name: "home", component: Pagina },
      { path: "/perfil", name: "profile", component: Pagina },
    ],
  });
  await router.push("/login");
  await router.isReady();
  const wrapper = mount(LoginView, { global: { plugins: [router] } });
  return { wrapper, router };
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().clearSession();
});

describe("LoginView", () => {
  it("con email inválido muestra el error sin llamar a la API", async () => {
    const { wrapper } = await montar();

    await wrapper.find("[data-test=login-email]").setValue("no-es-email");
    await wrapper.find("[data-test=login-password]").setValue("Password1");
    await wrapper.find("[data-test=login-form]").trigger("submit");

    expect(wrapper.find("[data-test=login-email-error]").text()).toBe(
      "El email no tiene un formato válido",
    );
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it("con error del servidor muestra el alert y limpia la contraseña", async () => {
    authApi.login.mockRejectedValue(new ApiError(401, "Credenciales inválidas"));
    const { wrapper } = await montar();

    await wrapper.find("[data-test=login-email]").setValue("ana@demo.com");
    await wrapper.find("[data-test=login-password]").setValue("Incorrecta1");
    await wrapper.find("[data-test=login-form]").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-test=alert]").text()).toBe("Credenciales inválidas");
    expect(wrapper.find("[data-test=login-password]").element.value).toBe("");
  });

  it("con credenciales válidas inicia sesión y navega al inicio", async () => {
    authApi.login.mockResolvedValue({
      token: "token-1",
      usuario: { uid: "1", nombre: "Ana", email: "ana@demo.com", rol: "usuario" },
    });
    const { wrapper, router } = await montar();

    await wrapper.find("[data-test=login-email]").setValue("ana@demo.com");
    await wrapper.find("[data-test=login-password]").setValue("Usuario123");
    await wrapper.find("[data-test=login-form]").trigger("submit");
    await flushPromises();

    expect(authApi.login).toHaveBeenCalledWith({ email: "ana@demo.com", password: "Usuario123" });
    expect(router.currentRoute.value.name).toBe("home");
  });
});
