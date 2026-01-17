import type { BaseEntity } from "./common";

/**
 * ユーザーエンティティの完全な型
 *
 * @remarks
 * 認証済みユーザー情報など、完全なユーザー情報が必要な場合に使用
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
}

/**
 * ユーザー参照型（軽量版）
 *
 * @remarks
 * コメントや履歴など、ユーザーへの参照のみが必要な場合に使用。
 * タイムスタンプを含まない軽量な型。
 */
export type UserRef = Pick<User, "id" | "name" | "email">;
