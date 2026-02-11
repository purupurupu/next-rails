# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

日本語で回答してください。

## Architecture Overview

Full-stack Todo + Notes application with user authentication:

- **Frontend**: Next.js 16.1.3 with TypeScript, React 19, Tailwind CSS v4, SWR
- **Package Manager**: pnpm（npmは使用禁止）
- **Backend**: Rails 8.0.0 API-only (Ruby 3.4.5) with Devise + JWT
- **Database**: PostgreSQL 15
- **Cache/Jobs**: Redis 7 + Sidekiq
- **Infrastructure**: Docker Compose (frontend, backend, db, redis)

Services: Frontend `:3000` / Backend API `:3001` / PostgreSQL `:5432` / Redis `:6379`

詳細な技術ドキュメントは [docs/](./docs/) を参照。

## Common Development Commands

### Docker Operations

```bash
docker compose up -d                    # Start all services
docker compose logs -f backend          # View backend logs
docker compose logs -f frontend         # View frontend logs
docker compose exec backend rails console  # Rails console

# Database
docker compose exec backend bundle exec rails db:create
docker compose exec backend bundle exec rails db:migrate
docker compose exec backend bundle exec rails db:seed
docker compose exec backend bash -c "RESET_DB=true bundle exec rails db:seed"  # Reset and seed

# IMPORTANT: Rebuild after dependency changes
docker compose build frontend           # After package.json changes
docker compose build backend            # After Gemfile changes
docker compose build --no-cache frontend # If dependency issues persist
```

### Frontend (inside container)

```bash
docker compose exec frontend pnpm run lint        # ESLint
docker compose exec frontend pnpm run lint:fix    # ESLint auto-fix
docker compose exec frontend pnpm run typecheck   # TypeScript check
```

**開発中は `pnpm run build` を実行しない**（型チェックは `pnpm run typecheck` で行う）

### Backend (inside container)

```bash
# Tests (always use RAILS_ENV=test)
docker compose exec backend env RAILS_ENV=test bundle exec rspec
docker compose exec backend env RAILS_ENV=test bundle exec rspec spec/models/todo_spec.rb
docker compose exec backend env RAILS_ENV=test bundle exec rspec --format documentation
docker compose exec backend env COVERAGE=true RAILS_ENV=test bundle exec rspec

# Linter
docker compose exec backend bundle exec rubocop
docker compose exec backend bundle exec rubocop -a    # Auto-correct safe
docker compose exec backend bundle exec rubocop -A    # Auto-correct all
```

### Pre-PR Checklist

```bash
docker compose exec frontend pnpm run lint
docker compose exec frontend pnpm run typecheck
docker compose exec backend env RAILS_ENV=test bundle exec rspec
docker compose exec backend bundle exec rubocop
```

## Key Architecture Decisions

### BFF (Backend for Frontend) Pattern

All API calls from the browser go through Next.js Route Handlers, never directly to Rails:

```
Browser → Next.js BFF (/api/v1/[...path]/route.ts) → Rails API (:3001)
         ↓ Cookie → Authorization header injection
```

- **汎用プロキシ**: `app/api/v1/[...path]/route.ts` が全 `/api/v1/*` リクエストをRailsに転送
- **認証フロー**: JWT token は httpOnly Cookie に保存（XSS対策）。BFF が Cookie から token を取り出し、Authorization ヘッダーとして Rails に送信
- **ファイルアップロード**: multipart/form-data をそのまま転送
- **認証用BFFエンドポイント**: `app/api/auth/login|register|logout|me/route.ts`

### Feature-based Frontend Architecture

```
frontend/src/
├── app/                  # Next.js App Router（ルーティングのみ）
├── components/           # 横断的UIコンポーネント（shadcn/ui含む）
├── contexts/             # React Contexts（auth-context）
├── features/             # ドメイン別機能モジュール
│   ├── todo/             # Todo機能（components, hooks, lib, types）
│   ├── notes/            # Notes機能（components, hooks, lib, types）
│   ├── category/         # Category機能
│   └── tag/              # Tag機能
├── hooks/                # 横断的hooks（useDebounce, useFocusTrap）
├── lib/                  # 共通ライブラリ
│   ├── api-client.ts     # Base HttpClient（全API clientの基底クラス）
│   ├── server/api-client.ts  # サーバーサイドAPI client
│   ├── auth/config.ts    # Cookie設定・バックエンドURL
│   ├── swr-config.ts     # SWR設定（default/shortCache/longCache）
│   ├── validation-utils.ts   # Zod検証ヘルパー
│   └── error-utils.ts    # エラーメッセージ抽出
├── styles/               # CSS
└── types/                # 横断的型定義
```

各featureは `components/`, `hooks/`, `lib/`, `types/` を持ち、feature-specific API clientは `HttpClient` を継承する。

### API Client Hierarchy

```
HttpClient (lib/api-client.ts) ← credentials: "include" で Cookie 自動送信
  ├── TodoApiClient (features/todo/lib/api-client.ts)
  ├── NotesApiClient (features/notes/lib/api-client.ts)
  ├── CategoryApiClient (features/category/lib/api-client.ts)
  └── TagApiClient (features/tag/lib/api-client.ts)
```

### Backend Models

- **User**: Devise認証（email/password）
- **Todo**: title, completed, position, priority(low/medium/high), status(pending/in_progress/completed), description, due_date, category_id, tag_ids, files(Active Storage)
- **Note**: title, body(Markdown), pinned, archived, trashed + NoteRevision（リビジョン履歴、最新50件保持）
- **Category/Tag**: User-scoped、name + color。TodoとTagはmany-to-many（TodoTag中間テーブル）
- **Comment**: Polymorphic、soft delete、15分間の編集制限
- **TodoHistory**: 全Todo変更の自動監査ログ（JSONB）

### API Endpoints

- `/auth/*` - 認証（login, register, logout）
- `/api/v1/todos/*` - Todo CRUD + bulk reorder + search + file attachments
- `/api/v1/notes/*` - Notes CRUD + revisions + restore
- `/api/v1/categories/*`, `/api/v1/tags/*` - CRUD
- `/api/v1/todos/:id/comments/*` - コメント（soft delete付き）
- `/api/v1/todos/:id/histories` - 変更履歴

## Development Guidelines

### コーディング規約

- **No Nested Classes**: クラス内にクラスを定義しない（別ファイルに分離）
- **RuboCop Disable禁止**: コード内での `rubocop:disable` コメントは使用しない。必要なら `.rubocop.yml` で設定
- **API Calls**: 直接 `fetch` を使わず、提供されている API client を使用
- **TypeScript Path Aliases**: `@/*` で `src/` ディレクトリからインポート
- **TSDoc**: エクスポートされる関数・クラス・インターフェース・型にはTSDoc形式でドキュメントコメントを記述

### ESLint Rules (frontend)

- ダブルクォート、セミコロン必須、2スペースインデント
- アロー関数の括弧は常に使用、1TBS braceスタイル
- 最大行長: 100文字

### Naming Conventions

| 対象                | 規則                            | 例              |
| ------------------- | ------------------------------- | --------------- |
| Components          | PascalCase                      | `TodoItem.tsx`  |
| Hooks               | camelCase + `use` prefix        | `useTodos.ts`   |
| Utilities/Types     | kebab-case                      | `api-client.ts` |
| React components    | PascalCase                      | `TodoItem`      |
| Functions/variables | camelCase                       | `fetchTodos`    |
| Constants           | UPPER_SNAKE_CASE                | `API_ENDPOINTS` |
| Interfaces          | PascalCase + descriptive suffix | `TodoItemProps` |

### Git Commits

Conventional commits: `type(scope): description`（50文字以内）

Types: feat, fix, docs, style, refactor, test, chore

## Docker Environment

- Backend内部URL: `BACKEND_URL=http://backend:3000`（コンテナ間通信）
- 外部ポートマッピング: backend `:3001` → container `:3000`
- Test DB: `todo_app_test`、Dev DB: `todo_next`
- `.env` ファイルに `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `RAILS_MASTER_KEY`, `SECRET_KEY_BASE` を設定

## Troubleshooting

### Node modules issues in Docker

`Module not found` / pnpm store mismatch / Turbopack panic が出た場合:

```bash
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```
