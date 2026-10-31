import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/usersApi.js", () => ({
  usersApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));

import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import UserFormView from "@/views/UserFormView.vue";
import { usersApi } from "@/services/usersApi.js";
import { ApiError } from "@/services/http.js";
import { useAuth } from "@/composables/useAuth.js";
import { useToast } from "@/composables/useToast.js";

const Pagina = { template: "<div />" };
const admin = { uid: "admin-1", nombre: "Marta", email: "marta@demo.com", rol: "admin" };

const montar = async (props = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/usuarios", name: "users", component: Pagina },
      { path: "/usuarios/nuevo", name: "user-create", component: UserFormView },
      { path: "/usuarios/:id/editar", name: "user-edit", component: UserFormView },
      { path: "/perfil", name: "profile", component: Pagina },
    ],
  });
  await router.push(props.id ? `/usuarios/${props.id}/editar` : "/usuarios/nuevo");
  await router.isReady();
  const wrapper = mount(UserFormView, { props, global: { plugins: [router] } });
  return { wrapper, router };
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().setUser(admin);
  for (const item of [...useToast().toasts]) useToast().dismiss(item.id);
});

describe("UserFormView", () => {
  it("crea un usuario con los datos del formulario", async () => {
    usersApi.crear.mockResolvedValue({ uid: "nuevo-1" });
    const { wrapper, router } = await montar();

    await wrapper.find("[data-test=user-name]").setValue("Nuevo Usuario");
    await wrapper.find("[data-test=user-email]").setValue("nuevo@demo.com");
    await wrapper.find("[data-test=user-password]").setValue("Password1");
    await wrapper.find("[data-test=user-form]").trigger("submit");
    await flushPromises();

    expect(usersApi.crear).toHaveBeenCalledWith({
      nombre: "Nuevo Usuario",
      email: "nuevo@demo.com",
      rol: "usuario",
      password: "Password1",
    });
    expect(router.currentRoute.value.name).toBe("users");
  });

  it("con contraseña inválida no llama a la API", async () => {
    const { wrapper } = await montar();

    await wrapper.find("[data-test=user-name]").setValue("Nuevo Usuario");
    await wrapper.find("[data-test=user-email]").setValue("nuevo@demo.com");
    await wrapper.find("[data-test=user-password]").setValue("corta");
    await wrapper.find("[data-test=user-form]").trigger("submit");

    expect(wrapper.find("[data-test=user-password-error]").text()).toBe(
      "La contraseña debe tener entre 8 y 64 caracteres",
    );
    expect(usersApi.crear).not.toHaveBeenCalled();
  });

  it("al editar carga los datos y no envía la contraseña si queda vacía", async () => {
    usersApi.obtener.mockResolvedValue({
      uid: "u-1",
      nombre: "Luis Gómez",
      email: "luis@demo.com",
      rol: "usuario",
    });
    usersApi.actualizar.mockResolvedValue({
      uid: "u-1",
      nombre: "Luis Actualizado",
      email: "luis@demo.com",
      rol: "usuario",
    });
    const { wrapper, router } = await montar({ id: "u-1" });
    await flushPromises();

    expect(wrapper.find("[data-test=user-name]").element.value).toBe("Luis Gómez");

    await wrapper.find("[data-test=user-name]").setValue("Luis Actualizado");
    await wrapper.find("[data-test=user-form]").trigger("submit");
    await flushPromises();

    expect(usersApi.actualizar).toHaveBeenCalledWith("u-1", {
      nombre: "Luis Actualizado",
      email: "luis@demo.com",
      rol: "usuario",
    });
    expect(router.currentRoute.value.name).toBe("users");
  });

  it("muestra el aviso cuando el usuario a editar no existe", async () => {
    usersApi.obtener.mockRejectedValue(new ApiError(404, "Usuario no encontrado"));
    const { wrapper } = await montar({ id: "no-existe" });
    await flushPromises();

    expect(wrapper.find("[data-test=user-not-found]").exists()).toBe(true);
  });

  it("al editarse a sí mismo deshabilita el selector de rol", async () => {
    usersApi.obtener.mockResolvedValue({
      uid: admin.uid,
      nombre: "Marta",
      email: "marta@demo.com",
      rol: "admin",
    });
    const { wrapper } = await montar({ id: admin.uid });
    await flushPromises();

    expect(wrapper.find("[data-test=user-role]").attributes("disabled")).toBeDefined();
    expect(wrapper.find("[data-test=self-edit-hint]").exists()).toBe(true);
  });
});
