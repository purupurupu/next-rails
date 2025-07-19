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
│   └── todo/            # Todo feature
│       ├── components/   # Todo-specific components
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   ├── TodoForm.tsx
│       │   └── TodoFilters.tsx
│       ├── hooks/       # Todo-specific hooks
│       │   └── useTodos.ts
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
└── types/               # Shared types
```

## Key Architecture Patterns

### 1. Feature-Based Organization
Domain-specific code is organized under `features/[domain]/` with its own:
- Components
- Hooks
- Types
- API clients
- Utilities

### 2. API Client Pattern
```typescript
// Base HTTP Client (lib/api-client.ts)
class HttpClient {
  async get<T>(url: string): Promise<T>
  async post<T>(url: string, data: unknown): Promise<T>
  async put<T>(url: string, data: unknown): Promise<T>
  async patch<T>(url: string, data: unknown): Promise<T>
  async delete<T>(url: string): Promise<T>
}

// Feature-specific client extends base
class TodoApiClient extends HttpClient {
  async getTodos(): Promise<Todo[]>
  async createTodo(data: CreateTodoData): Promise<Todo>
  // ...
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

### 5. Optimistic Updates
Todo operations update UI immediately, with rollback on API failure:
```typescript
// 1. Update local state optimistically
setTodos(prev => [...prev, newTodo])
// 2. Make API call
try {
  await api.createTodo(newTodo)
} catch (error) {
  // 3. Rollback on failure
  setTodos(prev => prev.filter(t => t.id !== newTodo.id))
}
```

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
- **Todos**: Feature-level hook (`useTodos`)
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