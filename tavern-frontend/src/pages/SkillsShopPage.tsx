// src/pages/SkillsShopPage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import SkillsShop from "../components/SkillsShop";

type AdventurerProfile = {
  _id: string;
  skills: Array<{ _id: string; name: string }>;
};

export default function SkillsShopPage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [userGold, setUserGold] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.role === "ADVENTURER") {
      loadData();
    }
  }, [token, user]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Load profile for skills
      const profileRes = await api.get<{ success: boolean; data: AdventurerProfile }>(
        "/adventurers/me",
        token
      ).catch(() => ({ success: true, data: null }));
      
      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      // Load gold
      const goldRes = await api.get<{ success: boolean; user: { gold?: number } }>(
        "/auth/me",
        token
      ).catch(() => ({ success: true, user: { gold: 0 } }));
      
      setUserGold(goldRes.user?.gold || 0);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillPurchased = async () => {
    // Reload profile after skill purchase
    await loadData();
  };

  if (!user || user.role !== "ADVENTURER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. Adventurer only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              💎 Skills Shop
            </h1>
            <p className="text-sm text-slate-300">
              Purchase powerful skills and abilities to enhance your adventuring capabilities
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-500/10"
          >
            ← Back to Home
          </Link>
        </header>

        {loading ? (
          <p className="text-slate-400">Loading skills shop…</p>
        ) : (
          <SkillsShop
            adventurerSkills={profile?.skills || []}
            userGold={userGold}
            onGoldUpdate={setUserGold}
            onSkillPurchased={handleSkillPurchased}
          />
        )}
      </div>
    </div>
  );
}


