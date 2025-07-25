import { HttpClient, ApiError } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import type {
  Todo,
  CreateTodoData,
  UpdateTodoData,
  UpdateOrderData,
} from "@/features/todo/types/todo";

class TodoApiClient extends HttpClient {
  async getTodos(): Promise<Todo[]> {
    return this.get<Todo[]>(API_ENDPOINTS.TODOS);
  }

  async getTodoById(id: number): Promise<Todo> {
    return this.get<Todo>(API_ENDPOINTS.TODO_BY_ID(id));
  }

  async createTodo(data: CreateTodoData, files?: File[]): Promise<Todo> {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("todo[title]", data.title);
      if (data.due_date) formData.append("todo[due_date]", data.due_date);
      if (data.priority) formData.append("todo[priority]", data.priority);
      if (data.status) formData.append("todo[status]", data.status);
      if (data.description) formData.append("todo[description]", data.description);
      if (data.category_id) formData.append("todo[category_id]", data.category_id.toString());
      if (data.tag_ids) {
        data.tag_ids.forEach((id) => formData.append("todo[tag_ids][]", id.toString()));
      }
      files.forEach((file) => formData.append("todo[files][]", file));

      return this.uploadFile<Todo>(API_ENDPOINTS.TODOS, formData);
    }
    return this.post<Todo>(API_ENDPOINTS.TODOS, { todo: data });
  }

  async updateTodo(id: number, data: UpdateTodoData, files?: File[]): Promise<Todo> {
    if (files && files.length > 0) {
      const formData = new FormData();
      if (data.title !== undefined) formData.append("todo[title]", data.title);
      if (data.completed !== undefined) formData.append("todo[completed]", data.completed.toString());
      if (data.due_date !== undefined) formData.append("todo[due_date]", data.due_date || "");
      if (data.priority !== undefined) formData.append("todo[priority]", data.priority);
      if (data.status !== undefined) formData.append("todo[status]", data.status);
      if (data.description !== undefined) formData.append("todo[description]", data.description || "");
      if (data.category_id !== undefined) formData.append("todo[category_id]", data.category_id?.toString() || "");
      if (data.tag_ids !== undefined) {
        data.tag_ids.forEach((id) => formData.append("todo[tag_ids][]", id.toString()));
      }
      files.forEach((file) => formData.append("todo[files][]", file));

      return this.uploadFile<Todo>(API_ENDPOINTS.TODO_BY_ID(id), formData, "PATCH");
    }
    return this.put<Todo>(API_ENDPOINTS.TODO_BY_ID(id), { todo: data });
  }

  async deleteTodo(id: number): Promise<void> {
    return this.delete<void>(API_ENDPOINTS.TODO_BY_ID(id));
  }

  async updateTodoOrder(todos: UpdateOrderData[]): Promise<void> {
    return this.patch<void>(API_ENDPOINTS.UPDATE_ORDER, { todos });
  }

  async updateTodoTags(id: number, tagIds: number[]): Promise<Todo> {
    return this.patch<Todo>(API_ENDPOINTS.UPDATE_TODO_TAGS(id), { tag_ids: tagIds });
  }

  // File operations
  async deleteTodoFile(todoId: number, fileId: string | number): Promise<Todo> {
    return this.delete<Todo>(API_ENDPOINTS.DELETE_TODO_FILE(todoId, fileId));
  }

  async downloadFile(url: string): Promise<Blob> {
    // For file downloads, we need to handle the response differently
    const token = localStorage.getItem("authToken");

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
      );
    }

    return response.blob();
  }
}

export const todoApiClient = new TodoApiClient();
export { ApiError };
