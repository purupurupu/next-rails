import { Navigation } from "@/components/navigation";
import { TagManager } from "@/features/tag/components/TagManager";

/**
 * Tags page
 *
 * Authentication is handled by middleware, so ProtectedRoute is no longer needed.
 */
export default function TagsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TagManager />
      </div>
    </div>
  );
}
