import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import SkillsShop from "./SkillsShop";

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
  level: number;
  race?: string;
  background?: string;
  attributes: Attributes;
  skills: AdventurerSkill[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type ProfileForm = {
  title: string;
  summary: string;
  charClass: string;
  level: number;
  race: string;
  background: string;
  attributes: Attributes;
};

const emptyAttributes: Attributes = {
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  charisma: 10,
  vitality: 10,
  luck: 10,
};

const emptyForm: ProfileForm = {
  title: "",
  summary: "",
  charClass: "",
  level: 1,
  race: "",
  background: "",
  attributes: emptyAttributes,
};

type SkillForm = {
  name: string;
  description: string;
  level: number;
  category: string;
  cooldown: string;
};

const emptySkillForm: SkillForm = {
  name: "",
  description: "",
  level: 1,
  category: "",
  cooldown: "",
};

const BASE = import.meta.env.VITE_API_URL as string;

async function patchJson<T>(
  path: string,
  body: unknown,
  token: string
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<T>;
}

async function deleteRequest<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export default function AdventurerProfileManager() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
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
        setForm({
          title: res.data.title,
          summary: res.data.summary,
          charClass: res.data.class,
          level: res.data.level, // level still tracked, but not editable by player
          race: res.data.race ?? "",
          background: res.data.background ?? "",
          attributes: res.data.attributes,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const l = msg.toLowerCase();

        if (
          l.includes("no adventurer profile found") ||
          l.includes("adventurer profile not found")
        ) {
          // new adventurer, start at level 1
          setProfile(null);
          setForm(emptyForm);
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
          setForm({
            title: res.data.title,
            summary: res.data.summary,
            charClass: res.data.class,
            level: res.data.level,
            race: res.data.race ?? "",
            background: res.data.background ?? "",
            attributes: res.data.attributes,
          });
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

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name in form.attributes) {
      const key = name as keyof Attributes;
      setForm((prev) => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [key]: Number(value),
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingProfile(true);
    setError(null);

    // NOTE: we still send level, but player cannot change it in the UI.
    const payload = {
      title: form.title,
      summary: form.summary,
      class: form.charClass,
      level: form.level, // stays 1 unless backend/admin updates it
      race: form.race || undefined,
      background: form.background || undefined,
      attributes: form.attributes,
    };

    try {
      let res: ApiResponse<AdventurerProfile>;
      if (!profile) {
        res = await api.post<ApiResponse<AdventurerProfile>>(
          "/adventurers/me",
          payload,
          token
        );
      } else {
        res = await patchJson<ApiResponse<AdventurerProfile>>(
          "/adventurers/me",
          payload,
          token
        );
      }
      setProfile(res.data);
      // keep form in sync, including possibly updated level from backend
      setForm((prev) => ({ ...prev, level: res.data.level }));
      setEditingProfile(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSavingProfile(false);
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

      {/* Current profile card – parchment style */}
      {profile && (
        <div className="rounded-2xl border border-amber-700 bg-[#fdf3d0] text-slate-900 shadow-lg shadow-amber-900/30 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              📜 Current Profile
            </h3>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="btn bg-amber-700 hover:bg-amber-800 text-white text-sm px-4 py-2"
            >
              {editingProfile ? "Cancel Edit" : "✏️ Edit Profile"}
            </button>
          </div>
          <p>
            <b>Title:</b> {profile.title}
          </p>
          <p>
            <b>Class:</b> {profile.class} <span className="mx-2">|</span>{" "}
            <b>Level:</b> {profile.level}
          </p>
          {profile.race && (
            <p>
              <b>Race:</b> {profile.race}
            </p>
          )}
          {profile.background && (
            <p>
              <b>Background:</b> {profile.background}
            </p>
          )}
          {profile.summary && (
            <p>
              <b>Summary:</b> {profile.summary}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3 text-sm font-semibold">
            <p>STR: {profile.attributes.strength}</p>
            <p>DEX: {profile.attributes.dexterity}</p>
            <p>INT: {profile.attributes.intelligence}</p>
            <p>CHA: {profile.attributes.charisma}</p>
            <p>VIT: {profile.attributes.vitality}</p>
            <p>LUCK: {profile.attributes.luck}</p>
          </div>
        </div>
      )}

      {/* Profile form – parchment card - only show when editing */}
      {editingProfile && (
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-2xl border border-amber-700 bg-[#fdf3d0]/95 text-slate-900 shadow-lg shadow-amber-900/30 p-5 space-y-4"
        >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          ✒️ Edit / Create Adventurer Profile
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">Title</label>
            <input
              className="input bg-amber-50"
              name="title"
              placeholder="Dragon Slayer"
              value={form.title}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Class</label>
            <input
              className="input bg-amber-50"
              name="charClass"
              placeholder="Warrior"
              value={form.charClass}
              onChange={handleProfileChange}
              required
            />
          </div>

          {/* 🔒 Level is read-only: player sees it, but cannot edit */}
          <div>
            <label className="text-sm font-semibold">Level</label>
            <div className="input bg-amber-100/80 flex items-center h-[42px] text-sm">
              <span className="font-medium mr-1">{form.level}</span>
              <span className="text-xs text-slate-600">
                (increases via quests / guild actions)
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Race</label>
            <input
              className="input bg-amber-50"
              name="race"
              placeholder="Human, Elf…"
              value={form.race}
              onChange={handleProfileChange}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Background</label>
          <textarea
            className="input bg-amber-50 min-h-[70px]"
            name="background"
            placeholder="Former knight of the Eastern Kingdom…"
            value={form.background}
            onChange={handleProfileChange}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Summary</label>
          <textarea
            className="input bg-amber-50 min-h-[70px]"
            name="summary"
            placeholder="Veteran warrior who hunts dragons…"
            value={form.summary}
            onChange={handleProfileChange}
            required
          />
        </div>

        <div>
          <h4 className="font-semibold mb-2">💠 Core Attributes</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {(Object.keys(form.attributes) as Array<keyof Attributes>).map(
              (key) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wide">
                    {key}
                  </label>
                  <input
                    className="input bg-amber-50"
                    type="number"
                    name={key}
                    value={form.attributes[key]}
                    onChange={handleProfileChange}
                  />
                </div>
              )
            )}
          </div>
        </div>

        <button
          className="btn bg-amber-700 hover:bg-amber-800 text-white"
          type="submit"
          disabled={savingProfile}
        >
          {savingProfile
            ? "Saving…"
            : profile
            ? "Update Profile"
            : "Create Profile"}
        </button>
      </form>
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

      {/* Skills Shop */}
      <SkillsShop />
    </section>
  );
}

