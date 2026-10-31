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
import RegisterView from "@/views/RegisterView.vue";
import { authApi } from "@/services/authApi.js";
import { ApiError } from "@/services/http.js";
import { useAuth } from "@/composables/useAuth.js";
import { useToast } from "@/composables/useToast.js";

const Pagina = { template: "<div />" };

const montar = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/registro", name: "register", component: RegisterView },
      { path: "/login", name: "login", component: Pagina },
      { path: "/", name: "home", component: Pagina },
      { path: "/perfil", name: "profile", component: Pagina },
    ],
  });
  await router.push("/registro");
  await router.isReady();
  const wrapper = mount(RegisterView, { global: { plugins: [router] } });
  return { wrapper, router };
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().clearSession();
  for (const item of [...useToast().toasts]) useToast().dismiss(item.id);
});

describe("RegisterView", () => {
  it("con contraseñas que no coinciden muestra el error sin llamar a la API", async () => {
    const { wrapper } = await montar();

    await wrapper.find("[data-test=register-name]").setValue("Ana Torres");
    await wrapper.find("[data-test=register-email]").setValue("ana@demo.com");
    await wrapper.find("[data-test=register-password]").setValue("Password1");
    await wrapper.find("[data-test=register-confirmation]").setValue("Password2");
    await wrapper.find("[data-test=register-form]").trigger("submit");

    expect(wrapper.find("[data-test=register-confirmation-error]").text()).toBe(
      "Las contraseñas no coinciden",
    );
    expect(authApi.registro).not.toHaveBeenCalled();
  });

  it("con datos válidos registra la cuenta y muestra un toast", async () => {
    authApi.registro.mockResolvedValue({
      token: "token-1",
      usuario: { uid: "1", nombre: "Ana", email: "ana@demo.com", rol: "usuario" },
    });
    const { wrapper, router } = await montar();

    await wrapper.find("[data-test=register-name]").setValue("Ana Torres");
    await wrapper.find("[data-test=register-email]").setValue("ana@demo.com");
    await wrapper.find("[data-test=register-password]").setValue("Password1");
    await wrapper.find("[data-test=register-confirmation]").setValue("Password1");
    await wrapper.find("[data-test=register-form]").trigger("submit");
    await flushPromises();

    expect(authApi.registro).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe("home");
    expect(useToast().toasts.some((t) => t.message.includes("Cuenta creada"))).toBe(true);
  });

  it("muestra los errores por campo que devuelve la API", async () => {
    authApi.registro.mockRejectedValue(
      new ApiError(400, "Revisa los datos del formulario", {
        email: "Ese email ya está registrado",
      }),
    );
    const { wrapper } = await montar();

    await wrapper.find("[data-test=register-name]").setValue("Ana Torres");
    await wrapper.find("[data-test=register-email]").setValue("ana@demo.com");
    await wrapper.find("[data-test=register-password]").setValue("Password1");
    await wrapper.find("[data-test=register-confirmation]").setValue("Password1");
    await wrapper.find("[data-test=register-form]").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-test=register-email-error]").text()).toBe(
      "Ese email ya está registrado",
    );
  });
});
