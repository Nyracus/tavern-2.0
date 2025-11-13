import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type Role = "ADVENTURER" | "NPC" | "GUILD_MASTER";

type RegisterForm = {
  id: string;
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
    id: "",
    email: "",
    username: "",
    displayName: "",
    password: "",
    role: "ADVENTURER",
  });

  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await registerUser(form);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Register failed";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Create your Tavern account</h1>

        <input
          className="input"
          placeholder="ID (e.g., hero-1)"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="input"
          placeholder="Display Name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          className="input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
        >
          <option value="ADVENTURER">ADVENTURER</option>
          <option value="NPC">NPC</option>
          <option value="GUILD_MASTER">GUILD_MASTER</option>
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="btn w-full" type="submit">Register</button>
      </form>
    </div>
  );
}
