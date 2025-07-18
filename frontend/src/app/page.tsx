import { TodoList } from "@/features/todo/components/TodoList";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <TodoList />
        </div>
      </ProtectedRoute>
    </div>
  );
}
