"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AccountInfo } from "@/features/auth/types/auth";

interface AuthContextValue {
  account: AccountInfo | null;
  isAuthenticated: boolean;
  setAuth: (account: AccountInfo, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("account_info");
    if (stored) {
      try {
        setAccount(JSON.parse(stored));
      } catch {
        localStorage.removeItem("account_info");
      }
    }
  }, []);

  const setAuth = useCallback((accountInfo: AccountInfo, token: string) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("account_info", JSON.stringify(accountInfo));
    setAccount(accountInfo);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("account_info");
    setAccount(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ account, isAuthenticated: !!account, setAuth, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
