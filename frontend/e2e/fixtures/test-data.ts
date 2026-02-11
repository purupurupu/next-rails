/** seeds.rb に対応するテストユーザー情報 */
export const TEST_USERS = {
  demo: {
    name: "デモユーザー",
    email: "demo@example.com",
    password: "password123",
  },
} as const;

/** E2Eテストで作成するデータに付与するプレフィックス（テスト後の識別・削除用） */
export const E2E_PREFIX = "[E2E]";

/** ユニークなテストデータタイトルを生成する */
export function uniqueTitle(base: string): string {
  const id = Date.now().toString(36);
  return `${E2E_PREFIX} ${base} ${id}`;
}
