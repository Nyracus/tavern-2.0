// src/pages/Onboarding.tsx
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  // If user doesn't need onboarding anymore, go to dashboard
  if (!user.needsProfileSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdventurer = user.role === "ADVENTURER";
  const isNPC = user.role === "NPC";

  // Guild masters never need this page
  if (!isAdventurer && !isNPC) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/40 bg-slate-900/90 shadow-[0_0_35px_rgba(245,158,11,0.25)] p-6 space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold tracking-wide text-amber-200">
            📜 Welcome, {user.displayName}
          </h1>
          <p className="text-sm text-slate-300">
            Before you can access your dashboard, you must create your{" "}
            {isAdventurer ? "Adventurer" : "NPC"} profile.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-2">
          <p className="text-sm text-slate-200">
            <b>Role:</b> {user.role}
          </p>
          <p className="text-xs text-slate-400">
            This onboarding step is only shown the first time after registration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {isAdventurer && (
            <Link
              to="/create-adventurer-profile"
              className="btn bg-violet-600 hover:bg-violet-700 text-center py-3"
            >
              ⚔️ Create Adventurer Profile
            </Link>
          )}
          {isNPC && (
            <Link
              to="/create-npc-profile"
              className="btn bg-purple-600 hover:bg-purple-700 text-center py-3"
            >
              🏛️ Create NPC Profile
            </Link>
          )}
          <Link
            to="/login"
            className="text-center text-xs text-slate-300 hover:text-slate-100 underline underline-offset-2"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}


