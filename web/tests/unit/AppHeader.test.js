import { beforeEach, describe, expect, it } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import { useAuth } from "@/composables/useAuth.js";

const Pagina = { template: "<div />" };

const crearRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: Pagina },
      { path: "/login", name: "login", component: Pagina },
      { path: "/perfil", name: "profile", component: Pagina },
      { path: "/usuarios", name: "users", component: Pagina },
    ],
  });

const montar = async () => {
  const router = crearRouter();
  await router.push("/perfil");
  await router.isReady();
  const wrapper = mount(AppHeader, { global: { plugins: [router] } });
  return { wrapper, router };
};

beforeEach(() => {
  useAuth().clearSession();
});

describe("AppHeader", () => {
  it("un administrador ve el enlace Usuarios y sus iniciales", async () => {
    useAuth().setUser({ uid: "2", nombre: "Marta Ruiz", rol: "admin" });

    const { wrapper } = await montar();

    expect(wrapper.find("[data-test=nav-users]").exists()).toBe(true);
    expect(wrapper.find("[data-test=current-user-name]").text()).toBe("Marta Ruiz");
    expect(wrapper.find(".avatar").text()).toBe("MR");
  });

  it("un usuario normal no ve el enlace Usuarios", async () => {
    useAuth().setUser({ uid: "1", nombre: "Ana Torres", rol: "usuario" });

    const { wrapper } = await montar();

    expect(wrapper.find("[data-test=nav-users]").exists()).toBe(false);
    expect(wrapper.text()).toContain("Usuario");
  });

  it("cerrar sesión limpia el estado y vuelve al login", async () => {
    const auth = useAuth();
    auth.setUser({ uid: "1", nombre: "Ana Torres", rol: "usuario" });
    const { wrapper, router } = await montar();

    await wrapper.find("[data-test=logout]").trigger("click");
    await flushPromises();

    expect(auth.state.user).toBeNull();
    expect(router.currentRoute.value.name).toBe("login");
  });
});
