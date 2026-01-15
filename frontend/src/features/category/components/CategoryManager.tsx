"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryForm } from "./CategoryForm";
import { useCategories } from "../hooks/useCategories";
import type { Category, CreateCategoryData, UpdateCategoryData } from "../types/category";

/**
 * カテゴリー管理コンポーネント
 *
 * @remarks
 * カテゴリーの一覧表示、作成、編集、削除を管理する
 */
export function CategoryManager() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory }
    = useCategories();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleCreate = async (data: CreateCategoryData | UpdateCategoryData) => {
    await createCategory(data as CreateCategoryData);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (data: CreateCategoryData | UpdateCategoryData) => {
    if (!editingCategory) return;
    await updateCategory(editingCategory.id, data as UpdateCategoryData);
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    await deleteCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">カテゴリー</h2>
        </div>
        <div className="text-center text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">カテゴリー</h2>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規カテゴリー
        </Button>
      </div>

      <div className="space-y-2">
        {categories.length === 0
          ? (
              <p className="text-sm text-muted-foreground">
                カテゴリーがありません。最初のカテゴリーを作成しましょう！
              </p>
            )
          : (
              <div className="grid gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-6 w-6 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.todo_count}
                          {" "}
                          個のタスク
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>

      {/* 作成ダイアログ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規カテゴリー作成</DialogTitle>
            <DialogDescription>
              Todoを整理するための新しいカテゴリーを追加します。
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリーを編集</DialogTitle>
            <DialogDescription>
              カテゴリー名または色を更新します。
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdate}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリーを削除</AlertDialogTitle>
            <AlertDialogDescription>
              カテゴリー「
              {deletingCategory?.name}
              」を削除してもよろしいですか？関連するTodoからカテゴリーが外されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
