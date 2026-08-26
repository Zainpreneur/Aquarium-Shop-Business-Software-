import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { money } from "../lib/format";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { useAuth } from "../lib/auth";
import type { Category, Product, ProductType, Supplier } from "../types";

const PRODUCT_TYPES: ProductType[] = ["LIVESTOCK", "PLANT", "EQUIPMENT", "FOOD", "CHEMICAL", "DECOR", "SUPPLY", "OTHER"];

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  type: "LIVESTOCK" as ProductType,
  categoryId: "",
  supplierId: "",
  costPrice: 0,
  sellPrice: 0,
  quantity: 0,
  reorderLevel: 5,
  unit: "unit",
  species: "",
  scientificName: "",
  waterType: "FRESHWATER",
  careLevel: "",
  temperamentType: "",
  minTankSizeGallons: "",
  tempRangeLowF: "",
  tempRangeHighF: "",
  phLow: "",
  phHigh: "",
  healthStatus: "HEALTHY",
};

export function Inventory() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(params.get("lowStock") === "true");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adjustFor, setAdjustFor] = useState<Product | null>(null);

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "STAFF";
  const canDelete = user?.role === "ADMIN" || user?.role === "MANAGER";

  async function load() {
    setLoading(true);
    try {
      const query: Record<string, string> = { pageSize: "200" };
      if (search) query.search = search;
      if (typeFilter) query.type = typeFilter;
      if (lowStockOnly) query.lowStock = "true";
      const [p, c, s] = await Promise.all([
        api.get("/products", { params: query }),
        api.get("/categories"),
        api.get("/suppliers"),
      ]);
      setProducts(p.data.products);
      setCategories(c.data);
      setSuppliers(s.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, lowStockOnly]);

  useEffect(() => {
    setLowStockOnly(params.get("lowStock") === "true");
  }, [params]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || "",
      type: p.type,
      categoryId: p.categoryId || "",
      supplierId: p.supplierId || "",
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
      unit: p.unit,
      species: p.species || "",
      scientificName: p.scientificName || "",
      waterType: p.waterType || "FRESHWATER",
      careLevel: p.careLevel || "",
      temperamentType: p.temperamentType || "",
      minTankSizeGallons: p.minTankSizeGallons?.toString() || "",
      tempRangeLowF: p.tempRangeLowF?.toString() || "",
      tempRangeHighF: p.tempRangeHighF?.toString() || "",
      phLow: p.phLow?.toString() || "",
      phHigh: p.phHigh?.toString() || "",
      healthStatus: p.healthStatus || "HEALTHY",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const isLivestockLike = form.type === "LIVESTOCK" || form.type === "PLANT";
      const payload: any = {
        sku: form.sku,
        name: form.name,
        description: form.description || null,
        type: form.type,
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
        quantity: Number(form.quantity),
        reorderLevel: Number(form.reorderLevel),
        unit: form.unit,
      };
      if (isLivestockLike) {
        payload.species = form.species || null;
        payload.scientificName = form.scientificName || null;
        payload.waterType = form.waterType || "NA";
        payload.careLevel = form.careLevel || null;
        payload.temperamentType = form.temperamentType || null;
        payload.minTankSizeGallons = form.minTankSizeGallons ? Number(form.minTankSizeGallons) : null;
        payload.tempRangeLowF = form.tempRangeLowF ? Number(form.tempRangeLowF) : null;
        payload.tempRangeHighF = form.tempRangeHighF ? Number(form.tempRangeHighF) : null;
        payload.phLow = form.phLow ? Number(form.phLow) : null;
        payload.phHigh = form.phHigh ? Number(form.phHigh) : null;
        if (form.type === "LIVESTOCK") payload.healthStatus = form.healthStatus || "HEALTHY";
      }

      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(p: Product) {
    if (!confirm(`Deactivate "${p.name}"? It will no longer appear in POS or active listings.`)) return;
    await api.delete(`/products/${p.id}`);
    load();
  }

  const isLivestockLike = form.type === "LIVESTOCK" || form.type === "PLANT";

  const totalValue = useMemo(() => products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0), [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-400">
            {products.length} products · {money(totalValue)} in stock value
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or species…"
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-100"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-ocean-500 focus:outline-none"
        >
          <option value="">All types</option>
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setParams(e.target.checked ? { lowStock: "true" } : {});
            }}
            className="rounded border-slate-300 text-ocean-600 focus:ring-ocean-500"
          />
          <SlidersHorizontal size={14} /> Low stock only
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Loading inventory…
                </td>
              </tr>
            )}
            {!loading &&
              products.map((p) => {
                const low = p.quantity <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.sku}
                        {p.species && ` · ${p.species}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={p.type} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{money(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{money(p.sellPrice)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${low ? "text-amber-600" : "text-slate-700"}`}>
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-4 py-3">
                      {low ? <Badge value="QUARANTINE" className="!bg-amber-100 !text-amber-700" /> : null}
                      {p.type === "LIVESTOCK" && p.healthStatus && p.healthStatus !== "NA" && <Badge value={p.healthStatus} />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ocean-600" title="Edit">
                            <Pencil size={15} />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => setAdjustFor(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ocean-600" title="Adjust stock">
                            <SlidersHorizontal size={15} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeactivate(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Deactivate">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product" : "Add Product"} width="max-w-2xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="SKU">
            <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} disabled={!!editing} />
          </Field>
          <Field label="Name">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Supplier">
            <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. fish, bottle, unit" />
          </Field>
          <Field label="Cost Price ($)">
            <input type="number" step="0.01" className="input" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Sell Price ($)">
            <input type="number" step="0.01" className="input" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} />
          </Field>
          <Field label="Quantity in Stock">
            <input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </Field>
          <Field label="Reorder Level">
            <input type="number" className="input" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
          </Field>
        </div>

        <Field label="Description" className="mt-4">
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>

        {isLivestockLike && (
          <div className="mt-5 rounded-xl bg-ocean-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ocean-700">Livestock &amp; Plant Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Common Species">
                <input className="input" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} />
              </Field>
              <Field label="Scientific Name">
                <input className="input" value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} />
              </Field>
              <Field label="Water Type">
                <select className="input" value={form.waterType} onChange={(e) => setForm({ ...form, waterType: e.target.value })}>
                  <option value="FRESHWATER">Freshwater</option>
                  <option value="SALTWATER">Saltwater</option>
                  <option value="BRACKISH">Brackish</option>
                  <option value="NA">N/A</option>
                </select>
              </Field>
              <Field label="Care Level">
                <select className="input" value={form.careLevel} onChange={(e) => setForm({ ...form, careLevel: e.target.value })}>
                  <option value="">Unspecified</option>
                  <option value="EASY">Easy</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="DIFFICULT">Difficult</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </Field>
              <Field label="Temperament / Notes">
                <input className="input" value={form.temperamentType} onChange={(e) => setForm({ ...form, temperamentType: e.target.value })} />
              </Field>
              <Field label="Min Tank Size (gal)">
                <input type="number" className="input" value={form.minTankSizeGallons} onChange={(e) => setForm({ ...form, minTankSizeGallons: e.target.value })} />
              </Field>
              <Field label="Temp Range (°F)">
                <div className="flex gap-2">
                  <input type="number" className="input" placeholder="Low" value={form.tempRangeLowF} onChange={(e) => setForm({ ...form, tempRangeLowF: e.target.value })} />
                  <input type="number" className="input" placeholder="High" value={form.tempRangeHighF} onChange={(e) => setForm({ ...form, tempRangeHighF: e.target.value })} />
                </div>
              </Field>
              <Field label="pH Range">
                <div className="flex gap-2">
                  <input type="number" step="0.1" className="input" placeholder="Low" value={form.phLow} onChange={(e) => setForm({ ...form, phLow: e.target.value })} />
                  <input type="number" step="0.1" className="input" placeholder="High" value={form.phHigh} onChange={(e) => setForm({ ...form, phHigh: e.target.value })} />
                </div>
              </Field>
              {form.type === "LIVESTOCK" && (
                <Field label="Health Status">
                  <select className="input" value={form.healthStatus} onChange={(e) => setForm({ ...form, healthStatus: e.target.value })}>
                    <option value="HEALTHY">Healthy</option>
                    <option value="QUARANTINE">Quarantine</option>
                    <option value="SICK">Sick</option>
                    <option value="DECEASED">Deceased</option>
                  </select>
                </Field>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.sku || !form.name}
            className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </Modal>

      <AdjustModal product={adjustFor} onClose={() => setAdjustFor(null)} onDone={load} />
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function AdjustModal({ product, onClose, onDone }: { product: Product | null; onClose: () => void; onDone: () => void }) {
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"ADJUSTMENT" | "MORTALITY" | "RETURN">("ADJUSTMENT");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDelta(0);
    setReason("");
    setType("ADJUSTMENT");
    setError("");
  }, [product]);

  if (!product) return null;

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await api.post(`/products/${product!.id}/adjust`, { quantityChange: delta, reason: reason || "Manual adjustment", type });
      onDone();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!product} onClose={onClose} title={`Adjust Stock — ${product.name}`}>
      <p className="mb-4 text-sm text-slate-500">
        Current stock: <span className="font-semibold text-slate-700">{product.quantity} {product.unit}</span>
      </p>
      <div className="space-y-4">
        <Field label="Adjustment type">
          <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="ADJUSTMENT">General adjustment / recount</option>
            <option value="MORTALITY">Mortality / loss</option>
            <option value="RETURN">Customer return</option>
          </select>
        </Field>
        <Field label="Change in quantity (use negative to remove)">
          <input type="number" className="input" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
        </Field>
        <Field label="Reason">
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Recount, disease, damaged item" />
        </Field>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={submit} disabled={saving || delta === 0} className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700 disabled:opacity-60">
            {saving ? "Saving…" : "Apply Adjustment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
