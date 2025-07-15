'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isOverdue, isDueToday, isDueSoon } from '@/lib/utils'

import type { Todo } from '@/features/todo/types/todo'

interface TodoItemProps {
  todo: Todo
  onToggleComplete: (id: number) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: number) => void
}

export function TodoItem({ todo, onToggleComplete, onEdit, onDelete }: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(todo.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const getDueDateStatus = () => {
    if (!todo.due_date) return null
    
    if (isOverdue(todo.due_date)) {
      return { variant: 'destructive' as const, label: '期限切れ', icon: Clock }
    }
    
    if (isDueToday(todo.due_date)) {
      return { variant: 'default' as const, label: '今日まで', icon: Calendar }
    }
    
    if (isDueSoon(todo.due_date)) {
      return { variant: 'secondary' as const, label: '期限間近', icon: Calendar }
    }
    
    return { variant: 'outline' as const, label: format(new Date(todo.due_date), 'M/d', { locale: ja }), icon: Calendar }
  }

  const dueDateStatus = getDueDateStatus()

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      todo.completed && "opacity-60",
      isDeleting && "opacity-50 pointer-events-none"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggleComplete(todo.id)}
            className="mt-0.5 flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn(
                "text-sm font-medium break-words",
                todo.completed && "line-through text-muted-foreground"
              )}>
                {todo.title}
              </h3>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(todo)}
                  className="h-8 w-8"
                >
                  <Edit className="h-3 w-3" />
                  <span className="sr-only">編集</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">削除</span>
                </Button>
              </div>
            </div>
            
            {dueDateStatus && (
              <div className="mt-2">
                <Badge variant={dueDateStatus.variant} className="text-xs">
                  <dueDateStatus.icon className="h-3 w-3 mr-1" />
                  {dueDateStatus.label}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}