export const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://your-production-api.com"
  : "http://localhost:3001";

export const API_ENDPOINTS = {
  TODOS: "/api/todos",
  TODO_BY_ID: (id: number) => `/api/todos/${id}`,
  UPDATE_ORDER: "/api/todos/update_order",
  AUTH_LOGIN: "/auth/sign_in",
  AUTH_REGISTER: "/auth/sign_up",
  AUTH_LOGOUT: "/auth/sign_out",
} as const;

export const TODO_FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;
