import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useAuth } from "../lib/auth";
import type { Role } from "../types";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" as Role });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/users");
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: StaffUser) {
    await api.put(`/users/${u.id}`, { isActive: !u.isActive });
    load();
  }

  async function changeRole(u: StaffUser, role: Role) {
    await api.put(`/users/${u.id}`, { role });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Staff Accounts</h1>
          <p className="text-sm text-slate-400">Manage who can access the shop system.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading staff…
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={u.id === me?.id}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:bg-slate-50"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={u.isActive ? "HEALTHY" : "DECEASED"} className={u.isActive ? "" : ""} />
                    <span className="ml-1 text-xs text-slate-400">{u.isActive ? "Active" : "Disabled"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={u.id === me?.id}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Account">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Email</span>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Temporary Password</span>
            <input type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Role</span>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="STAFF">STAFF</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name || !form.email || form.password.length < 6}
              className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
