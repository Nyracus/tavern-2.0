// src/components/ProfileProtected.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfileCheck } from "../hooks/useProfileCheck";

type ProfileProtectedProps = {
  children: React.ReactNode;
  roles?: ("ADVENTURER" | "NPC" | "GUILD_MASTER")[];
};

export default function ProfileProtected({ children, roles }: ProfileProtectedProps) {
  const { token, user } = useAuth();
  const { hasProfile, loading } = useProfileCheck();

  if (!token) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Guild Masters don't need profiles
  if (user?.role === "GUILD_MASTER") {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  // Redirect to profile creation if no profile exists
  // IMPORTANT: Only NEW users (needsProfileSetup=true) are forced into onboarding.
  // Existing users (flag missing/false) can access dashboard even if they never created a profile.
  if (hasProfile === false && user?.needsProfileSetup) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

