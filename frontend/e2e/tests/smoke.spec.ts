import { expect, test } from "@playwright/test";
import { NavigationPage } from "../pages/navigation.page";

test.describe("スモークテスト", () => {
  test("認証済みユーザーで全主要ページが表示できる", async ({ page }) => {
    const nav = new NavigationPage(page);

    // Todoリストページ
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "TODO", level: 1 })).toBeVisible();

    // カテゴリーページ（見出しは h2）
    await nav.categoriesLink.click();
    await page.waitForURL("/categories");
    await expect(page.getByRole("heading", { name: "カテゴリー" })).toBeVisible();

    // タグページ（見出しは h2）
    await nav.tagsLink.click();
    await page.waitForURL("/tags");
    await expect(page.getByRole("heading", { name: "タグ" })).toBeVisible();

    // ノートページ（見出し要素なし、テキストで確認）
    await nav.notesLink.click();
    await page.waitForURL("/notes");
    await expect(page.getByText("ノート", { exact: true })).toBeVisible();
  });
});
