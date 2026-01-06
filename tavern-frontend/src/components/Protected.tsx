import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedProps = {
  children: React.ReactNode;
  roles?: ("ADVENTURER" | "NPC" | "GUILD_MASTER")[];
};

export default function Protected({ children, roles }: ProtectedProps) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
