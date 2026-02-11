"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useSearchParams } from "../hooks/useSearchParams";
import { useTodoListData } from "../hooks/useTodoListData";
import { todoApiClient } from "../lib/api-client";

import { TodoItem } from "./TodoItem";
import { SearchBar } from "./SearchBar";
import { FilterBadges } from "./FilterBadges";

// モーダル内で使用されるため遅延ロード (bundle-dynamic-imports)
const TodoForm = dynamic(
  () => import("./TodoForm").then((m) => m.TodoForm),
  { ssr: false },
);

// Collapsible内で使用されるため遅延ロード (bundle-dynamic-imports)
const AdvancedFilters = dynamic(
  () => import("./AdvancedFilters").then((m) => m.AdvancedFilters),
  { ssr: false },
);

import type { Todo, CreateTodoData, UpdateTodoData, TodoSearchResponse } from "../types/todo";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/tag/types/tag";

/**
 * Props for TodoListWithSearch
 * initialData can be provided from Server Component for SSR
 */
interface TodoListWithSearchProps {
  initialTodos?: Todo[];
  initialCategories?: Category[];
  initialTags?: Tag[];
  initialSearchResponse?: TodoSearchResponse | null;
}

export function TodoListWithSearch({
  initialTodos,
  initialCategories,
  initialTags,
  initialSearchResponse,
}: TodoListWithSearchProps = {}) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Search params management
  const {
    searchParams,
    activeFilters,
    hasActiveFilters,
    updateSearchQuery,
    updateCategory,
    updateStatus,
    updatePriority,
    updateTags,
    updateDateRange,
    updateSort,
    updatePage,
    clearFilters,
    clearSingleFilter,
  } = useSearchParams();

  // 並列データフェッチ (async-parallel ルール適用)
  // useTodoSearch, useCategories, useTags を統合し、
  // Promise.all() で並列実行することでWaterfallsを解消
  // SSR時はinitialDataを使用してFirst Contentful Paintを高速化
  const {
    todos,
    loading,
    error,
    searchResponse,
    categories,
    tags,
    refresh,
    mutateOptimistic,
  } = useTodoListData(searchParams, {
    initialTodos,
    initialCategories,
    initialTags,
    initialSearchResponse,
  });

  // ハンドラー関数: mutateOptimistic でUI即時更新 → API → refresh で再検証
  const handleCreateTodo = useCallback(async (
    data: CreateTodoData,
    files?: File[],
  ) => {
    try {
      const created = await todoApiClient.createTodo(data, files);
      await mutateOptimistic((prev) => [...prev, created]);
      toast.success("タスクを作成しました");
    } catch {
      toast.error("タスクの作成に失敗しました");
    }
    await refresh();
  }, [mutateOptimistic, refresh]);

  const handleUpdateTodo = useCallback(async (
    data: UpdateTodoData,
    files?: File[],
  ) => {
    if (!editingTodo) return;
    const id = editingTodo.id;
    setEditingTodo(null);
    await mutateOptimistic((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    );
    try {
      await todoApiClient.updateTodo(id, data, files);
      toast.success("タスクを更新しました");
    } catch {
      toast.error("タスクの更新に失敗しました");
    }
    await refresh();
  }, [editingTodo, mutateOptimistic, refresh]);

  const handleDeleteTodo = useCallback(async (id: number) => {
    await mutateOptimistic((prev) => prev.filter((t) => t.id !== id));
    try {
      await todoApiClient.deleteTodo(id);
      toast.success("タスクを削除しました");
    } catch {
      toast.error("タスクの削除に失敗しました");
    }
    await refresh();
  }, [mutateOptimistic, refresh]);

  const handleToggleComplete = useCallback(async (id: number) => {
    await mutateOptimistic((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    try {
      await todoApiClient.updateTodo(id, { completed: !todo.completed });
      toast.success("タスクを更新しました");
    } catch {
      toast.error("タスクの更新に失敗しました");
    }
    await refresh();
  }, [todos, mutateOptimistic, refresh]);

  const handleDeleteFile = useCallback(async (
    todoId: number,
    fileId: string | number,
  ) => {
    await mutateOptimistic((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, files: t.files.filter((f) => f.id !== fileId) }
          : t,
      ),
    );
    try {
      await todoApiClient.deleteTodoFile(todoId, fileId);
      toast.success("ファイルを削除しました");
    } catch {
      toast.error("ファイルの削除に失敗しました");
    }
    await refresh();
  }, [mutateOptimistic, refresh]);

  if (loading && !todos.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">TODO</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            タスクを追加
          </Button>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">TODO</h1>
        <Button onClick={() => setIsCreateFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          タスクを追加
        </Button>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchParams.q || ""}
          onChange={updateSearchQuery}
          placeholder="タイトルや説明で検索..."
        />

        <AdvancedFilters
          searchParams={searchParams}
          categories={categories || []}
          tags={tags || []}
          onUpdateCategory={updateCategory}
          onUpdateStatus={updateStatus}
          onUpdatePriority={updatePriority}
          onUpdateTags={updateTags}
          onUpdateDateRange={updateDateRange}
          onUpdateSort={updateSort}
        />

        {hasActiveFilters && (
          <FilterBadges
            activeFilters={activeFilters}
            categories={categories || []}
            tags={tags || []}
            onRemoveFilter={clearSingleFilter}
            onClearAll={clearFilters}
          />
        )}
      </div>

      <Separator />

      {/* Results Summary */}
      {searchResponse && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {searchResponse.meta.total}
            {" "}
            件の結果
            {searchResponse.meta.total_pages > 1 && ` (${searchResponse.meta.current_page}/${searchResponse.meta.total_pages} ページ)`}
          </span>
          {loading && <span>更新中...</span>}
        </div>
      )}

      {/* Todo List */}
      {todos.length === 0
        ? (
            <div role="status" aria-live="polite" className="text-center py-12 text-muted-foreground">
              {hasActiveFilters
                ? (
                    <div className="space-y-4">
                      <p>条件に一致するタスクが見つかりませんでした</p>
                      {searchResponse?.suggestions && searchResponse.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">提案:</p>
                          {searchResponse.suggestions.slice(0, 3).map((suggestion, index) => (
                            <p key={index} className="text-sm">{suggestion.message}</p>
                          ))}
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        フィルターをクリア
                      </Button>
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      <p>まだタスクがありません</p>
                      <p className="text-sm">「タスクを追加」ボタンから新しいタスクを作成しましょう</p>
                    </div>
                  )}
            </div>
          )
        : (
            <ul role="list" aria-label="タスク一覧" className="space-y-3 list-none p-0 m-0">
              {todos.map((todo) => (
                <li key={todo.id} role="listitem">
                  <TodoItem
                    todo={todo}
                    onToggleComplete={handleToggleComplete}
                    onEdit={setEditingTodo}
                    onDelete={handleDeleteTodo}
                  />
                </li>
              ))}
            </ul>
          )}

      {/* Pagination */}
      {searchResponse && searchResponse.meta.total_pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={searchResponse.meta.current_page === 1}
            onClick={() => updatePage(searchResponse.meta.current_page - 1)}
          >
            前のページ
          </Button>
          <span className="flex items-center px-3 text-sm">
            {searchResponse.meta.current_page}
            {" "}
            /
            {searchResponse.meta.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={searchResponse.meta.current_page === searchResponse.meta.total_pages}
            onClick={() => updatePage(searchResponse.meta.current_page + 1)}
          >
            次のページ
          </Button>
        </div>
      )}

      {/* Forms */}
      {isCreateFormOpen && (
        <TodoForm
          mode="create"
          open={isCreateFormOpen}
          onOpenChange={setIsCreateFormOpen}
          onSubmit={handleCreateTodo}
        />
      )}

      {editingTodo && (
        <TodoForm
          mode="edit"
          todo={editingTodo}
          open={!!editingTodo}
          onOpenChange={(open) => !open && setEditingTodo(null)}
          onSubmit={handleUpdateTodo}
          onFileDelete={(fileId) => handleDeleteFile(editingTodo.id, fileId)}
        />
      )}
    </div>
  );
}
