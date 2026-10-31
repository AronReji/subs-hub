"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, Role } from "./types";
import { mockUsers } from "./mock-data";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: Role; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    company: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Password rule: more than 8 characters, uppercase, lowercase, special character
export function validatePassword(password: string): { valid: boolean; reason?: string } {
  if (password.length <= 8) {
    return { valid: false, reason: "Password must be more than 8 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter." };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one special character." };
  }
  return { valid: true };
}

const STORAGE_KEY = "brightloop_auth_session_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from storage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user && parsed.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save session when user changes
  const saveSession = (newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setToken(newToken);
    if (newUser && newToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser, token: newToken }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: Role; error?: string }> => {
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return { success: false, error: pwCheck.reason };
    }

    // Match with seeded users or stored accounts
    const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!foundUser) {
      return {
        success: false,
        error: "Invalid email or password. Use demo accounts: admin@brightloop.com, staff@brightloop.com, or customer@apexlabs.com with password 'Admin@123!'",
      };
    }

    const mockToken = `jwt_${foundUser.role.toLowerCase()}_${Date.now()}`;
    saveSession(foundUser, mockToken);

    return { success: true, role: foundUser.role };
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    company: string
  ): Promise<{ success: boolean; error?: string }> => {
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return { success: false, error: pwCheck.reason };
    }

    const exists = mockUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      name,
      email,
      role: "CUSTOMER", // per spec, signup creates CUSTOMER accounts
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    const mockToken = `jwt_customer_${Date.now()}`;
    saveSession(newUser, mockToken);

    return { success: true };
  };

  const logout = () => {
    saveSession(null, null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
