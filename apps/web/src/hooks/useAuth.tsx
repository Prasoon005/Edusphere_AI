import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { getAccessToken, setAccessToken } from "@/lib/tokenStore";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // Attempt a silent refresh using the httpOnly cookie to restore the session.
        const res = await api.post("/auth/refresh");
        const token = res.data?.data?.accessToken as string | undefined;
        if (token) {
          setAccessToken(token);
          const me = await api.get("/auth/me");
          if (!cancelled) setUser(me.data.data);
        }
      } catch {
        setAccessToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setAccessToken(null);
      setUser(null);
    }
    window.addEventListener("edusphere:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("edusphere:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user: loggedInUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}
