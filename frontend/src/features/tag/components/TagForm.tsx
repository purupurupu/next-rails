"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateTagData, UpdateTagData, Tag } from "../types/tag";

const DEFAULT_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
];

interface TagFormProps {
  onSubmit: (data: CreateTagData | UpdateTagData) => Promise<void>;
  onCancel: () => void;
  initialData?: Tag;
  submitLabel?: string;
}

/**
 * タグ作成・編集フォーム
 *
 * @param onSubmit - フォーム送信時のコールバック
 * @param onCancel - キャンセル時のコールバック
 * @param initialData - 編集時の初期データ
 * @param submitLabel - 送信ボタンのラベル
 */
export function TagForm({
  onSubmit,
  onCancel,
  initialData,
  submitLabel = "作成",
}: TagFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [color, setColor] = useState(initialData?.color || DEFAULT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), color });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tag-name">タグ名</Label>
        <Input
          id="tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="タグ名を入力"
          required
          maxLength={30}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag-color">色</Label>
        <div className="flex items-center gap-2">
          <Input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 cursor-pointer"
            disabled={isSubmitting}
          />
          <div className="flex gap-1">
            {DEFAULT_COLORS.map((defaultColor) => (
              <button
                key={defaultColor}
                type="button"
                onClick={() => setColor(defaultColor)}
                className="h-8 w-8 rounded border-2 border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: defaultColor }}
                aria-label={`色 ${defaultColor} を選択`}
                disabled={isSubmitting}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
