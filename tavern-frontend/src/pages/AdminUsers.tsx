// src/pages/AdminUsers.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type User = {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  role: "ADVENTURER" | "NPC" | "GUILD_MASTER";
  createdAt: string;
};

export default function AdminUsers() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ADVENTURER" | "NPC">("all");

  useEffect(() => {
    if (token && user?.role === "GUILD_MASTER") {
      loadUsers();
    }
  }, [token, user]);

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: User[] }>(
        "/users",
        token
      );
      // Filter out Guild Masters from deletion list
      const filtered = res.data.filter(u => u.role !== "GUILD_MASTER");
      setUsers(filtered);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete user "${username}" (ID: ${userId})?\n\nThis will permanently delete:\n- User account\n- Adventurer profile (if exists)\n- All quests\n- All chat messages\n- All notifications\n- All conflicts\n- All transactions\n\nThis action cannot be undone!`)) {
      return;
    }

    setDeletingId(userId);
    setError(null);
    try {
      await api.del(`/admin/users/${userId}`, token);
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || user.role !== "GUILD_MASTER") {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
        Access denied. Guildmaster only.
      </div>
    );
  }

  const filteredUsers = filter === "all" 
    ? users 
    : users.filter(u => u.role === filter);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-2">
              👥 User Management
            </h1>
            <p className="text-sm text-slate-300">
              Delete NPC or Adventurer accounts by ID to reset and start over
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            ← Back to Dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-3 text-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 border-b border-slate-700">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              filter === "all"
                ? "border-blue-500 text-blue-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setFilter("ADVENTURER")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              filter === "ADVENTURER"
                ? "border-green-500 text-green-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Adventurers ({users.filter(u => u.role === "ADVENTURER").length})
          </button>
          <button
            onClick={() => setFilter("NPC")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              filter === "NPC"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            NPCs ({users.filter(u => u.role === "NPC").length})
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading users…</p>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No users found.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-slate-800/50 border-b border-slate-700 text-xs md:text-sm font-semibold">
              <span>User ID</span>
              <span>Username</span>
              <span>Display Name</span>
              <span>Role</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-slate-700">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="grid grid-cols-5 gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="text-xs md:text-sm font-mono text-slate-300 truncate">
                    {u._id}
                  </div>
                  <div className="text-sm text-slate-200">
                    {u.username}
                  </div>
                  <div className="text-sm text-slate-200">
                    {u.displayName}
                  </div>
                  <div className="text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === "ADVENTURER"
                          ? "bg-green-500/20 text-green-300 border border-green-500/40"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDelete(u._id, u.username)}
                      disabled={deletingId === u._id}
                      className="btn bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-1"
                    >
                      {deletingId === u._id ? "Deleting..." : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-amber-500/40 bg-amber-900/20 p-4 text-sm text-amber-200">
          <p className="font-semibold mb-2">⚠️ Warning:</p>
          <p>
            Deleting a user will permanently remove their account and all associated data including:
            quests, profiles, chat messages, notifications, conflicts, and transactions. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}


