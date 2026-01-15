import { Navigation } from "@/components/navigation";
import { CategoryManager } from "@/features/category/components/CategoryManager";

/**
 * Categories page
 *
 * Authentication is handled by middleware, so ProtectedRoute is no longer needed.
 */
export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <CategoryManager />
      </div>
    </div>
  );
}
