"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import { CategoryForm } from "./CategoryForm";
import { CategoryList } from "./CategoryList";

export function CategoryManager() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">読み込み中...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">カテゴリー管理</h2>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新規カテゴリー
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="mb-6">
          <CategoryForm
            onSubmit={async (data) => {
              await createCategory(data);
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <CategoryList
        categories={categories}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </Card>
  );
}