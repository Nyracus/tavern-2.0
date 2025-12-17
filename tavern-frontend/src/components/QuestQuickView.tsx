// src/components/QuestQuickView.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

type Quest = {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  rewardGold?: number;
  npcName?: string;
  recommendationScore?: number;
  recommendationRank?: string;
};

export default function QuestQuickView() {
  const { token } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadRecommendedQuests();
    }
  }, [token]);

  const loadRecommendedQuests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Quest[] }>(
        "/quests/recommended",
        token
      ).catch(() => ({ success: true, data: [] }));
      // Limit to 3 for quick view
      const limited = (res.data || []).slice(0, 3);
      setQuests(limited);
    } catch (err) {
      console.error("Failed to load recommended quests", err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-400";
      case "Medium": return "text-yellow-400";
      case "Hard": return "text-orange-400";
      case "Epic": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Loading recommended quests…</p>;
  }

  if (quests.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-400">No recommended quests available.</p>
        <Link
          to="/adventurer/quests"
          className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
        >
          Browse all quests →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quests.map((quest) => (
        <Link
          key={quest._id}
          to="/adventurer/quests"
          className="block rounded-xl border border-blue-500/40 bg-slate-950/70 p-3 hover:bg-blue-500/10 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{quest.title}</h3>
                <span className={`text-xs font-medium ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty}
                </span>
                {quest.recommendationRank && (
                  <span className="text-xs text-purple-400">
                    ⭐ {quest.recommendationRank}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mb-1">{quest.description}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>💰 {quest.rewardGold || 0} gold</span>
                {quest.npcName && <span>👤 {quest.npcName}</span>}
              </div>
            </div>
            <button className="ml-2 text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
              Apply
            </button>
          </div>
        </Link>
      ))}
      <div className="text-center pt-2">
        <Link
          to="/adventurer/quests"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          View all quests →
        </Link>
      </div>
    </div>
  );
}

