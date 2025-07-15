'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import type { CreateTodoData, Todo } from '@/features/todo/types/todo'

interface TodoFormProps {
  mode: 'create' | 'edit'
  todo?: Todo
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoData) => Promise<void>
}

export function TodoForm({ mode, todo, open, onOpenChange, onSubmit }: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title || '')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    todo?.due_date ? new Date(todo.due_date) : undefined
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const data = {
        title: title.trim(),
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      }
      
      await onSubmit(data)
      
      // Reset form for create mode
      if (mode === 'create') {
        setTitle('')
        setDueDate(undefined)
      }
      
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && mode === 'create') {
      setTitle('')
      setDueDate(undefined)
    }
    onOpenChange(newOpen)
  }

  const clearDueDate = () => {
    setDueDate(undefined)
    setShowCalendar(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'タスクを追加' : 'タスクを編集'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              タスク名
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスクを入力してください"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">期限日</label>
            <div className="space-y-2">
              {dueDate ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(dueDate, 'yyyy年M月d日', { locale: ja })}
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
              ) : null}
              
              <Select
                value={showCalendar ? 'custom' : ''}
                onValueChange={(value) => {
                  if (value === 'today') {
                    setDueDate(new Date())
                  } else if (value === 'tomorrow') {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    setDueDate(tomorrow)
                  } else if (value === 'week') {
                    const nextWeek = new Date()
                    nextWeek.setDate(nextWeek.getDate() + 7)
                    setDueDate(nextWeek)
                  } else if (value === 'custom') {
                    setShowCalendar(true)
                  }
                }}
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
                      setDueDate(date)
                      setShowCalendar(false)
                    }}
                    disabled={(date) => date < new Date()}
                    className="mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? '処理中...' : mode === 'create' ? '追加' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}