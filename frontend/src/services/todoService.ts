import { Todo, CreateTodoDto, UpdateTodoDto, UpdateTodoOrderDto, ApiError } from '@/types/todo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class TodoService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 422) {
        const errors: ApiError = await response.json();
        throw new Error(Object.values(errors).flat().join(', '));
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    
    return response.json();
  }

  async fetchTodos(): Promise<Todo[]> {
    const response = await fetch(`${API_BASE_URL}/api/todos`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse<Todo[]>(response);
  }

  async fetchTodo(id: number): Promise<Todo> {
    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse<Todo>(response);
  }

  async createTodo(data: CreateTodoDto): Promise<Todo> {
    const response = await fetch(`${API_BASE_URL}/api/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todo: data }),
    });
    return this.handleResponse<Todo>(response);
  }

  async updateTodo(id: number, data: UpdateTodoDto): Promise<Todo> {
    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todo: data }),
    });
    return this.handleResponse<Todo>(response);
  }

  async deleteTodo(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    await this.handleResponse<void>(response);
  }

  async updateTodoOrder(todos: UpdateTodoOrderDto[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/todos/update_order`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todos }),
    });
    await this.handleResponse<void>(response);
  }
}

export const todoService = new TodoService();