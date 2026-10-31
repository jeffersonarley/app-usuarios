import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PaginationBar from "@/components/PaginationBar.vue";

describe("PaginationBar", () => {
  it("en la página 1 deshabilita Anterior y emite change con la página siguiente", async () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 1, totalPages: 3, total: 20, limit: 8 },
    });

    expect(wrapper.find("[data-test=pagination-info]").text()).toBe("Mostrando 1–8 de 20");
    expect(wrapper.find("[data-test=pagination-prev]").attributes("disabled")).toBeDefined();
    expect(wrapper.find("[data-test=pagination-next]").attributes("disabled")).toBeUndefined();

    await wrapper.find("[data-test=pagination-next]").trigger("click");

    expect(wrapper.emitted("change")[0]).toEqual([2]);
  });

  it("en la última página deshabilita Siguiente y Anterior emite la página previa", async () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 3, totalPages: 3, total: 20, limit: 8 },
    });

    expect(wrapper.find("[data-test=pagination-info]").text()).toBe("Mostrando 17–20 de 20");
    expect(wrapper.find("[data-test=pagination-next]").attributes("disabled")).toBeDefined();

    await wrapper.find("[data-test=pagination-prev]").trigger("click");

    expect(wrapper.emitted("change")[0]).toEqual([2]);
  });

  it("sin resultados muestra 0–0 de 0", () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 1, totalPages: 1, total: 0, limit: 8 },
    });

    expect(wrapper.find("[data-test=pagination-info]").text()).toBe("Mostrando 0–0 de 0");
    expect(wrapper.find("[data-test=pagination-page]").text()).toBe("Página 1 de 1");
  });
});
