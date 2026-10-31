import { expect } from "@playwright/test";

let contador = 0;

export const emailUnico = (prefijo = "e2e") =>
  `${prefijo}.${Date.now()}.${contador++}.${Math.random().toString(36).slice(2, 7)}@demo.com`;

/** Inicia sesión desde la interfaz. */
export async function login(page, email, password) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
}

/** Token de un usuario usando la API (a través del proxy de Vite). */
export async function tokenDe(request, email, password) {
  const res = await request.post("/api/auth/login", { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

/** Crea un usuario con la API para preparar datos de una prueba. */
export async function crearUsuarioApi(request, token, datos) {
  const res = await request.post("/api/usuarios", {
    headers: { "x-token": token },
    data: { password: "Password1", rol: "usuario", ...datos },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}
