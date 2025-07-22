import { httpClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Category, CreateCategoryData, UpdateCategoryData } from "../types/category";

class CategoryApiClient {
  async getCategories(): Promise<Category[]> {
    return httpClient.get<Category[]>(API_ENDPOINTS.CATEGORIES);
  }

  async getCategory(id: number): Promise<Category> {
    return httpClient.get<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id));
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    return httpClient.post<Category>(API_ENDPOINTS.CATEGORIES, {
      category: data,
    });
  }

  async updateCategory(id: number, data: UpdateCategoryData): Promise<Category> {
    return httpClient.put<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
      category: data,
    });
  }

  async deleteCategory(id: number): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
  }
}

export const categoryApiClient = new CategoryApiClient();
