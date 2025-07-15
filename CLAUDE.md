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
docker compose exec frontend pnpm run dev      # Development server
docker compose exec frontend pnpm run build    # Production build
docker compose exec frontend pnpm run lint     # ESLint
```

### Backend Development
```bash
# Run tests
docker compose exec backend bundle exec rails test

# Run specific test file
docker compose exec backend bundle exec rails test test/controllers/todos_controller_test.rb

# Generate new resources
docker compose exec backend rails generate model ModelName
docker compose exec backend rails generate controller ControllerName
```

## API Structure

The Rails backend provides a Todo API at `/api/todos` with:
- Standard CRUD endpoints (GET, POST, PUT, DELETE)
- Bulk update endpoint: `PATCH /api/todos/update_order` for drag-and-drop reordering
- Todo model attributes: `title`, `completed`, `position`, `due_date`

Frontend should make API calls to `http://localhost:3001/api/todos`.

## Key Implementation Details

1. **CORS Configuration**: Backend is configured to accept requests from the frontend container
2. **Database Migrations**: Always run migrations after pulling new changes
3. **Hot Reloading**: Both frontend and backend support hot reloading in development
4. **TypeScript Path Aliases**: Use `@/*` for imports from the `src` directory in frontend

## Current State

The project is transitioning from Nuxt.js to Next.js. The backend API is fully functional, while the frontend is a fresh Next.js installation ready for implementation.

## Development Guidelines

1. **Package Manager**: Always use pnpm, NOT npm
2. **API Calls**: All API calls must go through the API client (not direct fetch calls)
3. **Commits**: Make frequent, small commits with clear messages. Commit after each logical change or feature addition

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── app/               # Next.js App Router pages
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── features/     # Feature-specific components
│   │   └── todo/     # Todo feature components
│   └── layouts/      # Layout components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
├── types/            # TypeScript type definitions
└── styles/           # Additional styles
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

- `types/todo.ts` - Todo-related TypeScript interfaces
- `lib/api-client.ts` - API communication layer with error handling
- `lib/constants.ts` - App-wide constants and configurations
- `lib/utils.ts` - Utility functions (date formatting, validation, etc.)
- `hooks/useTodos.ts` - Todo state management with optimistic updates