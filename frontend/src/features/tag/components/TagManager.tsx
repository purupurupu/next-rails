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
import { TagForm } from "./TagForm";
import { TagBadge } from "./TagBadge";
import { useTags } from "../hooks/useTags";
import type { Tag, CreateTagData, UpdateTagData } from "../types/tag";

/**
 * タグ管理コンポーネント
 *
 * @remarks
 * タグの一覧表示、作成、編集、削除を管理する
 */
export function TagManager() {
  const { tags, createTag, updateTag, deleteTag } = useTags();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  const handleCreate = async (data: CreateTagData | UpdateTagData) => {
    await createTag(data as CreateTagData);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (data: CreateTagData | UpdateTagData) => {
    if (!editingTag) return;
    await updateTag(editingTag.id, data as UpdateTagData);
    setEditingTag(null);
  };

  const handleDelete = async () => {
    if (!deletingTag) return;
    await deleteTag(deletingTag.id);
    setDeletingTag(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">タグ</h2>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規タグ
        </Button>
      </div>

      <div className="space-y-2">
        {tags.length === 0
          ? (
              <p className="text-sm text-muted-foreground">
                タグがありません。最初のタグを作成しましょう！
              </p>
            )
          : (
              <div className="grid gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <TagBadge name={tag.name} color={tag.color} />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingTag(tag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingTag(tag)}
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
            <DialogTitle>新規タグ作成</DialogTitle>
            <DialogDescription>
              Todoを整理するための新しいタグを追加します。
            </DialogDescription>
          </DialogHeader>
          <TagForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>タグを編集</DialogTitle>
            <DialogDescription>タグ名または色を更新します。</DialogDescription>
          </DialogHeader>
          {editingTag && (
            <TagForm
              initialData={editingTag}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTag(null)}
              submitLabel="更新"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog
        open={!!deletingTag}
        onOpenChange={() => setDeletingTag(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タグを削除</AlertDialogTitle>
            <AlertDialogDescription>
              タグ「
              {deletingTag?.name}
              」を削除してもよろしいですか？このタグはすべてのTodoから削除されます。
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
