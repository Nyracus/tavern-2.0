// src/components/AdventurerStats.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type AdventurerProfile = {
  xp?: number;
  rank?: string;
  class?: string;
};

export default function AdventurerStats() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [gold, setGold] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.role === "ADVENTURER") {
      loadStats();
      // Poll for gold updates every 30 seconds (reduced from 5 seconds)
      const interval = setInterval(() => {
        // Only poll if tab is visible
        if (!document.hidden) {
          loadStats();
        }
      }, 30000); // 30 seconds instead of 5
      
      // Listen for payment notifications to refresh immediately
      const handlePaymentNotification = () => {
        loadStats();
      };
      window.addEventListener('paymentReceived', handlePaymentNotification);
      
      // Also refresh when tab becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          loadStats();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('paymentReceived', handlePaymentNotification);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [token, user]);

  const loadStats = async () => {
    if (!token) return;
    try {
      // Load profile for XP and rank
      const profileRes = await api.get<{ success: boolean; data: AdventurerProfile }>(
        "/adventurers/me",
        token
      ).catch(() => ({ success: true, data: null }));
      
      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      // Load gold from user
      const goldRes = await api.get<{ success: boolean; user: { gold?: number } }>(
        "/auth/me",
        token
      ).catch(() => ({ success: true, user: { gold: 0 } }));
      
      setGold(goldRes.user?.gold || 0);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "SSS":
      case "SS":
      case "S":
        return "text-yellow-300 border-yellow-400/60 bg-yellow-500/20";
      case "A":
      case "B":
        return "text-emerald-300 border-emerald-400/60 bg-emerald-500/15";
      case "C":
      case "D":
        return "text-sky-300 border-sky-400/60 bg-sky-500/10";
      case "E":
      case "F":
      default:
        return "text-slate-200 border-slate-500/60 bg-slate-700/40";
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-amber-500/40 bg-slate-900/70 p-4 md:p-5">
        <p className="text-sm text-slate-400">Loading stats…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-500/40 bg-slate-900/70 shadow-[0_0_25px_rgba(245,158,11,0.2)] p-4 md:p-5">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        ⚔️ Adventurer Status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gold */}
        <div className="rounded-xl border border-amber-500/40 bg-slate-950/70 p-4 text-center">
          <div className="text-2xl font-bold text-amber-400 mb-1">💰 {gold}</div>
          <div className="text-xs text-slate-300">Gold</div>
        </div>

        {/* Rank */}
        <div className="rounded-xl border border-blue-500/40 bg-slate-950/70 p-4 text-center">
          <div className="text-2xl font-bold mb-1">
            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full border ${getRankColor(profile?.rank || "F")}`}>
              {profile?.rank || "F"}
            </span>
          </div>
          <div className="text-xs text-slate-300">Rank</div>
        </div>

        {/* XP */}
        <div className="rounded-xl border border-purple-500/40 bg-slate-950/70 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">{profile?.xp || 0}</div>
          <div className="text-xs text-slate-300">Experience Points</div>
        </div>
      </div>
      {profile?.class && (
        <div className="mt-3 text-sm text-slate-300 text-center">
          <span className="font-medium">Class:</span> {profile.class}
        </div>
      )}
    </section>
  );
}

