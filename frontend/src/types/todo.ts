export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoDto {
  title: string;
  completed?: boolean;
  due_date?: string | null;
}

export interface UpdateTodoDto {
  title?: string;
  completed?: boolean;
  position?: number;
  due_date?: string | null;
}

export interface UpdateTodoOrderDto {
  id: number;
  position: number;
}

export interface ApiError {
  [key: string]: string[];
}