export const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://your-production-api.com"
  : "http://localhost:3001";

export const API_ENDPOINTS = {
  TODOS: "/api/todos",
  TODO_BY_ID: (id: number) => `/api/todos/${id}`,
  TODOS_SEARCH: "/api/todos/search",
  UPDATE_ORDER: "/api/todos/update_order",
  UPDATE_TODO_TAGS: (id: number) => `/api/todos/${id}/tags`,
  DELETE_TODO_FILE: (todoId: number, fileId: string | number) => `/api/todos/${todoId}/files/${fileId}`,
  AUTH_LOGIN: "/auth/sign_in",
  AUTH_REGISTER: "/auth/sign_up",
  AUTH_LOGOUT: "/auth/sign_out",
  CATEGORIES: "/api/categories",
  CATEGORY_BY_ID: (id: number) => `/api/categories/${id}`,
  TAGS: "/api/tags",
  TAG_BY_ID: (id: number) => `/api/tags/${id}`,
} as const;

export const TODO_FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: {
    // Images
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    // Documents
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    // Spreadsheets
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "text/csv": [".csv"],
    // Archives
    "application/zip": [".zip"],
    "application/x-tar": [".tar"],
    "application/gzip": [".gz"],
  },
  ACCEPT_STRING: ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.zip,.tar,.gz",
} as const;
