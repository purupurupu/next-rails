"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/features/category/types/category";

interface TodoCategoryFieldProps {
  categoryId: number | undefined;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: Category[];
}

/**
 * Todoのカテゴリー選択フィールド
 */
export function TodoCategoryField({
  categoryId,
  onCategoryChange,
  categories,
}: TodoCategoryFieldProps) {
  // カテゴリをMapで索引化してO(1)ルックアップ
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const selectedCategory = categoryId ? categoryMap.get(categoryId) : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">カテゴリー（任意）</label>
      <Select
        value={categoryId?.toString() || "none"}
        onValueChange={(value) => onCategoryChange(value === "none" ? undefined : parseInt(value))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="カテゴリーを選択">
            {selectedCategory
              ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: selectedCategory.color }}
                    />
                    {selectedCategory.name}
                  </div>
                )
              : (
                  "カテゴリーなし"
                )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">カテゴリーなし</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
