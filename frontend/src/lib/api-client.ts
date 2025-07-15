import { API_BASE_URL, API_ENDPOINTS } from './constants'
import type { 
  Todo, 
  CreateTodoData, 
  UpdateTodoData, 
  UpdateOrderData, 
  TodoError 
} from '@/features/todo/types/todo'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: TodoError
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      // Handle no content responses
      if (response.status === 204) {
        return null as T
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Network error occurred', 0)
    }
  }

  async getTodos(): Promise<Todo[]> {
    return this.request<Todo[]>(API_ENDPOINTS.TODOS)
  }

  async getTodoById(id: number): Promise<Todo> {
    return this.request<Todo>(API_ENDPOINTS.TODO_BY_ID(id))
  }

  async createTodo(data: CreateTodoData): Promise<Todo> {
    return this.request<Todo>(API_ENDPOINTS.TODOS, {
      method: 'POST',
      body: JSON.stringify({ todo: data }),
    })
  }

  async updateTodo(id: number, data: UpdateTodoData): Promise<Todo> {
    return this.request<Todo>(API_ENDPOINTS.TODO_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify({ todo: data }),
    })
  }

  async deleteTodo(id: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.TODO_BY_ID(id), {
      method: 'DELETE',
    })
  }

  async updateTodoOrder(todos: UpdateOrderData[]): Promise<void> {
    return this.request<void>(API_ENDPOINTS.UPDATE_ORDER, {
      method: 'PATCH',
      body: JSON.stringify({ todos }),
    })
  }
}

export const apiClient = new ApiClient()
export { ApiError }
export type { ApiClient }