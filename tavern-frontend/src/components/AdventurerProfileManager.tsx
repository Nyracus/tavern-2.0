import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import XPMeter from "./XPMeter";

type AdventurerSkill = {
  _id: string;
  name: string;
  description?: string;
  level: number;
  category?: string;
  cooldown?: string;
};

type Attributes = {
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
  vitality: number;
  luck: number;
};

type AdventurerProfile = {
  _id: string;
  userId: string;
  title: string;
  summary: string;
  class: string;
  race?: string;
  background?: string;
  attributes: Attributes;
  skills: AdventurerSkill[];
  xp?: number;
  rank?: string;
  availableStatPoints?: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};


export default function AdventurerProfileManager() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userGold, setUserGold] = useState<number>(0);

  // Load existing profile on mount
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ApiResponse<AdventurerProfile>>(
          "/adventurers/me",
          token
        );
        if (cancelled) return;

        setProfile(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const l = msg.toLowerCase();

        if (
          l.includes("no adventurer profile found") ||
          l.includes("adventurer profile not found")
        ) {
          // new adventurer
          setProfile(null);
        } else {
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load user gold
  useEffect(() => {
    if (token && user?.role === "ADVENTURER") {
      loadUserGold();
    }
  }, [token, user]);

  // Listen for profile updates from skills shop
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (token) {
        setLoading(true);
        try {
          const res = await api.get<ApiResponse<AdventurerProfile>>(
            "/adventurers/me",
            token
          );
          setProfile(res.data);
          await loadUserGold();
        } catch (err) {
          console.error("Failed to refresh profile", err);
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [token]);

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

  const handleAllocateStat = async (stat: "strength" | "dexterity" | "intelligence") => {
    if (!token || !profile) return;
    setError(null);
    try {
      const res = await api.post<ApiResponse<AdventurerProfile> & { message?: string }>(
        "/adventurers/me/allocate-stat",
        { stat },
        token
      );
      setProfile(res.data);
      // Trigger a custom event to refresh profile display
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to allocate stat point";
      setError(msg);
    }
  };

  if (!user) return null;

  // Only show for adventurers
  if (user.role !== "ADVENTURER") return null;

  return (
    <section className="mt-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🧝 Adventurer Profile & Skills
        </h2>
        <div className="text-lg font-bold text-amber-400 flex items-center gap-2">
          💰 {userGold} Gold
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100 shadow">
          ⚠️ {error}
        </div>
      )}

      {/* Profile Overview */}
      {profile && (
        <div className="rounded-2xl border border-violet-500/40 bg-slate-900/70 p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
              📜 Adventurer Profile
            </h3>
            <Link
              to="/edit-adventurer-profile"
              className="btn bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2"
            >
              ✏️ Edit Profile
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Title:</span>
              <span className="ml-2 text-slate-100 font-semibold">{profile.title}</span>
            </div>
            <div>
              <span className="text-slate-400">Class:</span>
              <span className="ml-2 text-slate-100 font-semibold">{profile.class}</span>
            </div>
            {profile.rank && (
              <div>
                <span className="text-slate-400">Rank:</span>
                <span className="ml-2 text-slate-100 font-semibold">{profile.rank}</span>
              </div>
            )}
            {profile.race && (
              <div>
                <span className="text-slate-400">Race:</span>
                <span className="ml-2 text-slate-100">{profile.race}</span>
              </div>
            )}
            {profile.background && (
              <div className="md:col-span-2">
                <span className="text-slate-400">Background:</span>
                <span className="ml-2 text-slate-100">{profile.background}</span>
              </div>
            )}
            {profile.summary && (
              <div className="md:col-span-2">
                <span className="text-slate-400">Summary:</span>
                <p className="mt-1 text-slate-200">{profile.summary}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 pt-3">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Attributes</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>STR: <span className="font-semibold">{profile.attributes.strength}</span></div>
              <div>DEX: <span className="font-semibold">{profile.attributes.dexterity}</span></div>
              <div>INT: <span className="font-semibold">{profile.attributes.intelligence}</span></div>
              <div>CHA: <span className="font-semibold">{profile.attributes.charisma}</span></div>
              <div>VIT: <span className="font-semibold">{profile.attributes.vitality}</span></div>
              <div>LUCK: <span className="font-semibold">{profile.attributes.luck}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Point Allocation */}
      {profile && (profile.availableStatPoints ?? 0) > 0 && (
        <div className="rounded-2xl border border-purple-500/40 bg-slate-900/70 p-5 space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            ⭐ Stat Point Allocation
          </h3>
          <p className="text-sm text-slate-300">
            You have <span className="font-bold text-purple-300">{profile.availableStatPoints}</span> unallocated stat point{profile.availableStatPoints !== 1 ? 's' : ''} from rank ups!
          </p>
          <p className="text-xs text-slate-400">
            Allocate +1 point to Strength, Dexterity, or Intelligence (max 20 per stat)
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAllocateStat("strength")}
              disabled={profile.attributes.strength >= 20}
              className="btn bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2"
            >
              +1 STR {profile.attributes.strength >= 20 && "(MAX)"}
            </button>
            <button
              onClick={() => handleAllocateStat("dexterity")}
              disabled={profile.attributes.dexterity >= 20}
              className="btn bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2"
            >
              +1 DEX {profile.attributes.dexterity >= 20 && "(MAX)"}
            </button>
            <button
              onClick={() => handleAllocateStat("intelligence")}
              disabled={profile.attributes.intelligence >= 20}
              className="btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-4 py-2"
            >
              +1 INT {profile.attributes.intelligence >= 20 && "(MAX)"}
            </button>
          </div>
        </div>
      )}

      {/* XP Meter - Show rank progression */}
      {profile && (profile.xp !== undefined || profile.rank) && (
        <XPMeter xp={profile.xp || 0} rank={profile.rank || 'F'} />
      )}


      {/* Skills section - read-only display */}
      <div className="rounded-2xl border border-purple-500/60 bg-slate-900/80 text-slate-100 shadow-lg shadow-purple-900/40 p-5">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          ✨ Learned Skills
        </h3>
        {profile && profile.skills.length === 0 && (
          <p className="text-sm text-slate-300">
            No skills yet. Visit the Skills Shop to purchase your first skill!
          </p>
        )}
        {profile && profile.skills.length > 0 && (
          <ul className="space-y-3">
            {profile.skills.map((skill) => (
              <li
                key={skill._id}
                className="rounded-xl border border-purple-500/40 bg-slate-900/90 px-3 py-2"
              >
                <div className="font-semibold">
                  {skill.name}{" "}
                  <span className="text-xs text-purple-200">
                    (Lv. {skill.level}
                    {skill.category ? ` · ${skill.category}` : ""})
                  </span>
                </div>
                {skill.description && (
                  <p className="text-sm text-slate-200 mt-1">
                    {skill.description}
                  </p>
                )}
                {skill.cooldown && (
                  <p className="text-xs text-slate-400 mt-1">
                    Cooldown: {skill.cooldown}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

