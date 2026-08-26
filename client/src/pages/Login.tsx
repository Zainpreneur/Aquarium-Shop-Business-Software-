import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Waves } from "lucide-react";
import { useAuth } from "../lib/auth";
import { apiErrorMessage } from "../lib/api";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@aquashop.test");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ocean-800 via-ocean-700 to-ocean-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 text-white">
            <Waves size={28} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Aquashop Business Suite</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage your aquarium shop</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-100"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-ocean-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Demo accounts</p>
          <p>Admin: admin@aquashop.test / admin123</p>
          <p>Staff: staff@aquashop.test / staff123</p>
        </div>
      </div>
    </div>
  );
}
