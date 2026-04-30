"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AccountInfo } from "@/features/auth/types/auth";

interface AuthContextValue {
  account: AccountInfo | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (account: AccountInfo, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedAccount = localStorage.getItem("account_info");
    const storedToken = localStorage.getItem("access_token");

    if (!storedToken) {
      localStorage.removeItem("account_info");
      setAccount(null);
      setToken(null);
      setIsInitialized(true);
      return;
    }

    if (storedAccount) {
      try {
        setAccount(JSON.parse(storedAccount));
        setToken(storedToken);
      } catch {
        localStorage.removeItem("account_info");
        localStorage.removeItem("access_token");
        setAccount(null);
        setToken(null);
      }
    } else {
      localStorage.removeItem("access_token");
      setToken(null);
    }

    setIsInitialized(true);
  }, []);

  const setAuth = useCallback((accountInfo: AccountInfo, token: string) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("account_info", JSON.stringify(accountInfo));
    setAccount(accountInfo);
    setToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("account_info");
    setAccount(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ account, isAuthenticated: !!account && !!token, isInitialized, setAuth, clearAuth }}
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
