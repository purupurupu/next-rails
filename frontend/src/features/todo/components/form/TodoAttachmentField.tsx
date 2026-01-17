"use client";

import { FileUpload } from "@/features/todo/components/FileUpload";
import { AttachmentList } from "@/features/todo/components/AttachmentList";
import type { TodoFile } from "@/features/todo/types/todo";

interface TodoAttachmentFieldProps {
  todoId?: number;
  existingFiles?: TodoFile[];
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onFileDelete?: (fileId: string | number) => void;
  disabled?: boolean;
}

/**
 * Todoの添付ファイルフィールド
 */
export function TodoAttachmentField({
  todoId,
  existingFiles,
  selectedFiles,
  onFilesChange,
  onFileDelete,
  disabled = false,
}: TodoAttachmentFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">添付ファイル</label>
      {todoId && existingFiles && existingFiles.length > 0 && (
        <AttachmentList
          todoId={todoId}
          files={existingFiles}
          onDelete={onFileDelete}
          disabled={disabled}
        />
      )}
      <FileUpload
        onFileSelect={onFilesChange}
        existingFiles={selectedFiles}
        disabled={disabled}
      />
    </div>
  );
}
