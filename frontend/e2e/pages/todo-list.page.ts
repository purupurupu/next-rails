import type { Locator, Page } from "@playwright/test";

/** Todoリストページの操作を提供する Page Object */
export class TodoListPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly addButton: Locator;
  readonly todoList: Locator;

  // Todoフォーム（ダイアログ内）
  readonly dialogTitle: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: "TODO", level: 1 });
    this.addButton = page.getByRole("button", { name: "タスクを追加" });
    this.todoList = page.getByRole("list", { name: "タスク一覧" });

    this.dialogTitle = page.getByRole("heading", { name: "タスクを追加" });
    this.titleInput = page.getByLabel("タスク名");
    this.descriptionInput = page.getByLabel("説明（任意）");
    this.submitButton = page.getByRole("button", { name: "追加", exact: true });
    this.cancelButton = page.getByRole("button", { name: "キャンセル" });
  }

  /** トップページ（Todoリスト）へ遷移する */
  async goto() {
    await this.page.goto("/");
    await this.heading.waitFor({ state: "visible" });
  }

  /** 「タスクを追加」ダイアログを開き、タイトルを入力して追加する */
  async addTodo(title: string, description?: string) {
    await this.addButton.click();
    await this.dialogTitle.waitFor({ state: "visible" });

    await this.titleInput.fill(title);
    if (description) {
      await this.descriptionInput.fill(description);
    }
    await this.submitButton.click();

    // ダイアログが閉じるのを待つ
    await this.dialogTitle.waitFor({ state: "hidden" });
  }

  /** 指定タイトルのTodoアイテムのチェックボックスをクリックする */
  async toggleTodo(title: string) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const checkbox = this.page.getByRole("checkbox", {
      name: new RegExp(`${escaped}を`),
    });
    await checkbox.click();
  }

  /** 指定タイトルのTodoアイテムの削除ボタンをクリックする */
  async deleteTodo(title: string) {
    const item = this.todoList.getByRole("listitem").filter({ hasText: title });
    await item.getByRole("button", { name: "削除" }).click();
  }

  /** 指定タイトルのTodoアイテムが表示されているか確認用のロケーターを返す */
  getTodoItem(title: string): Locator {
    return this.todoList.getByRole("listitem").filter({ hasText: title });
  }
}
