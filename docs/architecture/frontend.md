# Frontend Architecture

## Technology Stack

- **Framework**: Next.js 15.4.1 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui (Radix UI based)
- **Package Manager**: pnpm
- **State Management**: React Hooks (no external state library)

## Directory Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   └── page.tsx       # Login/Register page
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main todo page (protected)
├── components/            # Cross-cutting UI components
│   ├── auth/             # Authentication components
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── layouts/          # Layout components
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Navigation bar
│   └── protected-route.tsx # Route protection HOC
├── contexts/             # React contexts
│   └── auth-context.tsx  # Global auth state
├── features/             # Feature-based modules
│   ├── category/        # Category feature (NEW)
│   │   ├── components/   # Category management components
│   │   │   ├── CategoryManager.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryList.tsx
│   │   ├── hooks/       # Category hooks
│   │   │   └── useCategories.ts
│   │   ├── lib/         # Category API client
│   │   │   └── api-client.ts
│   │   └── types/       # Category types
│   │       └── category.ts
│   ├── comment/         # Comment feature (NEW)
│   │   ├── components/   # Comment components
│   │   │   ├── CommentForm.tsx
│   │   │   ├── CommentItem.tsx
│   │   │   └── CommentList.tsx
│   │   ├── hooks/       # Comment hooks
│   │   │   └── useComments.ts
│   │   ├── lib/         # Comment API client
│   │   │   └── api-client.ts
│   │   └── types/       # Comment types
│   │       └── comment.ts
│   ├── history/         # History tracking feature (NEW)
│   │   ├── components/   # History components
│   │   │   ├── HistoryItem.tsx
│   │   │   └── HistoryList.tsx
│   │   ├── hooks/       # History hooks
│   │   │   └── useHistory.ts
│   │   ├── lib/         # History API client
│   │   │   └── api-client.ts
│   │   └── types/       # History types
│   │       └── history.ts
│   └── todo/            # Todo feature
│       ├── components/   # Todo-specific components
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   ├── TodoForm.tsx       # Now includes comment/history tabs
│       │   └── TodoFilters.tsx
│       ├── hooks/       # Todo hooks (SWR-based)
│       │   ├── useTodoListData.ts       # SWR並列フェッチ + Optimistic update
│       │   ├── useTodos.ts              # Legacy main hook
│       │   ├── useTodoMutations.ts      # CRUD operations (TodoList用)
│       │   ├── useSearchParams.ts       # 検索パラメータ管理
│       │   ├── useTodoFormState.ts      # フォーム状態管理
│       │   └── todo-optimistic-utils.ts # Optimistic update utilities
│       ├── lib/         # Todo API client
│       │   └── api-client.ts
│       └── types/       # Todo types
│           └── todo.ts
├── hooks/               # Shared hooks
├── lib/                 # Core libraries
│   ├── api-client.ts    # Base HTTP client
│   ├── auth-client.ts   # Auth API client
│   ├── constants.ts     # Configuration
│   └── utils.ts         # Utilities
├── styles/              # Global styles
└── types/               # Shared types (NEW ARCHITECTURE)
    ├── common.ts        # Base entities and utilities
    └── auth.ts          # Authentication types
```

## Key Architecture Patterns

### 1. Feature-Based Organization
Domain-specific code is organized under `features/[domain]/` with its own:
- Components
- Hooks
- Types
- API clients
- Utilities

### 2. API Client Pattern (UNIFIED)
```typescript
// Base HTTP Client (lib/api-client.ts)
class HttpClient {
  private baseUrl: string;
  private getAuthToken(): string | null;
  private getAuthHeaders(): Record<string, string>;
  
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data?: unknown): Promise<T>
  async put<T>(endpoint: string, data?: unknown): Promise<T>
  async patch<T>(endpoint: string, data?: unknown): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}

// Feature-specific clients extend base (CONSISTENT)
class TodoApiClient extends HttpClient {
  async getTodos(): Promise<Todo[]>
  async createTodo(data: CreateTodoData): Promise<Todo>
  async updateTodoOrder(todos: UpdateOrderData[]): Promise<void>
  // ...
}

class CategoryApiClient extends HttpClient {
  async getCategories(): Promise<Category[]>
  async createCategory(data: CreateCategoryData): Promise<Category>
  // ...
}

class CommentApiClient extends HttpClient {
  async getComments(todoId: number): Promise<Comment[]>
  async createComment(todoId: number, data: CreateCommentData): Promise<Comment>
  async updateComment(todoId: number, commentId: number, data: UpdateCommentData): Promise<Comment>
  async deleteComment(todoId: number, commentId: number): Promise<void>
}

class TodoHistoryApiClient extends HttpClient {
  async getHistory(todoId: number): Promise<TodoHistory[]>
}
```

### 3. Authentication Flow
```typescript
// Authentication Context provides:
- user: User | null
- isAuthenticated: boolean
- isLoading: boolean
- login(credentials): Promise<void>
- register(userData): Promise<void>
- logout(): Promise<void>
```

### 4. Protected Routes
Routes requiring authentication are wrapped with `ProtectedRoute` component that:
- Checks authentication state
- Redirects to login if needed
- Shows loading state during auth check

### 5. Type System Architecture (NEW)
```typescript
// Base entity patterns (types/common.ts)
interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Generic utilities
type CreateData<T> = Omit<T, keyof BaseEntity>;
type UpdateData<T> = Partial<Omit<T, keyof EntityWithId>>;

// Domain types extend base
interface Todo extends BaseEntity {
  title: string;
  completed: boolean;
  category: TodoCategoryRef | null;
  comments_count: number;
  latest_comments: unknown[];
  history_count: number;
  // ...
}

interface Category extends BaseEntity {
  name: string;
  color: string;
  todo_count: number;
}
```

### 6. Hooks Architecture (SWR-based)
**SWRベースの並列データフェッチ + Optimistic Update**

```typescript
// TodoListWithSearch で使用するhook構成
useTodoListData.ts          # SWRベースの並列データフェッチ（todos, categories, tags）
├── useSearchParams.ts      # 検索パラメータ管理
├── useTodoFormState.ts     # フォーム状態管理
└── useTodoMutations.ts     # CRUD操作（TodoList用、レガシー）

// メインhook（TodoListWithSearchで使用）
export function useTodoListData(searchParams, options?) {
  // SWRで categories, tags, todos を独立して並列フェッチ
  // SSR初期データを fallbackData で受け取り
  return {
    todos, searchResponse, categories, tags,
    loading, error, refresh, mutateOptimistic,
  };
}
```

### 7. Optimistic Updates (SWR Cache-based)
`TodoListWithSearch`では SWR キャッシュを直接操作する Optimistic Update パターンを採用:

```typescript
// useTodoListData が公開する mutateOptimistic
const mutateOptimistic = async (updater: (current: Todo[]) => Todo[]) => {
  await mutateSearch((current) => {
    const base = current ?? searchDataRef.current; // fallbackData対応
    const newTodos = updater(base.todos);
    return { todos: newTodos, searchResponse: { ...base.searchResponse, data: newTodos } };
  }, { revalidate: false });
};

// TodoListWithSearch での使用パターン
// 1. mutateOptimistic() でUIを即時更新
// 2. todoApiClient.xxx() でAPI呼び出し
// 3. refresh() でサーバーから最新データ再取得
const handleDeleteTodo = async (id: number) => {
  await mutateOptimistic((prev) => prev.filter((t) => t.id !== id));
  try { await todoApiClient.deleteTodo(id); }
  catch { toast.error("削除に失敗しました"); }
  await refresh();
};
```

**注意: SWR `fallbackData` の挙動**
- `fallbackData` は SWR キャッシュに格納されない（表示用フォールバックのみ）
- `mutate(updaterFn)` の `current` 引数は `undefined` になりうるため、`useRef` で最新値を保持する必要がある

## Component Architecture

### Component Hierarchy
```
App Layout
├── AuthProvider
│   ├── Navigation
│   └── ProtectedRoute
│       └── TodoPage
│           ├── TodoForm
│           ├── TodoFilters
│           └── TodoList
│               └── TodoItem[]
```

### Component Principles
1. **Single Responsibility**: Each component has one clear purpose
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: Well-defined TypeScript interfaces
4. **Controlled Components**: Form inputs managed by React state

## State Management

### Local State Strategy
- **Authentication**: Global context (`AuthContext`)
- **Todos**: SWRキャッシュ (`useTodoListData`) — SSR初期データを `fallbackData` で受け取り、クライアントで SWR が管理
- **Categories/Tags**: 独立した SWR キャッシュ（`useTodoListData` 内で並列フェッチ）
- **UI State**: Component-level `useState`
- **Form State**: Controlled components with local state

### Data Flow
```
API Response → Custom Hook → Component State → UI
     ↑                                          ↓
     └──────────── User Action ←────────────────┘
```

## Performance Optimizations

1. **Code Splitting**: Automatic via Next.js App Router
2. **Image Optimization**: Next.js Image component
3. **Bundle Size**: Tree-shaking with ES modules
4. **Caching**: HTTP client implements request caching
5. **Memoization**: React.memo for expensive components

## Error Handling

### API Errors
```typescript
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  )
}
```

### Error Boundaries
- Page-level error boundaries in App Router
- Fallback UI for error states
- Toast notifications for user feedback

## Testing Strategy

1. **Unit Tests**: Component logic and utilities
2. **Integration Tests**: API client and hooks
3. **E2E Tests**: Critical user flows
4. **Type Safety**: TypeScript for compile-time checks