import { TodoListWithSearch } from "@/features/todo/components/TodoListWithSearch";
import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { fetchInitialTodoData } from "@/features/todo/lib/server-fetcher";

/**
 * Home page - async Server Component
 *
 * Fetches initial data on server for SSR, improving First Contentful Paint.
 * Authentication is handled by middleware, so ProtectedRoute is no longer needed.
 */
export default async function Home() {
  // Server-side data fetching for SSR
  const initialData = await fetchInitialTodoData();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorBoundary>
          <TodoListWithSearch
            initialTodos={initialData.todos}
            initialCategories={initialData.categories}
            initialTags={initialData.tags}
            initialSearchResponse={initialData.searchResponse}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
