import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToast } from "@/composables/useToast.js";

const toast = useToast();

const limpiar = () => {
  for (const item of [...toast.toasts]) toast.dismiss(item.id);
};

beforeEach(() => {
  limpiar();
});

describe("useToast", () => {
  it("success agrega una notificación de tipo success", () => {
    toast.success("Perfil actualizado");

    expect(toast.toasts).toHaveLength(1);
    expect(toast.toasts[0]).toMatchObject({ message: "Perfil actualizado", type: "success" });
  });

  it("error agrega una notificación de tipo error", () => {
    toast.error("No se pudo guardar");

    expect(toast.toasts).toHaveLength(1);
    expect(toast.toasts[0]).toMatchObject({ message: "No se pudo guardar", type: "error" });
  });

  it("success se elimina solo después de 3500 ms", () => {
    vi.useFakeTimers();
    toast.success("Temporal");

    expect(toast.toasts).toHaveLength(1);
    vi.advanceTimersByTime(3499);
    expect(toast.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.toasts).toHaveLength(0);
  });

  it("error se elimina solo después de 5000 ms", () => {
    vi.useFakeTimers();
    toast.error("Temporal");

    vi.advanceTimersByTime(4999);
    expect(toast.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.toasts).toHaveLength(0);
  });

  it("dismiss elimina una notificación por su id", () => {
    const id = toast.success("Para cerrar");

    toast.dismiss(id);

    expect(toast.toasts).toHaveLength(0);
  });
});
