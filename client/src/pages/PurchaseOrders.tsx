import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import type { Product, PurchaseOrder, Supplier } from "../types";

interface DraftLine {
  productId: string;
  quantityOrdered: number;
  unitCost: number;
}

export function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [receiveFor, setReceiveFor] = useState<PurchaseOrder | null>(null);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});

  async function load() {
    setLoading(true);
    const [o, s, p] = await Promise.all([api.get("/purchase-orders"), api.get("/suppliers"), api.get("/products", { params: { pageSize: "200" } })]);
    setOrders(o.data);
    setSuppliers(s.data);
    setProducts(p.data.products);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setSupplierId("");
    setLines([]);
    setError("");
    setModalOpen(true);
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantityOrdered: 1, unitCost: 0 }]);
  }

  function updateLine(idx: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = lines.reduce((sum, l) => sum + l.quantityOrdered * l.unitCost, 0);

  async function submitOrder() {
    setSaving(true);
    setError("");
    try {
      const validLines = lines.filter((l) => l.productId && l.quantityOrdered > 0);
      if (!supplierId || validLines.length === 0) throw new Error("Choose a supplier and at least one product line");
      await api.post("/purchase-orders", { supplierId, items: validLines });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(order: PurchaseOrder, status: string) {
    await api.put(`/purchase-orders/${order.id}/status`, { status });
    load();
  }

  function openReceive(order: PurchaseOrder) {
    setReceiveFor(order);
    const initial: Record<string, number> = {};
    for (const item of order.items) {
      initial[item.id] = item.quantityOrdered - item.quantityReceived;
    }
    setReceiveQty(initial);
  }

  async function submitReceive() {
    if (!receiveFor) return;
    const items = Object.entries(receiveQty)
      .filter(([, qty]) => qty > 0)
      .map(([purchaseOrderItemId, quantityReceived]) => ({ purchaseOrderItemId, quantityReceived }));
    if (items.length === 0) return;
    await api.post(`/purchase-orders/${receiveFor.id}/receive`, { items });
    setReceiveFor(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Purchase Orders</h1>
          <p className="text-sm text-slate-400">{orders.length} orders</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700">
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">PO #</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ordered</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Loading purchase orders…
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-700">{o.poNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{o.supplier?.name}</td>
                  <td className="px-4 py-3 text-slate-500">{o.items.length} lines</td>
                  <td className="px-4 py-3">
                    <Badge value={o.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{shortDate(o.orderDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">{money(o.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {o.status === "DRAFT" && (
                        <button onClick={() => setStatus(o, "ORDERED")} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                          Mark Ordered
                        </button>
                      )}
                      {(o.status === "ORDERED" || o.status === "PARTIALLY_RECEIVED") && (
                        <button
                          onClick={() => openReceive(o)}
                          className="flex items-center gap-1 rounded-lg bg-ocean-50 px-2.5 py-1 text-xs font-medium text-ocean-700 hover:bg-ocean-100"
                        >
                          <PackageCheck size={13} /> Receive
                        </button>
                      )}
                      {o.status !== "RECEIVED" && o.status !== "CANCELLED" && (
                        <button onClick={() => setStatus(o, "CANCELLED")} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Cancel">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No purchase orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order" width="max-w-2xl">
        <div className="space-y-4">
          <Field label="Supplier">
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Select a supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Line items</span>
              <button onClick={addLine} className="text-xs font-semibold text-ocean-600 hover:underline">
                + Add line
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select className="input flex-1" value={line.productId} onChange={(e) => updateLine(idx, { productId: e.target.value })}>
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="input w-20"
                    value={line.quantityOrdered}
                    onChange={(e) => updateLine(idx, { quantityOrdered: Number(e.target.value) })}
                    placeholder="Qty"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="input w-24"
                    value={line.unitCost}
                    onChange={(e) => updateLine(idx, { unitCost: Number(e.target.value) })}
                    placeholder="Cost"
                  />
                  <button onClick={() => removeLine(idx)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {lines.length === 0 && <p className="text-sm text-slate-400">Add at least one product line.</p>}
            </div>
          </div>

          <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <span>Estimated total</span>
            <span>{money(total)}</span>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={submitOrder} disabled={saving} className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700 disabled:opacity-60">
              {saving ? "Creating…" : "Create Purchase Order"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!receiveFor} onClose={() => setReceiveFor(null)} title={receiveFor ? `Receive — ${receiveFor.poNumber}` : ""}>
        {receiveFor && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Enter quantities being received into stock now.</p>
            <div className="space-y-3">
              {receiveFor.items.map((item) => {
                const remaining = item.quantityOrdered - item.quantityReceived;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.product?.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.quantityReceived}/{item.quantityOrdered} received
                      </p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={remaining}
                      className="input w-24"
                      value={receiveQty[item.id] ?? 0}
                      onChange={(e) => setReceiveQty({ ...receiveQty, [item.id]: Number(e.target.value) })}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReceiveFor(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={submitReceive} className="rounded-xl bg-ocean-600 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-700">
                Confirm Receipt
              </button>
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
