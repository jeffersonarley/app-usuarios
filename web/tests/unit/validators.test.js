import { describe, expect, it } from "vitest";
import {
  isValid,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from "@/utils/validators.js";

describe("validateName", () => {
  it("rechaza un nombre vacío", () => {
    expect(validateName("   ")).toBe("El nombre es obligatorio");
  });

  it("rechaza un nombre de menos de 2 caracteres", () => {
    expect(validateName("A")).toBe("El nombre debe tener entre 2 y 60 caracteres");
  });

  it("rechaza un nombre de más de 60 caracteres", () => {
    expect(validateName("a".repeat(61))).toBe("El nombre debe tener entre 2 y 60 caracteres");
  });

  it("acepta un nombre válido", () => {
    expect(validateName("Ana Torres")).toBe("");
  });
});

describe("validateEmail", () => {
  it("rechaza un email vacío", () => {
    expect(validateEmail("")).toBe("El email es obligatorio");
  });

  it("rechaza un email con formato inválido", () => {
    expect(validateEmail("ana-arroba-demo.com")).toBe("El email no tiene un formato válido");
  });

  it("acepta un email válido", () => {
    expect(validateEmail("ana@demo.com")).toBe("");
  });
});

describe("validatePassword", () => {
  it("rechaza una contraseña vacía", () => {
    expect(validatePassword("")).toBe("La contraseña es obligatoria");
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(validatePassword("Ab1")).toBe("La contraseña debe tener entre 8 y 64 caracteres");
  });

  it("rechaza una contraseña sin mayúscula", () => {
    expect(validatePassword("password1")).toBe("La contraseña debe incluir al menos una mayúscula");
  });

  it("rechaza una contraseña sin minúscula", () => {
    expect(validatePassword("PASSWORD1")).toBe("La contraseña debe incluir al menos una minúscula");
  });

  it("rechaza una contraseña sin número", () => {
    expect(validatePassword("Password")).toBe("La contraseña debe incluir al menos un número");
  });

  it("acepta una contraseña válida", () => {
    expect(validatePassword("Password1")).toBe("");
  });
});

describe("validatePasswordConfirmation", () => {
  it("rechaza una confirmación vacía", () => {
    expect(validatePasswordConfirmation("Password1", "")).toBe("Repite la contraseña");
  });

  it("rechaza cuando las contraseñas no coinciden", () => {
    expect(validatePasswordConfirmation("Password1", "Password2")).toBe("Las contraseñas no coinciden");
  });

  it("acepta cuando coinciden", () => {
    expect(validatePasswordConfirmation("Password1", "Password1")).toBe("");
  });
});

describe("isValid", () => {
  it("devuelve true cuando no hay mensajes de error", () => {
    expect(isValid({ nombre: "", email: "" })).toBe(true);
  });

  it("devuelve false cuando algún campo tiene error", () => {
    expect(isValid({ nombre: "", email: "El email es obligatorio" })).toBe(false);
  });
});
