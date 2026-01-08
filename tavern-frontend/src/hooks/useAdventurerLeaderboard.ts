// src/hooks/useAdventurerLeaderboard.ts
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type LeaderItem = {
  position: number;
  userId: string;
  username?: string;
  displayName?: string;
  title: string;
  class: string;
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
        setError(null);
        const res = await api.get<any>(
          `/leaderboard/adventurers?limit=${limit}`
        );
        
        // Backend returns: { success: true, items: [...] }
        // Handle response safely
        let items: LeaderItem[] = [];
        
        if (res) {
          if (Array.isArray(res.items)) {
            items = res.items;
          } else if (Array.isArray(res.data)) {
            items = res.data;
          } else if (Array.isArray(res)) {
            // Direct array response
            items = res;
          }
        }
        
        setData({ success: true, items });
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Failed to load leaderboard";
        setError(errorMsg);
        setData({ success: false, items: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  return { data, loading, error };
}
