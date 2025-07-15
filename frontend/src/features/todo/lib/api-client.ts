import { HttpClient, ApiError } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/constants'
import type { 
  Todo, 
  CreateTodoData, 
  UpdateTodoData, 
  UpdateOrderData
} from '@/features/todo/types/todo'

class TodoApiClient extends HttpClient {
  async getTodos(): Promise<Todo[]> {
    return this.get<Todo[]>(API_ENDPOINTS.TODOS)
  }

  async getTodoById(id: number): Promise<Todo> {
    return this.get<Todo>(API_ENDPOINTS.TODO_BY_ID(id))
  }

  async createTodo(data: CreateTodoData): Promise<Todo> {
    return this.post<Todo>(API_ENDPOINTS.TODOS, { todo: data })
  }

  async updateTodo(id: number, data: UpdateTodoData): Promise<Todo> {
    return this.put<Todo>(API_ENDPOINTS.TODO_BY_ID(id), { todo: data })
  }

  async deleteTodo(id: number): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TODO_BY_ID(id))
  }

  async updateTodoOrder(todos: UpdateOrderData[]): Promise<void> {
    return this.patch<void>(API_ENDPOINTS.UPDATE_ORDER, { todos })
  }
}

export const todoApiClient = new TodoApiClient()
export { ApiError }