// Cada prueba es independiente: se limpia el almacenamiento y se restauran
// los mocks antes de ejecutarla.
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});
