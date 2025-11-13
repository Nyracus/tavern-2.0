import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏰 Tavern Dashboard</h1>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
        <div className="mt-4 p-4 rounded-xl border">
          <p><b>ID:</b> {user?.id}</p>
          <p><b>Name:</b> {user?.displayName}</p>
          <p><b>Role:</b> {user?.role}</p>
          <p><b>Username:</b> {user?.username}</p>
          <p><b>Email:</b> {user?.email}</p>
        </div>
      </div>
    </div>
  );
}
