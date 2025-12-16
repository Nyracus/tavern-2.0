import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Role = "ADVENTURER" | "NPC" | "GUILD_MASTER";

type RegisterForm = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  role: Role;
  avatarUrl?: string;
};

export default function Register() {
  // rename to avoid shadowing the component/file name
  const { register: registerUser } = useAuth();

  const [form, setForm] = useState<RegisterForm>({
    email: "",
    username: "",
    displayName: "",
    password: "",
    role: "ADVENTURER",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await registerUser(form);
      setSuccess("Your guild record has been inscribed. You may now return to the tavern gate and log in.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Register failed";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-900/90 shadow-[0_0_35px_rgba(245,158,11,0.35)] p-6 space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide text-amber-200">
            📜 Guild Registration Scroll
          </h1>
          <p className="text-sm text-slate-300">
            Inscribe a new record in the tavern ledger.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Email
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Username
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Display Name
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Password
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Guild Role
            </label>
            <select
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="ADVENTURER">ADVENTURER</option>
              <option value="NPC">NPC</option>
              <option value="GUILD_MASTER">GUILD_MASTER</option>
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && (
            <p className="text-emerald-300 text-sm border border-emerald-500/40 rounded-md px-3 py-2 bg-emerald-900/20">
              {success}
            </p>
          )}

          <button className="btn w-full bg-violet-600 hover:bg-violet-700" type="submit">
            Inscribe Record
          </button>
        </form>

        <div className="text-xs text-slate-300 text-center space-y-1">
          <p>
            Already sworn to the guild?{" "}
            <Link
              to="/login"
              className="text-amber-300 hover:text-amber-200 underline underline-offset-2"
            >
              Return to the tavern gate
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
