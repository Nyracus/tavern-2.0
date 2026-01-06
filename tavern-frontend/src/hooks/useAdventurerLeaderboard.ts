// src/hooks/useAdventurerLeaderboard.ts
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type LeaderItem = {
  position: number;
  userId: string;
  title: string;
  class: string;
  level: number;
  xp: number;
  rank: string;
};

type LeaderboardResponse = {
  success: boolean;
  items: LeaderItem[];
};

export function useAdventurerLeaderboard(limit = 20) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<LeaderboardResponse>(
          `/leaderboard/adventurers?limit=${limit}`
        );
        setData(res);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  return { data, loading, error };
}
