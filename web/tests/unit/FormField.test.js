import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import FormField from "@/components/FormField.vue";

describe("FormField", () => {
  it("muestra el error con data-test {testId}-error", () => {
    const wrapper = mount(FormField, {
      props: { label: "Email", testId: "login-email", error: "El email no tiene un formato válido" },
    });

    expect(wrapper.find("[data-test=login-email-error]").text()).toBe(
      "El email no tiene un formato válido",
    );
    expect(wrapper.find("input").attributes("aria-invalid")).toBe("true");
  });

  it("el botón Mostrar/Ocultar cambia el tipo del input", async () => {
    const wrapper = mount(FormField, {
      props: { label: "Contraseña", type: "password", testId: "login-password" },
    });

    const input = wrapper.find("[data-test=login-password]");
    expect(input.attributes("type")).toBe("password");

    await wrapper.find("[data-test=login-password-toggle]").trigger("click");
    expect(input.attributes("type")).toBe("text");
    expect(wrapper.find("[data-test=login-password-toggle]").text()).toBe("Ocultar");

    await wrapper.find("[data-test=login-password-toggle]").trigger("click");
    expect(input.attributes("type")).toBe("password");
  });

  it("actualiza el modelo con v-model", async () => {
    const wrapper = mount(FormField, {
      props: { label: "Nombre", testId: "nombre", modelValue: "" },
    });

    await wrapper.find("[data-test=nombre]").setValue("Ana Torres");

    expect(wrapper.emitted("update:modelValue")[0]).toEqual(["Ana Torres"]);
  });
});
