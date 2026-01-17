"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TodoPriority, TodoStatus } from "@/features/todo/types/todo";

interface TodoBasicFieldsProps {
  title: string;
  onTitleChange: (title: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  priority: TodoPriority;
  onPriorityChange: (priority: TodoPriority) => void;
  status: TodoStatus;
  onStatusChange: (status: TodoStatus) => void;
}

/**
 * Todoの基本フィールド（タイトル、説明、優先度、ステータス）
 */
export function TodoBasicFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
}: TodoBasicFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          タスク名
          {" "}
          <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="タスクを入力してください"
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">優先度</label>
        <Select value={priority} onValueChange={(value: TodoPriority) => onPriorityChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="優先度を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">低</SelectItem>
            <SelectItem value="medium">中</SelectItem>
            <SelectItem value="high">高</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">ステータス</label>
        <Select value={status} onValueChange={(value: TodoStatus) => onStatusChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="ステータスを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">未着手</SelectItem>
            <SelectItem value="in_progress">進行中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          説明（任意）
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="タスクの詳細説明を入力してください"
          rows={3}
        />
      </div>
    </>
  );
}
