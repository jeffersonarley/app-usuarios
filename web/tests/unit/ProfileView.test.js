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
import ProfileView from "@/views/ProfileView.vue";
import { authApi } from "@/services/authApi.js";
import { ApiError } from "@/services/http.js";
import { useAuth } from "@/composables/useAuth.js";
import { useToast } from "@/composables/useToast.js";

const usuario = {
  uid: "1",
  nombre: "Ana Torres",
  email: "ana@demo.com",
  rol: "usuario",
  createdAt: "2025-01-15T10:00:00.000Z",
};

const Pagina = { template: "<div />" };

const montar = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/perfil", name: "profile", component: ProfileView }],
  });
  await router.push("/perfil");
  await router.isReady();
  const wrapper = mount(ProfileView, { global: { plugins: [router] } });
  return { wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().setUser(usuario);
  for (const item of [...useToast().toasts]) useToast().dismiss(item.id);
});

describe("ProfileView", () => {
  it("muestra el rol del usuario", async () => {
    const { wrapper } = await montar();

    expect(wrapper.find("[data-test=profile-role]").text()).toBe("Usuario");
    expect(wrapper.find("[data-test=profile-name]").element.value).toBe("Ana Torres");
  });

  it("con email inválido no llama a la API para guardar el perfil", async () => {
    const { wrapper } = await montar();

    await wrapper.find("[data-test=profile-email]").setValue("no-es-email");
    await wrapper.find("[data-test=profile-form]").trigger("submit");

    expect(wrapper.find("[data-test=profile-email-error]").text()).toBe(
      "El email no tiene un formato válido",
    );
    expect(authApi.actualizarPerfil).not.toHaveBeenCalled();
  });

  it("con datos válidos actualiza el perfil y el estado de la sesión", async () => {
    authApi.actualizarPerfil.mockResolvedValue({ ...usuario, nombre: "Ana Nueva" });
    const { wrapper } = await montar();

    await wrapper.find("[data-test=profile-name]").setValue("Ana Nueva");
    await wrapper.find("[data-test=profile-form]").trigger("submit");
    await flushPromises();

    expect(authApi.actualizarPerfil).toHaveBeenCalledWith({
      nombre: "Ana Nueva",
      email: "ana@demo.com",
    });
    expect(useAuth().state.user.nombre).toBe("Ana Nueva");
  });

  it("con contraseñas que no coinciden no llama a la API de contraseña", async () => {
    const { wrapper } = await montar();

    await wrapper.find("[data-test=password-current]").setValue("Password1");
    await wrapper.find("[data-test=password-new]").setValue("NuevaClave1");
    await wrapper.find("[data-test=password-confirmation]").setValue("OtraClave1");
    await wrapper.find("[data-test=password-form]").trigger("submit");

    expect(wrapper.find("[data-test=password-confirmation-error]").text()).toBe(
      "Las contraseñas no coinciden",
    );
    expect(authApi.cambiarPassword).not.toHaveBeenCalled();
  });

  it("con datos válidos cambia la contraseña y limpia el formulario", async () => {
    authApi.cambiarPassword.mockResolvedValue({ mensaje: "Contraseña actualizada" });
    const { wrapper } = await montar();

    await wrapper.find("[data-test=password-current]").setValue("Password1");
    await wrapper.find("[data-test=password-new]").setValue("NuevaClave1");
    await wrapper.find("[data-test=password-confirmation]").setValue("NuevaClave1");
    await wrapper.find("[data-test=password-form]").trigger("submit");
    await flushPromises();

    expect(authApi.cambiarPassword).toHaveBeenCalledWith({
      passwordActual: "Password1",
      passwordNueva: "NuevaClave1",
    });
    expect(wrapper.find("[data-test=password-current]").element.value).toBe("");
  });

  it("muestra el error del servidor al cambiar la contraseña", async () => {
    authApi.cambiarPassword.mockRejectedValue(
      new ApiError(400, "La contraseña actual no es correcta"),
    );
    const { wrapper } = await montar();

    await wrapper.find("[data-test=password-current]").setValue("Incorrecta1");
    await wrapper.find("[data-test=password-new]").setValue("NuevaClave1");
    await wrapper.find("[data-test=password-confirmation]").setValue("NuevaClave1");
    await wrapper.find("[data-test=password-form]").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("La contraseña actual no es correcta");
  });
});
