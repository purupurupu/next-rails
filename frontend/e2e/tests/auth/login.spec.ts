import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../../fixtures/test-data";
import { AuthPage } from "../../pages/auth.page";
import { NavigationPage } from "../../pages/navigation.page";

test.describe("ログイン", () => {
  test("正しい資格情報でログインすると / にリダイレクトされる", async ({ page }) => {
    const authPage = new AuthPage(page);
    const nav = new NavigationPage(page);

    await authPage.goto();
    await authPage.login(TEST_USERS.demo.email, TEST_USERS.demo.password);

    await page.waitForURL("/");
    await expect(nav.logoutButton).toBeVisible();
  });

  test("不正な資格情報ではエラーメッセージが表示される", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.login("wrong@example.com", "wrongpassword");

    await expect(authPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });
});
