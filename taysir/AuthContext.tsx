import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";


type Role = "ADVENTURER" | "NPC" | "GUILD_MASTER";

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: Role;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (payload: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    password: string;
    role?: Role;
    avatarUrl?: string;
  }) => Promise<void>;
  logout: () => void;
};

// ⭐ FIX: provide REAL default functions to satisfy TS
const defaultAuthContext: AuthCtx = {
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
};

const Ctx = createContext<AuthCtx>(defaultAuthContext);

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("tavern_token")
  );
  const [user, setUser] = useState<User | null>(null);

  // Fetch /auth/me on token change
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const me = await api.get<{ success: boolean; user: User }>(
          "/auth/me",
          token
        );
        setUser(me.user);
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem("tavern_token");
      }
    })();
  }, [token]);

  const login = async (emailOrUsername: string, password: string) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>(
      "/auth/login",
      { emailOrUsername, password }
    );
    setToken(res.token);
    localStorage.setItem("tavern_token", res.token);
    setUser(res.user);
  };

  const register = async (payload: any) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>(
      "/auth/register",
      payload
    );
    setToken(res.token);
    localStorage.setItem("tavern_token", res.token);
    setUser(res.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("tavern_token");
  };

  return (
    <Ctx.Provider value={{ user, token, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}
