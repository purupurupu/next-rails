import { TodoList } from "@/features/todo/components/TodoList";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TodoList />
      </div>
    </div>
  );
}
