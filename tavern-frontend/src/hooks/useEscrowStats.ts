// src/hooks/useEscrowStats.ts
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type EscrowStats = {
  totalLocked: number;
  count: number;
  escrows: Array<{
    _id: string;
    questId: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

export function useEscrowStats() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!token || user?.role !== "NPC") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: EscrowStats }>(
        "/escrows/stats",
        token
      );
      setStats(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load escrow stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [token, user]);

  return { stats, loading, error, refetch: loadStats };
}
