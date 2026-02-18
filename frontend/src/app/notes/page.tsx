import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotesWorkspace } from "@/features/notes/components/NotesWorkspace";

/**
 * Notes page
 *
 * Authentication is handled by middleware, so ProtectedRoute is no longer needed.
 */
export default function NotesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ErrorBoundary>
          <NotesWorkspace />
        </ErrorBoundary>
      </div>
    </div>
  );
}
