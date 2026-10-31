import { test, expect } from "@playwright/test";
import { emailUnico, login } from "./helpers.js";

test("login con credenciales incorrectas muestra el alert y se queda en /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("admin@demo.com");
  await page.getByTestId("login-password").fill("Incorrecta1");
  await page.getByTestId("login-submit").click();

  await expect(page.getByTestId("alert")).toContainText("Credenciales inválidas");
  await expect(page).toHaveURL(/\/login/);
});

test("el registro de una cuenta nueva entra a /perfil con el rol Usuario", async ({ page }) => {
  const email = emailUnico("registro");

  await page.goto("/registro");
  await page.getByTestId("register-name").fill("Persona Nueva");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("Password1");
  await page.getByTestId("register-confirmation").fill("Password1");
  await page.getByTestId("register-submit").click();

  await expect(page).toHaveURL(/\/perfil/);
  await expect(page.getByTestId("profile-role")).toHaveText("Usuario");
});

test("un usuario con rol usuario que abre /usuarios es redirigido a /perfil", async ({ page }) => {
  await login(page, "ana@demo.com", "Usuario123");
  await expect(page).toHaveURL(/\/perfil/);

  await page.goto("/usuarios");

  await expect(page).toHaveURL(/\/perfil/);
});

test("sin sesión, /usuarios redirige a /login", async ({ page }) => {
  await page.goto("/usuarios");

  await expect(page).toHaveURL(/\/login/);
});

test("una ruta que no existe muestra la página de no encontrada", async ({ page }) => {
  await page.goto("/esta-ruta-no-existe");

  await expect(page.getByText("Página no encontrada")).toBeVisible();
  await expect(page.getByTestId("go-home")).toBeVisible();
});
