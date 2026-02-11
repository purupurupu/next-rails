import { expect, test } from "@playwright/test";
import { uniqueTitle } from "../../fixtures/test-data";
import { AuthPage } from "../../pages/auth.page";
import { NavigationPage } from "../../pages/navigation.page";

test.describe("ユーザー登録", () => {
  test("新規ユーザーを登録すると / にリダイレクトされる", async ({ page }) => {
    const authPage = new AuthPage(page);
    const nav = new NavigationPage(page);

    const testEmail = `e2e-${Date.now()}@example.com`;
    const testName = uniqueTitle("テストユーザー");

    await authPage.goto();
    await authPage.register(testName, testEmail, "password123");

    await page.waitForURL("/");
    await expect(nav.logoutButton).toBeVisible();
  });
});
