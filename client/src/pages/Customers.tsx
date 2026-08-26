import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Search, Pencil, Star } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { Modal } from "../components/Modal";
import type { Customer } from "../types";

const emptyForm = { name: "", email: "", phone: "", address: "", notes: "" };

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Customer | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/customers", { params: search ? { search } : {} });
    setCustomers(data);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "", notes: c.notes || "" });
    setError("");
    setModalOpen(true);
  }

  async function viewDetail(c: Customer) {
    const { data } = await api.get(`/customers/${c.id}`);
    setDetail(data);
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, email: form.email || null };
      if (editing) await api.put(`/customers/${editing.id}`, payload);
      else await api.post("/customers", payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-400">{customers.length} customers</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-slate-400">Loading customers…</p>}
        {!loading &&
          customers.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between">
                <button onClick={() => viewDetail(c)} className="text-left">
                  <p className="font-medium text-slate-700 hover:text-ocean-600">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.email || "No email"}</p>
                  <p className="text-xs text-slate-400">{c.phone || "No phone"}</p>
                </button>
                <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ocean-600">
                  <Pencil size={14} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400" /> {c.loyaltyPoints} pts
                </span>
                <span>{c._count?.sales ?? 0} purchases</span>
              </div>
            </div>
          ))}
        {!loading && customers.length === 0 && <p className="text-sm text-slate-400">No customers yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer" : "Add Customer"}>
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Notes">
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving || !form.name} className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700 disabled:opacity-60">
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Customer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""} width="max-w-xl">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-500">
              <p>Email: {detail.email || "—"}</p>
              <p>Phone: {detail.phone || "—"}</p>
              <p>Loyalty points: {detail.loyaltyPoints}</p>
              <p>Total orders: {detail.sales?.length ?? 0}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Purchase history</p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {(detail.sales ?? []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{s.saleNumber}</p>
                      <p className="text-xs text-slate-400">{shortDate(s.createdAt)}</p>
                    </div>
                    <p className="font-semibold text-slate-700">{money(s.total)}</p>
                  </div>
                ))}
                {(detail.sales ?? []).length === 0 && <p className="text-sm text-slate-400">No purchases yet.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
