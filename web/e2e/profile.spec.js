import { test, expect } from "@playwright/test";
import { emailUnico } from "./helpers.js";

test("el usuario cambia su contraseña, cierra sesión e inicia con la nueva", async ({ page }) => {
  const email = emailUnico("password");

  await page.goto("/registro");
  await page.getByTestId("register-name").fill("Cambio Password");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("Password1");
  await page.getByTestId("register-confirmation").fill("Password1");
  await page.getByTestId("register-submit").click();
  await expect(page).toHaveURL(/\/perfil/);

  await page.getByTestId("password-current").fill("Password1");
  await page.getByTestId("password-new").fill("NuevaClave1");
  await page.getByTestId("password-confirmation").fill("NuevaClave1");
  await page.getByTestId("password-submit").click();
  await expect(page.getByText("Contraseña actualizada")).toBeVisible();

  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("Password1");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("alert")).toContainText("Credenciales inválidas");

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("NuevaClave1");
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/perfil/);
});
