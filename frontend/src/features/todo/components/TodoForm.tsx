"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { CreateTodoData, Todo } from "@/features/todo/types/todo";
import { useCategories } from "@/features/category/hooks/useCategories";
import { useTags } from "@/features/tag/hooks/useTags";
import { TagSelector } from "@/features/tag/components/TagSelector";
import { useTodoFormState } from "@/features/todo/hooks/useTodoFormState";
import {
  TodoBasicFields,
  TodoCategoryField,
  TodoDueDateField,
  TodoAttachmentField,
  TodoDetailsSection,
} from "./form";
import { cn } from "@/lib/utils";

interface TodoFormProps {
  mode: "create" | "edit";
  todo?: Todo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTodoData, files?: File[]) => Promise<void>;
  onFileDelete?: (fileId: string | number) => void;
}

export function TodoForm({ mode, todo, open, onOpenChange, onSubmit, onFileDelete }: TodoFormProps) {
  const { categories, fetchCategories } = useCategories(false);
  const { tags, fetchTags } = useTags(false);

  const form = useTodoFormState();
  const { state, isValid } = form;

  // コールバックをrefで安定化
  const fetchCategoriesRef = useRef(fetchCategories);
  const fetchTagsRef = useRef(fetchTags);
  const initializeFromTodoRef = useRef(form.initializeFromTodo);
  useEffect(() => {
    fetchCategoriesRef.current = fetchCategories;
    fetchTagsRef.current = fetchTags;
    initializeFromTodoRef.current = form.initializeFromTodo;
  }, [fetchCategories, fetchTags, form.initializeFromTodo]);

  // フォームが開いたときにカテゴリーとタグを取得し、編集モードなら初期化
  useEffect(() => {
    if (open) {
      fetchCategoriesRef.current();
      fetchTagsRef.current();
      if (mode === "edit" && todo) {
        initializeFromTodoRef.current(todo);
      }
    }
  }, [open, mode, todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    form.setIsSubmitting(true);
    try {
      const data = form.getSubmitData();

      if (state.selectedFiles.length > 0) {
        await onSubmit(data, state.selectedFiles);
      } else {
        await onSubmit(data);
      }

      if (mode === "create") {
        form.resetForm();
      }

      onOpenChange(false);
    } finally {
      form.setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && mode === "create") {
      form.resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md flex flex-col",
          mode === "edit" ? "max-h-[95vh]" : "max-h-[85vh]",
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === "create" ? "タスクを追加" : "タスクを編集"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
            <TodoBasicFields
              title={state.title}
              onTitleChange={form.setTitle}
              description={state.description}
              onDescriptionChange={form.setDescription}
              priority={state.priority}
              onPriorityChange={form.setPriority}
              status={state.status}
              onStatusChange={form.setStatus}
            />

            <TodoCategoryField
              categoryId={state.categoryId}
              onCategoryChange={form.setCategoryId}
              categories={categories}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">タグ（任意）</label>
              <TagSelector
                tags={tags}
                selectedTagIds={state.selectedTagIds}
                onSelectionChange={form.setSelectedTagIds}
                placeholder="タグを選択..."
              />
            </div>

            <TodoDueDateField
              dueDate={state.dueDate}
              onDueDateChange={form.setDueDate}
              showCalendar={state.showCalendar}
              onShowCalendarChange={form.setShowCalendar}
            />

            <TodoAttachmentField
              todoId={todo?.id}
              existingFiles={todo?.files}
              selectedFiles={state.selectedFiles}
              onFilesChange={form.setSelectedFiles}
              onFileDelete={onFileDelete}
              disabled={state.isSubmitting}
            />

            {mode === "edit" && todo && (
              <TodoDetailsSection todoId={todo.id} />
            )}
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={state.isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={state.isSubmitting || !isValid}>
              {state.isSubmitting ? "処理中..." : mode === "create" ? "追加" : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
