---
name: review-code
description: CLAUDE.mdの規約に沿ってコードをレビューします。コードレビュー、規約チェック、実装確認時に使用してください。
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# コードレビュースキル

## 概要

このスキルはCLAUDE.mdに定義された規約に基づいてコードをレビューします。

## チェック項目

### 1. コーディング規約

- [ ] クラス内にクラスを定義していないか（ネストしたクラス禁止）
- [ ] rubocop:disableコメントを使用していないか
- [ ] pnpmを使用しているか（npmではなく）

### 2. バックエンド（Rails）

```bash
# RuboCopチェック
docker compose exec backend bundle exec rubocop

# テスト実行
docker compose exec backend env RAILS_ENV=test bundle exec rspec
```

### 3. フロントエンド（Next.js）

```bash
# ESLintチェック
docker compose exec frontend pnpm run lint

# TypeScriptチェック
docker compose exec frontend pnpm run typecheck
```

## レビュー手順

1. 変更されたファイルを特定（`git diff --name-only`）
2. 各ファイルに対してCLAUDE.mdの規約をチェック
3. RuboCop/ESLint/TypeScriptの警告を確認
4. テストが通るか確認
5. 問題点をリストアップして報告

## 規約チェックリスト

CLAUDE.mdのDevelopment Guidelinesを参照:

1. パッケージマネージャー: pnpm使用
2. APIコール: 提供されたAPIクライアントを使用
3. 認証: 保護された機能の前に認証状態をチェック
4. コミット: 小さく頻繁なコミット
5. コードスタイル: 既存パターンに従う
6. Docker依存: パッケージ更新後はイメージを再ビルド
7. **No Nested Classes**: クラス内にクラスを定義しない
8. **RuboCop Disable禁止**: コード内でのdisableコメントは使用しない
