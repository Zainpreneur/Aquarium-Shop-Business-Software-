import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Pencil, Truck } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { Modal } from "../components/Modal";
import type { Supplier } from "../types";

const emptyForm = { name: "", contactName: "", email: "", phone: "", address: "", notes: "" };

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/suppliers");
    setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contactName: s.contactName || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
      notes: s.notes || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, email: form.email || null };
      if (editing) await api.put(`/suppliers/${editing.id}`, payload);
      else await api.post("/suppliers", payload);
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
          <h1 className="text-2xl font-semibold text-slate-800">Suppliers</h1>
          <p className="text-sm text-slate-400">{suppliers.length} suppliers</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-slate-400">Loading suppliers…</p>}
        {!loading &&
          suppliers.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.contactName || "No contact set"}</p>
                  </div>
                </div>
                <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ocean-600">
                  <Pencil size={14} />
                </button>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>{s.email || "No email"}</p>
                <p>{s.phone || "No phone"}</p>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>{s._count?.products ?? 0} products</span>
                <span>{s._count?.purchaseOrders ?? 0} purchase orders</span>
              </div>
            </div>
          ))}
        {!loading && suppliers.length === 0 && <p className="text-sm text-slate-400">No suppliers yet.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Supplier" : "Add Supplier"}>
        <div className="space-y-4">
          <Field label="Supplier Name">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Contact Name">
            <input className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
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
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </div>
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
