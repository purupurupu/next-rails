import type { Locator, Page } from "@playwright/test";

/** ナビゲーションバーの操作を提供する Page Object */
export class NavigationPage {
  readonly page: Page;

  readonly appTitle: Locator;
  readonly tasksLink: Locator;
  readonly categoriesLink: Locator;
  readonly tagsLink: Locator;
  readonly notesLink: Locator;
  readonly logoutButton: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.appTitle = page.getByRole("link", { name: "TODO App" });
    this.tasksLink = page.getByRole("link", { name: "タスク" });
    this.categoriesLink = page.getByRole("link", { name: "カテゴリー" });
    this.tagsLink = page.getByRole("link", { name: "タグ" });
    this.notesLink = page.getByRole("link", { name: "ノート" });
    this.logoutButton = page.getByRole("button", { name: "ログアウト" });
    this.loginButton = page.getByRole("link", { name: "ログイン" });
  }

  /** ログアウトを実行する */
  async logout() {
    await this.logoutButton.click();
  }
}
