import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

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

  // some delete handlers may return no body
  try {
    return (await res.json()) as T;
  } catch {
    // @ts-expect-error - caller should handle undefined when using delete
    return undefined;
  }
}

export default function AdventurerProfileManager() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<AdventurerProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [skillForm, setSkillForm] = useState<SkillForm>(emptySkillForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSkill, setSavingSkill] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
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
          level: res.data.level,
          race: res.data.race ?? "",
          background: res.data.background ?? "",
          attributes: res.data.attributes,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);

        // If profile does not exist yet, backend sends message like "Adventurer profile not found"
        if (msg.toLowerCase().includes("adventurer profile not found")) {
          setProfile(null);
          setForm(emptyForm);
        } else {
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

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

    const payload = {
      title: form.title,
      summary: form.summary,
      class: form.charClass,
      level: Number(form.level),
      race: form.race || undefined,
      background: form.background || undefined,
      attributes: form.attributes,
    };

    try {
      let res: ApiResponse<AdventurerProfile>;
      if (!profile) {
        // create
        res = await api.post<ApiResponse<AdventurerProfile>>(
          "/adventurers/me",
          payload,
          token
        );
      } else {
        // update
        res = await patchJson<ApiResponse<AdventurerProfile>>(
          "/adventurers/me",
          payload,
          token
        );
      }
      setProfile(res.data);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSkillChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSkillForm((prev) => ({
      ...prev,
      [name]: name === "level" ? Number(value) : value,
    }));
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingSkill(true);
    setError(null);

    const payload = {
      name: skillForm.name,
      description: skillForm.description || undefined,
      level: Number(skillForm.level),
      category: skillForm.category || undefined,
      cooldown: skillForm.cooldown || undefined,
    };

    try {
      const res = await api.post<ApiResponse<AdventurerProfile>>(
        "/adventurers/me/skills",
        payload,
        token
      );
      setProfile(res.data);
      setSkillForm(emptySkillForm);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!token) return;
    setError(null);

    try {
      const res = await deleteRequest<ApiResponse<AdventurerProfile>>(
        `/adventurers/me/skills/${skillId}`,
        token
      );
      if (res && res.data) {
        setProfile(res.data);
      } else {
        // If backend returns nothing, refetch
        const refreshed = await api.get<ApiResponse<AdventurerProfile>>(
          "/adventurers/me",
          token
        );
        setProfile(refreshed.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  const handleLevelUpSkill = async (skill: AdventurerSkill) => {
    if (!token) return;
    setError(null);

    try {
      const res = await patchJson<ApiResponse<AdventurerProfile>>(
        `/adventurers/me/skills/${skill._id}`,
        { level: skill.level + 1 },
        token
      );
      setProfile(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          🧝 Adventurer Profile & Skills
        </h2>
        {loading && (
          <span className="text-sm text-gray-500">Loading profile...</span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile form */}
      <form
        onSubmit={handleProfileSubmit}
        className="space-y-4 rounded-xl border bg-white p-4 shadow-sm"
      >
        <h3 className="font-semibold">Profile details</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              className="input"
              name="title"
              value={form.title}
              onChange={handleProfileChange}
              placeholder="Dragon Slayer"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Class
            </label>
            <input
              className="input"
              name="charClass"
              value={form.charClass}
              onChange={handleProfileChange}
              placeholder="Warrior"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Level
            </label>
            <input
              className="input"
              type="number"
              min={1}
              name="level"
              value={form.level}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Race
            </label>
            <input
              className="input"
              name="race"
              value={form.race}
              onChange={handleProfileChange}
              placeholder="Human, Elf..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Background
          </label>
          <textarea
            className="input min-h-[80px]"
            name="background"
            value={form.background}
            onChange={handleProfileChange}
            placeholder="Former knight of the Eastern Kingdom..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Summary
          </label>
          <textarea
            className="input min-h-[80px]"
            name="summary"
            value={form.summary}
            onChange={handleProfileChange}
            placeholder="Veteran warrior who hunts dragons..."
            required
          />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">Core attributes</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {(
              Object.keys(form.attributes) as Array<keyof Attributes>
            ).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {key}
                </label>
                <input
                  className="input"
                  type="number"
                  name={key}
                  min={1}
                  max={20}
                  value={form.attributes[key]}
                  onChange={handleProfileChange}
                />
              </div>
            ))}
          </div>
        </div>

        <button className="btn" type="submit" disabled={savingProfile}>
          {savingProfile
            ? "Saving..."
            : profile
            ? "Update profile"
            : "Create profile"}
        </button>
      </form>

      {/* Skills section */}
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold mb-2">Skills</h3>
          {profile && profile.skills.length === 0 && (
            <p className="text-sm text-gray-500">
              No skills yet. Add your first skill using the form on the right.
            </p>
          )}
          {profile && profile.skills.length > 0 && (
            <ul className="space-y-2">
              {profile.skills.map((skill) => (
                <li
                  key={skill._id}
                  className="flex items-start justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <div className="font-medium">
                      {skill.name}{" "}
                      <span className="text-xs text-gray-500">
                        (Lv. {skill.level}
                        {skill.category ? ` · ${skill.category}` : ""})
                      </span>
                    </div>
                    {skill.description && (
                      <p className="text-sm text-gray-600">
                        {skill.description}
                      </p>
                    )}
                    {skill.cooldown && (
                      <p className="text-xs text-gray-400">
                        Cooldown: {skill.cooldown}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn px-3 py-1 text-xs"
                      onClick={() => void handleLevelUpSkill(skill)}
                    >
                      Level up
                    </button>
                    <button
                      type="button"
                      className="btn px-3 py-1 text-xs bg-red-600 hover:bg-red-700"
                      onClick={() => void handleDeleteSkill(skill._id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleAddSkill}
          className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"
        >
          <h3 className="font-semibold">Add new skill</h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              className="input"
              name="name"
              value={skillForm.name}
              onChange={handleSkillChange}
              placeholder="Fireball"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="input min-h-[60px]"
              name="description"
              value={skillForm.description}
              onChange={handleSkillChange}
              placeholder="Throws a fiery ball of doom."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Level
              </label>
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                name="level"
                value={skillForm.level}
                onChange={handleSkillChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
              <input
                className="input"
                name="category"
                value={skillForm.category}
                onChange={handleSkillChange}
                placeholder="Magic, Combat..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Cooldown
              </label>
              <input
                className="input"
                name="cooldown"
                value={skillForm.cooldown}
                onChange={handleSkillChange}
                placeholder="Every 2 turns"
              />
            </div>
          </div>
          <button className="btn w-full" type="submit" disabled={savingSkill}>
            {savingSkill ? "Adding..." : "Add skill"}
          </button>
        </form>
      </div>
    </section>
  );
}
