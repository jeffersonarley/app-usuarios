import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import NotFoundView from "@/views/NotFoundView.vue";

describe("NotFoundView", () => {
  it("muestra el 404 y un enlace para volver al inicio", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "home", component: { template: "<div />" } },
        { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
      ],
    });
    await router.push("/no-existe");
    await router.isReady();

    const wrapper = mount(NotFoundView, { global: { plugins: [router] } });

    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Página no encontrada");
    expect(wrapper.find("[data-test=go-home]").exists()).toBe(true);
  });
});
