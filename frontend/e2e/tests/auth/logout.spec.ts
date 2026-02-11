import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../fixtures/test-data";
import { AuthPage } from "../../pages/auth.page";
import { NavigationPage } from "../../pages/navigation.page";

test.describe("ログアウト", () => {
  test("ログアウトするとナビゲーションにログインリンクが表示される", async ({ page }) => {
    const authPage = new AuthPage(page);
    const nav = new NavigationPage(page);

    // まずログインする
    await authPage.goto();
    await authPage.login(TEST_USERS.demo.email, TEST_USERS.demo.password);
    await page.waitForURL("/");
    await expect(nav.logoutButton).toBeVisible();

    // ログアウト実行
    await nav.logout();

    // ログインリンクが表示されることを確認
    await expect(nav.loginButton).toBeVisible();
    await expect(nav.logoutButton).not.toBeVisible();
  });
});
