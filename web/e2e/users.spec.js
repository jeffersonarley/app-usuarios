import { test, expect } from "@playwright/test";
import { crearUsuarioApi, emailUnico, login, tokenDe } from "./helpers.js";

test("el admin crea un usuario, lo encuentra con el buscador y lo edita", async ({ page }) => {
  const email = emailUnico("creado");

  await login(page, "admin@demo.com", "Admin123!");
  await expect(page).toHaveURL(/\/usuarios/);

  await page.getByTestId("users-new").click();
  await expect(page).toHaveURL(/\/usuarios\/nuevo/);
  await page.getByTestId("user-name").fill("Usuario Creado");
  await page.getByTestId("user-email").fill(email);
  await page.getByTestId("user-password").fill("Password1");
  await page.getByTestId("user-submit").click();
  await expect(page).toHaveURL(/\/usuarios$/);

  await page.getByTestId("users-search").fill(email);
  await expect(page.getByTestId("user-row").first()).toContainText(email);
  await page.getByTestId("user-edit").first().click();
  await expect(page).toHaveURL(/\/editar/);

  await page.getByTestId("user-name").fill("Usuario Editado");
  await page.getByTestId("user-submit").click();
  await expect(page).toHaveURL(/\/usuarios$/);

  await page.getByTestId("users-search").fill(email);
  await expect(page.getByTestId("user-row").first()).toContainText(email);
  await expect(page.getByTestId("user-row").first()).toContainText("Usuario Editado");
});

test("el admin elimina un usuario y ese usuario ya no puede iniciar sesión", async ({ page, request }) => {
  const email = emailUnico("borrar");
  const token = await tokenDe(request, "admin@demo.com", "Admin123!");
  await crearUsuarioApi(request, token, { nombre: "Para Borrar", email });

  await login(page, "admin@demo.com", "Admin123!");
  await expect(page).toHaveURL(/\/usuarios/);

  await page.getByTestId("users-search").fill(email);
  await expect(page.getByTestId("user-row").first()).toContainText(email);
  await page.getByTestId("user-delete").first().click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await page.getByTestId("confirm-accept").click();
  await expect(page.getByTestId("user-row")).toHaveCount(0);

  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill("Password1");
  await page.getByTestId("login-submit").click();

  await expect(page.getByTestId("alert")).toContainText("Usuario desactivado");
});

test("el filtro por rol y la paginación actualizan el listado", async ({ page, request }) => {
  const token = await tokenDe(request, "admin@demo.com", "Admin123!");
  for (let i = 0; i < 10; i++) {
    await crearUsuarioApi(request, token, { nombre: `Paginado ${i}`, email: emailUnico("pagina") });
  }

  await login(page, "admin@demo.com", "Admin123!");
  await expect(page).toHaveURL(/\/usuarios/);

  const info = page.getByTestId("pagination-info");
  const inicial = await info.textContent();
  await page.getByTestId("pagination-next").click();
  await expect(info).not.toHaveText(inicial);

  await page.getByTestId("users-role-filter").selectOption("admin");
  await expect(page).toHaveURL(/rol=admin/);
  await expect(page.getByTestId("user-row").first()).toContainText("Administrador");
});
