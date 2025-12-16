import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";          // ✅ added
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();                       // ✅ added

  const [emailOrUsername, setEou] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(emailOrUsername, password);           // backend call OK
      navigate("/", { replace: true });                 // ✅ redirect to dashboard
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-slate-900/90 shadow-[0_0_35px_rgba(56,189,248,0.35)] p-6 space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide text-sky-200">
            🏰 Tavern Gate
          </h1>
          <p className="text-sm text-slate-300">
            Present your name and sigil to enter the guild hall.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-sky-200 uppercase tracking-wide">
              Email or Username
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              value={emailOrUsername}
              onChange={(e) => setEou(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-sky-200 uppercase tracking-wide">
              Password
            </label>
            <input
              className="input bg-slate-950/70 border-slate-700 text-slate-100"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button className="btn w-full bg-violet-600 hover:bg-violet-700">
            Enter Tavern
          </button>
        </form>

        <div className="text-xs text-slate-300 text-center space-y-1">
          <p>
            No record in the ledger yet?{" "}
            <Link
              to="/register"
              className="text-amber-300 hover:text-amber-200 underline underline-offset-2"
            >
              Inscribe a new guild record
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

