"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TodoDueDateFieldProps {
  dueDate: Date | undefined;
  onDueDateChange: (date: Date | undefined) => void;
  showCalendar: boolean;
  onShowCalendarChange: (show: boolean) => void;
}

/**
 * Todoの期限日選択フィールド
 */
export function TodoDueDateField({
  dueDate,
  onDueDateChange,
  showCalendar,
  onShowCalendarChange,
}: TodoDueDateFieldProps) {
  const handleQuickSelect = (value: string) => {
    if (value === "today") {
      onDueDateChange(new Date());
    } else if (value === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      onDueDateChange(tomorrow);
    } else if (value === "week") {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      onDueDateChange(nextWeek);
    } else if (value === "custom") {
      onShowCalendarChange(true);
    }
  };

  const clearDueDate = () => {
    onDueDateChange(undefined);
    onShowCalendarChange(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">期限日</label>
      <div className="space-y-2">
        {dueDate
          ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(dueDate, "yyyy年M月d日", { locale: ja })}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearDueDate}
                >
                  クリア
                </Button>
              </div>
            )
          : null}

        <Select
          value={showCalendar ? "custom" : ""}
          onValueChange={handleQuickSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="期限日を設定" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今日</SelectItem>
            <SelectItem value="tomorrow">明日</SelectItem>
            <SelectItem value="week">1週間後</SelectItem>
            <SelectItem value="custom">日付を選択</SelectItem>
          </SelectContent>
        </Select>

        {showCalendar && (
          <div className="border rounded-md p-3">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                onDueDateChange(date);
                onShowCalendarChange(false);
              }}
              disabled={(date) => date < new Date()}
              className="mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
