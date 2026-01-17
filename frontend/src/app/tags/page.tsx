import { Navigation } from "@/components/navigation";
import { TagManager } from "@/features/tag/components/TagManager";
import { fetchTags } from "@/features/todo/lib/server-fetcher";

/**
 * Tags page - async Server Component
 *
 * Fetches initial data on server for SSR.
 * Authentication is handled by middleware, so ProtectedRoute is no longer needed.
 */
export default async function TagsPage() {
  const tags = await fetchTags();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TagManager initialTags={tags} />
      </div>
    </div>
  );
}
