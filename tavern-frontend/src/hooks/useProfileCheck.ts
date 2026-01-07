// src/hooks/useProfileCheck.ts
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useProfileCheck() {
  const { token, user } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        if (user.role === "ADVENTURER") {
          const res = await api.get<{ success: boolean; data?: any }>(
            "/adventurers/me",
            token
          );
          setHasProfile(!!res.data);
        } else if (user.role === "NPC") {
          const res = await api.get<{ success: boolean; data?: any }>(
            "/npcs/me",
            token
          );
          setHasProfile(!!res.data);
        } else {
          // Guild Masters don't need profiles
          setHasProfile(true);
        }
      } catch (err: any) {
        // 404 means no profile exists
        if (err?.status === 404) {
          setHasProfile(false);
        } else {
          // Other errors - assume no profile for safety
          setHasProfile(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user]);

  return { hasProfile, loading };
}

