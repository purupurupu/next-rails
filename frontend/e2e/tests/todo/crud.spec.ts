import { expect, test } from "@playwright/test";
import { uniqueTitle } from "../../fixtures/test-data";
import { deleteTodo } from "../../helpers/api";
import { TodoListPage } from "../../pages/todo-list.page";

test.describe("Todo CRUD", () => {
  let createdTodoIds: number[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdTodoIds) {
      await deleteTodo(request, id);
    }
    createdTodoIds = [];
  });

  test("新しいTodoを作成できる", async ({ page, request }) => {
    const todoPage = new TodoListPage(page);
    const title = uniqueTitle("テストタスク");

    await todoPage.goto();
    await todoPage.addTodo(title);

    // ダイアログが閉じてTodoが表示されるのを待つ
    await expect(todoPage.getTodoItem(title)).toBeVisible({ timeout: 10_000 });

    // クリーンアップ用にIDを取得
    const response = await request.get("/api/v1/todos");
    const body = await response.json();
    const todos = Array.isArray(body) ? body : body.data ?? [];
    const created = todos.find(
      (t: { title: string }) => t.title === title,
    );
    if (created) createdTodoIds.push(created.id);
  });

  test("Todoの完了状態をトグルできる", async ({ page, request }) => {
    const todoPage = new TodoListPage(page);
    const title = uniqueTitle("完了トグル");

    await todoPage.goto();
    await todoPage.addTodo(title);
    await expect(todoPage.getTodoItem(title)).toBeVisible({ timeout: 10_000 });

    // 完了トグル
    await todoPage.toggleTodo(title);

    // チェックボックスがチェックされることを確認
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const checkbox = page.getByRole("checkbox", {
      name: new RegExp(`${escaped}を`),
    });
    await expect(checkbox).toBeChecked({ timeout: 5_000 });

    // クリーンアップ
    const response = await request.get("/api/v1/todos");
    const body = await response.json();
    const todos = Array.isArray(body) ? body : body.data ?? [];
    const created = todos.find(
      (t: { title: string }) => t.title === title,
    );
    if (created) createdTodoIds.push(created.id);
  });

  test("Todoを削除できる", async ({ page }) => {
    const todoPage = new TodoListPage(page);
    const title = uniqueTitle("削除テスト");

    await todoPage.goto();
    await todoPage.addTodo(title);
    await expect(todoPage.getTodoItem(title)).toBeVisible({ timeout: 10_000 });

    // 削除
    await todoPage.deleteTodo(title);

    // 削除確認ダイアログがあれば承認する
    const confirmButton = page.getByRole("button", { name: "削除" });
    if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Todoが消えることを確認
    await expect(todoPage.getTodoItem(title)).not.toBeVisible({ timeout: 10_000 });
  });
});
