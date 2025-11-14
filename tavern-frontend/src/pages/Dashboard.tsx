import { useAuth } from "../context/AuthContext";
import AdventurerProfileManager from "../components/AdventurerProfileManager";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏰 Tavern Dashboard</h1>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <p>
            <b>ID:</b> {user?.id}
          </p>
          <p>
            <b>Name:</b> {user?.displayName}
          </p>
          <p>
            <b>Role:</b> {user?.role}
          </p>
          <p>
            <b>Username:</b> {user?.username}
          </p>
          <p>
            <b>Email:</b> {user?.email}
          </p>
        </div>

        {/* Feature 1: Adventurer Profile & Skill management */}
        <AdventurerProfileManager />
      </div>
    </div>
  );
}

