# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack Todo application using:
- **Frontend**: Next.js 15.4.1 with TypeScript, React 19, and Tailwind CSS v4
- **Package Manager**: pnpm (NOT npm)
- **Backend**: Rails 7.1.3+ API-only application  
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker Compose orchestrating three services

Services run on:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

## Common Development Commands

### Docker Operations
```bash
# Start all services
docker compose up -d

# Database operations (run after services are up)
docker compose exec backend bundle exec rails db:create
docker compose exec backend bundle exec rails db:migrate
docker compose exec backend bundle exec rails db:seed

# Access Rails console
docker compose exec backend rails console

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Frontend Development
```bash
# All commands run inside the frontend container
docker compose exec frontend pnpm run dev        # Development server
docker compose exec frontend pnpm run build      # Production build
docker compose exec frontend pnpm run start      # Production server
docker compose exec frontend pnpm run lint       # ESLint
docker compose exec frontend pnpm run lint:fix   # ESLint with auto-fix
docker compose exec frontend pnpm run typecheck  # TypeScript type checking
docker compose exec frontend pnpm run typecheck:full  # Full TypeScript check
```

### Frontend Technical Details

**Next.js Version**: 15.4.1
**React Version**: 19.1.0
**TypeScript**: v5
**Tailwind CSS**: v4

**Key Dependencies**:
- `@radix-ui/*` - Headless UI components
- `class-variance-authority` - Conditional styling
- `clsx` - Utility for conditional class names
- `date-fns` - Date manipulation
- `lucide-react` - Icon library
- `next-themes` - Dark mode support
- `react-day-picker` - Date picker component
- `sonner` - Toast notifications
- `tailwind-merge` - Tailwind class merging

**Environment Variables**:
- Development API: `http://localhost:3001`
- Production API: Update `API_BASE_URL` in `lib/constants.ts`

### Backend Development
```bash
# Run tests
docker compose exec backend bundle exec rails test

# Run specific test file
docker compose exec backend bundle exec rails test test/controllers/todos_controller_test.rb

# Generate new resources
docker compose exec backend rails generate model ModelName
docker compose exec backend rails generate controller ControllerName

# Database operations
docker compose exec backend bundle exec rails db:drop
docker compose exec backend bundle exec rails db:create
docker compose exec backend bundle exec rails db:migrate
docker compose exec backend bundle exec rails db:seed
docker compose exec backend bundle exec rails db:reset  # drop + create + migrate + seed
```

### Backend Technical Details

**Ruby Version**: 3.2.5
**Rails Version**: 7.1.3+
**Database**: PostgreSQL 15

**Key Gems**:
- `pg` - PostgreSQL adapter
- `puma` - Web server
- `rack-cors` - CORS handling
- `bootsnap` - Boot time optimization

**Database Schema**:
```sql
create_table "todos" do |t|
  t.string "title", null: false
  t.integer "position"
  t.boolean "completed", default: false
  t.date "due_date"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  t.index ["position"], name: "index_todos_on_position"
end
```

**Todo Model Validations**:
- `title` - Required, must be present
- `completed` - Boolean, defaults to false
- `due_date` - Optional, cannot be in the past
- `position` - Auto-assigned on creation for ordering

**API Endpoints**:
- `GET /api/todos` - List all todos
- `POST /api/todos` - Create new todo
- `GET /api/todos/:id` - Get specific todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/update_order` - Bulk update todo positions

## API Structure

The Rails backend provides a Todo API at `/api/todos` with:
- Standard CRUD endpoints (GET, POST, PUT, DELETE)
- Bulk update endpoint: `PATCH /api/todos/update_order` for drag-and-drop reordering
- Todo model attributes: `title`, `completed`, `position`, `due_date`

Frontend should make API calls to `http://localhost:3001/api/todos`.

## Key Implementation Details

1. **CORS Configuration**: Backend is configured to accept requests from `localhost:3000` (frontend)
2. **Database Migrations**: Always run migrations after pulling new changes
3. **Hot Reloading**: Both frontend and backend support hot reloading in development
4. **TypeScript Path Aliases**: Use `@/*` for imports from the `src` directory in frontend
5. **Docker Compose**: Three services (frontend, backend, db) with proper dependency management
6. **Environment Variables**: Database credentials managed via environment variables
7. **API Error Handling**: Consistent error responses with proper HTTP status codes
8. **State Management**: React hooks with optimistic updates for better UX

## Current State

The project has successfully transitioned from Nuxt.js to Next.js. The backend API is fully functional with complete CRUD operations, validation, and drag-and-drop reordering support. The frontend is a Next.js application with a complete todo feature implementation including:

- Todo creation with due dates
- Todo editing and deletion
- Status completion toggle
- Drag-and-drop reordering
- Filtering (all, active, completed)
- Optimistic updates for better UX
- Error handling and validation
- Responsive design with Tailwind CSS
- shadcn/ui components for consistent UI

## Development Guidelines

1. **Package Manager**: Always use pnpm, NOT npm
2. **API Calls**: All API calls must go through the API client (not direct fetch calls)
3. **Commits**: Make frequent, small commits with clear messages. Commit after each logical change or feature addition

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── app/               # Next.js App Router pages (routing files)
├── components/        # 横断的（ドメインに依存しない）なUIコンポーネント
│   └── ui/           # shadcn/ui components
├── features/          # 特定のドメイン・機能に関係するコンポーネント
│   └── todo/         # Todo feature
│       ├── components/   # Todo-specific components
│       ├── hooks/        # Todo-specific hooks
│       ├── types/        # Todo-specific types
│       └── utils/        # Todo-specific utilities
├── hooks/             # ドメインに依存しない、横断的なhooks
├── providers/         # アプリケーションプロバイダー
├── utils/             # 横断的な汎用関数
├── constants/         # 横断的な定数
├── types/             # 横断的な型定義
├── styles/            # スタイリング（css）に関するファイル
├── lib/               # ライブラリの処理や標準処理を共通化したコード
└── tests/             # 自動テスト関連
```

### Naming Conventions

1. **Files and Directories**:
   - Components: PascalCase (e.g., `TodoItem.tsx`, `TodoForm.tsx`)
   - Hooks: camelCase with `use` prefix (e.g., `useTodos.ts`)
   - Utilities: kebab-case (e.g., `api-client.ts`, `constants.ts`)
   - Types: kebab-case (e.g., `todo.ts`)

2. **Code Naming**:
   - React components: PascalCase
   - Functions/variables: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Interfaces: PascalCase with descriptive suffix (e.g., `TodoItemProps`, `CreateTodoData`)

### Key Files

- `lib/api-client.ts` - Base HttpClient with common HTTP methods (GET, POST, PUT, PATCH, DELETE)
- `features/todo/lib/api-client.ts` - Todo-specific API client extending HttpClient
- `features/todo/types/todo.ts` - Todo-related TypeScript interfaces and types
- `lib/constants.ts` - API endpoints and configuration constants
- `lib/utils.ts` - Utility functions (date formatting, validation, etc.)
- `features/todo/hooks/useTodos.ts` - Todo state management with optimistic updates
- `features/todo/components/TodoList.tsx` - Main todo list component with drag-and-drop
- `features/todo/components/TodoItem.tsx` - Individual todo item component
- `features/todo/components/TodoForm.tsx` - Todo creation and editing form
- `features/todo/components/TodoFilters.tsx` - Filter controls (all, active, completed)
- `components/ui/` - Shared UI components (shadcn/ui based)

### Architecture Principles

1. **Feature-based organization**: Domain-specific code lives in `features/[domain]/`
2. **Cross-cutting concerns**: Shared utilities, types, and components live in root-level directories
3. **Separation of concerns**: Each feature has its own components, hooks, types, and utilities
4. **Reusability**: Common UI components and hooks are shared across features
5. **API Client Pattern**: 
   - Base `HttpClient` provides common HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Feature-specific API clients extend `HttpClient` and implement domain-specific methods
   - Hooks use feature API clients for data fetching and state management
6. **Error Handling**: Consistent error handling with `ApiError` class and proper user feedback
7. **Optimistic Updates**: UI updates immediately with rollback on API failure
8. **Type Safety**: Full TypeScript coverage with proper interfaces and type definitions
9. **Component Composition**: Small, focused components that compose well together
10. **State Management**: Local state with React hooks, avoiding external state management libraries

## Docker Environment Variables

The application uses environment variables for configuration:

**Database (compose.yml)**:
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `DATABASE_URL` - Full database connection string
- `RAILS_MASTER_KEY` - Rails master key for encrypted credentials

**Note**: Create a `.env` file in the root directory with these variables for Docker Compose.