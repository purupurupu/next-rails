"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient, User, LoginRequest, RegisterRequest } from "@/lib/auth-client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = authClient.getAuthToken();
    if (token) {
      // TODO: Validate token with backend or decode JWT to get user info
      // For now, we'll just set isAuthenticated based on token presence
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await authClient.login(credentials);
      setUser(loggedInUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      const { user: registeredUser } = await authClient.register(userData);
      setUser(registeredUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authClient.logout();
      setUser(null);
    } catch (error) {
      // Even if logout fails on the server, clear local state
      setUser(null);
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user || authClient.isAuthenticated();

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
