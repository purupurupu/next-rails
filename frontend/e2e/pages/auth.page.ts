import type { Locator, Page } from "@playwright/test";

/** ログイン・登録ページの操作を提供する Page Object */
export class AuthPage {
  readonly page: Page;

  // ログインフォーム
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly switchToRegisterButton: Locator;

  // 登録フォーム
  readonly nameInput: Locator;
  readonly passwordConfirmationInput: Locator;
  readonly registerButton: Locator;
  readonly switchToLoginButton: Locator;

  // 共通
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByLabel("メールアドレス");
    this.passwordInput = page.getByLabel("パスワード", { exact: true });
    this.loginButton = page.getByRole("button", { name: "ログイン" });
    this.switchToRegisterButton = page.getByRole("button", {
      name: "アカウントをお持ちでない方はこちら",
    });

    this.nameInput = page.getByLabel("名前");
    this.passwordConfirmationInput = page.getByLabel("パスワード確認");
    this.registerButton = page.getByRole("button", { name: "アカウント作成" });
    this.switchToLoginButton = page.getByRole("button", {
      name: "既にアカウントをお持ちの方はこちら",
    });

    this.errorMessage = page.locator(".text-red-600");
  }

  /** /auth ページへ遷移する */
  async goto() {
    await this.page.goto("/auth");
  }

  /** メールアドレスとパスワードを入力してログインする */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** 登録フォームに切り替え、新規ユーザーを作成する */
  async register(name: string, email: string, password: string) {
    await this.switchToRegisterButton.click();
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.passwordConfirmationInput.fill(password);
    await this.registerButton.click();
  }
}
