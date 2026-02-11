import { chromium, type FullConfig } from "@playwright/test";
import { TEST_USERS } from "./fixtures/test-data";

/**
 * グローバルセットアップ: テストスイート実行前に一度だけログインし、
 * 認証Cookieを storageState として保存する。
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL
    || process.env.PLAYWRIGHT_BASE_URL
    || "http://localhost:3000";

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  await page.goto("/auth");
  await page.getByLabel("メールアドレス").fill(TEST_USERS.demo.email);
  await page.getByLabel("パスワード").fill(TEST_USERS.demo.password);
  await page.getByRole("button", { name: "ログイン" }).click();

  await page.waitForURL("/");

  await page.context().storageState({ path: "e2e/.auth/demo-user.json" });
  await browser.close();
}

export default globalSetup;
