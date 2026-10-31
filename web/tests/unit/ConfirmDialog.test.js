import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const montar = (props = {}) =>
  mount(ConfirmDialog, {
    props: { open: true, title: "Eliminar usuario", message: "Se eliminará a Ana", ...props },
    global: { stubs: { teleport: true } },
  });

describe("ConfirmDialog", () => {
  it("emite confirm al pulsar confirm-accept", async () => {
    const wrapper = montar();

    await wrapper.find("[data-test=confirm-accept]").trigger("click");

    expect(wrapper.emitted("confirm")).toHaveLength(1);
  });

  it("emite cancel al pulsar confirm-cancel", async () => {
    const wrapper = montar();

    await wrapper.find("[data-test=confirm-cancel]").trigger("click");

    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("no renderiza el diálogo cuando open es false", () => {
    const wrapper = montar({ open: false });

    expect(wrapper.find("[data-test=confirm-dialog]").exists()).toBe(false);
  });
});
