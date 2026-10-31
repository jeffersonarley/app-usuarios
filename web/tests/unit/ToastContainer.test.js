import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ToastContainer from "@/components/ToastContainer.vue";
import { useToast } from "@/composables/useToast.js";

const toast = useToast();

beforeEach(() => {
  for (const item of [...toast.toasts]) toast.dismiss(item.id);
});

describe("ToastContainer", () => {
  it("muestra los toasts activos", async () => {
    toast.success("Perfil actualizado");
    const wrapper = mount(ToastContainer);

    await nextTick();
    const elementos = wrapper.findAll("[data-test=toast]");
    expect(elementos).toHaveLength(1);
    expect(elementos[0].text()).toContain("Perfil actualizado");
    expect(elementos[0].classes()).toContain("toast--success");
  });

  it("el botón de cerrar elimina el toast", async () => {
    toast.error("Algo salió mal");
    const wrapper = mount(ToastContainer);
    await nextTick();

    await wrapper.find(".toast__close").trigger("click");
    await nextTick();

    expect(wrapper.findAll("[data-test=toast]")).toHaveLength(0);
  });
});
