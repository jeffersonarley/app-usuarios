import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import AlertMessage from "@/components/AlertMessage.vue";

describe("AlertMessage", () => {
  it("no renderiza nada sin mensaje", () => {
    const wrapper = mount(AlertMessage);

    expect(wrapper.find("[data-test=alert]").exists()).toBe(false);
  });

  it("muestra el mensaje con el tipo indicado", () => {
    const wrapper = mount(AlertMessage, { props: { message: "Credenciales inválidas", type: "error" } });

    const alerta = wrapper.find("[data-test=alert]");
    expect(alerta.text()).toBe("Credenciales inválidas");
    expect(alerta.classes()).toContain("alert--error");
    expect(alerta.attributes("role")).toBe("alert");
  });
});
