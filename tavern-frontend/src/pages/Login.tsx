import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [emailOrUsername, setEou] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  try {
    await login(emailOrUsername, password);
  } catch (err: unknown) {
    const error = err as Error;
    setError(error.message || "Login failed");
  }
};


  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">Welcome back to Tavern</h1>
        <input className="input" placeholder="Email or Username" value={emailOrUsername} onChange={e=>setEou(e.target.value)}/>
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="btn w-full">Login</button>
      </form>
    </div>
  );
}
