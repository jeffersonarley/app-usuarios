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
import UsersView from "@/views/UsersView.vue";
import { usersApi } from "@/services/usersApi.js";
import { ApiError } from "@/services/http.js";
import { useAuth } from "@/composables/useAuth.js";
import { useToast } from "@/composables/useToast.js";

const Pagina = { template: "<div />" };
const admin = { uid: "admin-1", nombre: "Marta Ruiz", email: "marta@demo.com", rol: "admin" };

const usuarios = [
  { uid: "u-1", nombre: "Ana Torres", email: "ana@demo.com", rol: "usuario", createdAt: "2025-01-10T10:00:00.000Z" },
  { uid: "admin-1", nombre: "Marta Ruiz", email: "marta@demo.com", rol: "admin", createdAt: "2025-01-01T10:00:00.000Z" },
];

const montar = async (query = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/usuarios", name: "users", component: UsersView },
      { path: "/usuarios/nuevo", name: "user-create", component: Pagina },
      { path: "/usuarios/:id/editar", name: "user-edit", component: Pagina },
      { path: "/perfil", name: "profile", component: Pagina },
      { path: "/", name: "home", component: Pagina },
    ],
  });
  await router.push({ name: "users", query });
  await router.isReady();
  const wrapper = mount(UsersView, {
    global: { plugins: [router], stubs: { teleport: true } },
  });
  await flushPromises();
  return { wrapper, router };
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth().setUser(admin);
  for (const item of [...useToast().toasts]) useToast().dismiss(item.id);
  usersApi.listar.mockResolvedValue({
    usuarios,
    total: 9,
    pagina: 1,
    limite: 8,
    totalPaginas: 2,
  });
});

describe("UsersView", () => {
  it("muestra el total y una fila por usuario", async () => {
    const { wrapper } = await montar();

    expect(wrapper.find("[data-test=users-total]").text()).toBe("9 usuarios activos");
    expect(wrapper.findAll("[data-test=user-row]")).toHaveLength(2);
  });

  it("envía la búsqueda de la URL al listar", async () => {
    await montar({ buscar: "ana" });

    expect(usersApi.listar).toHaveBeenCalledWith(
      expect.objectContaining({ buscar: "ana", limite: 8 }),
    );
  });

  it("al cambiar la página actualiza la URL", async () => {
    const { wrapper, router } = await montar();

    await wrapper.find("[data-test=pagination-next]").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.query.pagina).toBe("2");
  });

  it("al cambiar el filtro de rol actualiza la URL", async () => {
    const { wrapper, router } = await montar();

    await wrapper.find("[data-test=users-role-filter]").setValue("admin");
    await flushPromises();

    expect(router.currentRoute.value.query.rol).toBe("admin");
  });

  it("elimina un usuario tras confirmar el diálogo", async () => {
    usersApi.eliminar.mockResolvedValue({ mensaje: "Usuario eliminado" });
    const { wrapper } = await montar();

    await wrapper.find("[data-test=user-delete]").trigger("click");
    await flushPromises();
    expect(wrapper.find("[data-test=confirm-dialog]").exists()).toBe(true);

    await wrapper.find("[data-test=confirm-accept]").trigger("click");
    await flushPromises();

    expect(usersApi.eliminar).toHaveBeenCalledWith("u-1");
    expect(usersApi.listar).toHaveBeenCalledTimes(2);
  });

  it("muestra el error de carga y permite reintentar", async () => {
    usersApi.listar.mockRejectedValue(new ApiError(500, "Error interno"));
    const { wrapper } = await montar();

    expect(wrapper.find("[data-test=alert]").text()).toBe("Error interno");

    await wrapper.find("[data-test=users-retry]").trigger("click");
    await flushPromises();

    expect(usersApi.listar).toHaveBeenCalledTimes(2);
  });
});
