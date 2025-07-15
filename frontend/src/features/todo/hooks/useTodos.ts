import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { todoApiClient, ApiError } from '@/features/todo/lib/api-client'
import { generateOptimisticId } from '@/lib/utils'
import type { 
  Todo, 
  CreateTodoData, 
  UpdateTodoData, 
  UpdateOrderData, 
  TodoFilter 
} from '@/features/todo/types/todo'
import { TODO_FILTERS } from '@/lib/constants'

interface UseTodosState {
  todos: Todo[]
  loading: boolean
  error: string | null
  filter: TodoFilter
}

interface UseTodosActions {
  createTodo: (data: CreateTodoData) => Promise<void>
  updateTodo: (id: number, data: UpdateTodoData) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
  updateTodoOrder: (todos: UpdateOrderData[]) => Promise<void>
  toggleTodoComplete: (id: number) => Promise<void>
  setFilter: (filter: TodoFilter) => void
  refreshTodos: () => Promise<void>
}

export function useTodos(): UseTodosState & UseTodosActions {
  const [state, setState] = useState<UseTodosState>({
    todos: [],
    loading: false,
    error: null,
    filter: TODO_FILTERS.ALL,
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setTodos = useCallback((todos: Todo[]) => {
    setState(prev => ({ ...prev, todos }))
  }, [])

  const setFilter = useCallback((filter: TodoFilter) => {
    setState(prev => ({ ...prev, filter }))
  }, [])

  const refreshTodos = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const todos = await todoApiClient.getTodos()
      setTodos(todos)
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error('タスクの読み込みに失敗しました', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setTodos])

  const createTodo = useCallback(async (data: CreateTodoData) => {
    setError(null)
    
    // Optimistic update
    const optimisticTodo: Todo = {
      id: generateOptimisticId(),
      title: data.title,
      completed: false,
      position: state.todos.length + 1,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    setTodos([...state.todos, optimisticTodo])
    
    try {
      const createdTodo = await todoApiClient.createTodo(data)
      setTodos(prev => 
        prev.map(todo => 
          todo.id === optimisticTodo.id ? createdTodo : todo
        )
      )
      toast.success('タスクを作成しました')
    } catch (error) {
      // Revert optimistic update
      setTodos(prev => 
        prev.filter(todo => todo.id !== optimisticTodo.id)
      )
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to create todo'
      setError(errorMessage)
      toast.error('タスクの作成に失敗しました', {
        description: errorMessage
      })
    }
  }, [state.todos, setTodos, setError])

  const updateTodo = useCallback(async (id: number, data: UpdateTodoData) => {
    setError(null)
    
    // Optimistic update
    const originalTodos = state.todos
    const updatedTodos = state.todos.map(todo =>
      todo.id === id ? { ...todo, ...data } : todo
    )
    setTodos(updatedTodos)
    
    try {
      const updatedTodo = await todoApiClient.updateTodo(id, data)
      setTodos(prev => 
        prev.map(todo => 
          todo.id === id ? updatedTodo : todo
        )
      )
      toast.success('タスクを更新しました')
    } catch (error) {
      // Revert optimistic update
      setTodos(originalTodos)
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to update todo'
      setError(errorMessage)
      toast.error('タスクの更新に失敗しました', {
        description: errorMessage
      })
    }
  }, [state.todos, setTodos, setError])

  const deleteTodo = useCallback(async (id: number) => {
    setError(null)
    
    // Optimistic update
    const originalTodos = state.todos
    const filteredTodos = state.todos.filter(todo => todo.id !== id)
    setTodos(filteredTodos)
    
    try {
      await todoApiClient.deleteTodo(id)
      toast.success('タスクを削除しました')
    } catch (error) {
      // Revert optimistic update
      setTodos(originalTodos)
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to delete todo'
      setError(errorMessage)
      toast.error('タスクの削除に失敗しました', {
        description: errorMessage
      })
    }
  }, [state.todos, setTodos, setError])

  const updateTodoOrder = useCallback(async (reorderedTodos: UpdateOrderData[]) => {
    setError(null)
    
    // Optimistic update
    const originalTodos = state.todos
    const updatedTodos = [...state.todos].sort((a, b) => {
      const aData = reorderedTodos.find(item => item.id === a.id)
      const bData = reorderedTodos.find(item => item.id === b.id)
      return (aData?.position || 0) - (bData?.position || 0)
    })
    setTodos(updatedTodos)
    
    try {
      await todoApiClient.updateTodoOrder(reorderedTodos)
      toast.success('タスクの順序を更新しました')
    } catch (error) {
      // Revert optimistic update
      setTodos(originalTodos)
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to update todo order'
      setError(errorMessage)
      toast.error('タスクの順序更新に失敗しました', {
        description: errorMessage
      })
    }
  }, [state.todos, setTodos, setError])

  const toggleTodoComplete = useCallback(async (id: number) => {
    const todo = state.todos.find(t => t.id === id)
    if (!todo) return
    
    await updateTodo(id, { completed: !todo.completed })
  }, [state.todos, updateTodo])

  // Initial load
  useEffect(() => {
    refreshTodos()
  }, [refreshTodos])

  // Filter todos based on current filter
  const filteredTodos = state.todos.filter(todo => {
    switch (state.filter) {
      case TODO_FILTERS.ACTIVE:
        return !todo.completed
      case TODO_FILTERS.COMPLETED:
        return todo.completed
      default:
        return true
    }
  })

  return {
    todos: filteredTodos,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    createTodo,
    updateTodo,
    deleteTodo,
    updateTodoOrder,
    toggleTodoComplete,
    setFilter,
    refreshTodos,
  }
}