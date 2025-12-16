// src/components/SkillsShop.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

type ShopSkill = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  level: number;
  cooldown?: string;
  available: boolean;
};

export default function SkillsShop() {
  const { token, user } = useAuth();
  const [shopSkills, setShopSkills] = useState<ShopSkill[]>([]);
  const [userGold, setUserGold] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (token && user?.role === "ADVENTURER") {
      loadShop();
      loadUserGold();
    }
  }, [token, user]);

  const loadShop = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: ShopSkill[] }>(
        "/skills/shop",
        token
      );
      setShopSkills(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load shop");
    } finally {
      setLoading(false);
    }
  };

  const loadUserGold = async () => {
    if (!token) return;
    try {
      const res = await api.get<{ success: boolean; user: { gold?: number } }>(
        "/auth/me",
        token
      );
      setUserGold(res.user?.gold || 0);
    } catch (err) {
      console.error("Failed to load gold", err);
    }
  };

  const handlePurchase = async (skillId: string, skillName: string) => {
    if (!token) return;
    setPurchasing(skillId);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<{
        success: boolean;
        data: { remainingGold: number };
        message: string;
      }>(`/skills/shop/${skillId}/purchase`, {}, token);
      setSuccess(res.message || `Successfully purchased ${skillName}!`);
      setUserGold(res.data.remainingGold);
      await loadShop(); // Refresh shop in case skill becomes unavailable
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to purchase skill");
    } finally {
      setPurchasing(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "combat":
        return "border-red-500/60 bg-red-900/20";
      case "magic":
        return "border-purple-500/60 bg-purple-900/20";
      case "stealth":
        return "border-slate-500/60 bg-slate-900/20";
      case "support":
        return "border-blue-500/60 bg-blue-900/20";
      default:
        return "border-amber-500/60 bg-amber-900/20";
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-6">
        <p className="text-slate-400">Loading skills shop…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          🛒 Skills Shop
        </h3>
        <div className="text-lg font-bold text-amber-400 flex items-center gap-2">
          💰 {userGold} Gold
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/60 bg-green-900/40 px-4 py-3 text-green-100">
          ✅ {success}
        </div>
      )}

      {shopSkills.length === 0 ? (
        <p className="text-slate-400 text-center py-4">
          No skills available in the shop at this time.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopSkills.map((skill) => (
            <div
              key={skill._id}
              className={`rounded-xl border ${getCategoryColor(skill.category)} p-4 space-y-2`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{skill.name}</h4>
                  <p className="text-xs text-slate-400 mb-1">
                    {skill.category} • Level {skill.level}
                  </p>
                  <p className="text-sm text-slate-300">{skill.description}</p>
                  {skill.cooldown && (
                    <p className="text-xs text-slate-400 mt-1">
                      Cooldown: {skill.cooldown}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-lg font-bold text-amber-400">
                  💰 {skill.price} Gold
                </span>
                <button
                  onClick={() => handlePurchase(skill._id, skill.name)}
                  disabled={purchasing === skill._id || userGold < skill.price}
                  className="btn bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-sm px-4 py-2"
                >
                  {purchasing === skill._id
                    ? "Purchasing..."
                    : userGold < skill.price
                    ? "Insufficient Gold"
                    : "Purchase"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

