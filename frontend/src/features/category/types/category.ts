export interface Category {
  id: number;
  name: string;
  color: string;
  todo_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  color: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryError {
  name?: string[];
  color?: string[];
  base?: string[];
}