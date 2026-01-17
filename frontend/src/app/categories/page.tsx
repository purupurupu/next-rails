import { Navigation } from "@/components/navigation";
import { CategoryManager } from "@/features/category/components/CategoryManager";
import { fetchCategories } from "@/features/todo/lib/server-fetcher";

/**
 * Categories page - async Server Component
 *
 * Fetches initial data on server for SSR.
 * Authentication is handled by middleware, so ProtectedRoute is no longer needed.
 */
export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <CategoryManager initialCategories={categories} />
      </div>
    </div>
  );
}
