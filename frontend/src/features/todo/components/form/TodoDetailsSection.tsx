"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentList } from "@/features/comment/components/CommentList";
import { HistoryList } from "@/features/history/components/HistoryList";

interface TodoDetailsSectionProps {
  todoId: number;
}

/**
 * Todoのコメントと履歴を表示するセクション（編集モード専用）
 */
export function TodoDetailsSection({ todoId }: TodoDetailsSectionProps) {
  return (
    <div className="mt-6">
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comments">コメント</TabsTrigger>
          <TabsTrigger value="history">変更履歴</TabsTrigger>
        </TabsList>
        <TabsContent value="comments" className="mt-4">
          <CommentList todoId={todoId} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryList todoId={todoId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
