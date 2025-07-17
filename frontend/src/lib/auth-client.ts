import { httpClient } from "./api-client";
import { API_BASE_URL, API_ENDPOINTS } from "./constants";

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface LoginRequest {
  user: {
    email: string;
    password: string;
  };
}

export interface RegisterRequest {
  user: {
    email: string;
    password: string;
    password_confirmation: string;
    name: string;
  };
}

export interface AuthResponse {
  status: {
    code: number;
    message: string;
  };
  data: User;
}

export interface AuthError {
  status: {
    code: number;
    message: string;
  };
}

class AuthClient {
  private async authRequest(endpoint: string, data: unknown): Promise<{ user: User; token: string }> {
    console.log("authRequest called with endpoint:", endpoint, "data:", data); // Debug log
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status); // Debug log
      console.log("Response headers:", Object.fromEntries(response.headers.entries())); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Authentication failed:", errorData); // Debug log
        throw new Error(errorData.error || errorData.status?.message || "Authentication failed");
      }

      const responseData: AuthResponse = await response.json();
      const token = (responseData as any).token || "";

      console.log("Login response token (from body):", token); // Debug log

      if (token) {
        // Bearerプレフィックスを削除してからトークンを保存
        const cleanToken = token.replace("Bearer ", "");
        this.setAuthToken(cleanToken);
        console.log("Token saved to localStorage:", this.getAuthToken()); // Debug log
      } else {
        console.error("No Authorization header found in login response");
      }

      return {
        user: responseData.data,
        token: token.replace("Bearer ", ""),
      };
    } catch (error) {
      console.error("authRequest error:", error); // Debug log
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    return this.authRequest(API_ENDPOINTS.AUTH_LOGIN, credentials);
  }

  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    return this.authRequest(API_ENDPOINTS.AUTH_REGISTER, userData);
  }

  async logout(): Promise<void> {
    try {
      await httpClient.delete(API_ENDPOINTS.AUTH_LOGOUT);
    } finally {
      this.removeAuthToken();
    }
  }

  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      // Remove 'Bearer ' prefix if it exists
      const cleanToken = token.replace("Bearer ", "");
      localStorage.setItem("authToken", cleanToken);
    }
  }

  getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  }

  removeAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const authClient = new AuthClient();
