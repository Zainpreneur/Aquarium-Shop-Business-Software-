import { useEffect, useState } from "react";
import { RotateCcw, Receipt } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { money, dateTime } from "../lib/format";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useAuth } from "../lib/auth";
import type { Sale } from "../types";

export function SalesHistory() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Sale | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/sales", { params: { pageSize: "100" } });
    setSales(data.sales);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function refund(sale: Sale) {
    if (!confirm(`Refund ${sale.saleNumber}? This restocks all items.`)) return;
    setError("");
    try {
      await api.post(`/sales/${sale.id}/refund`);
      load();
      setDetail(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const canRefund = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Sales History</h1>
        <p className="text-sm text-slate-400">{sales.length} transactions</p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Sale #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Loading sales…
                </td>
              </tr>
            )}
            {!loading &&
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-700">{sale.saleNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{sale.customer?.name ?? "Walk-in"}</td>
                  <td className="px-4 py-3 text-slate-500">{sale.user?.name}</td>
                  <td className="px-4 py-3">
                    <Badge value={sale.paymentMethod} className="!bg-slate-100 !text-slate-600" />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={sale.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{dateTime(sale.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">{money(sale.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetail(sale)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ocean-600" title="View receipt">
                        <Receipt size={15} />
                      </button>
                      {canRefund && sale.status === "COMPLETED" && (
                        <button onClick={() => refund(sale)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Refund">
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Receipt — ${detail.saleNumber}` : ""}>
        {detail && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-500">
              <span>{dateTime(detail.createdAt)}</span>
              <Badge value={detail.status} />
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {detail.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1.5">
                  <span className="text-slate-600">
                    {item.quantity} × {item.product?.name}
                  </span>
                  <span className="font-medium text-slate-700">{money(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{money(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>-{money(detail.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{money(detail.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-800">
                <span>Total</span>
                <span>{money(detail.total)}</span>
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {canRefund && detail.status === "COMPLETED" && (
              <button onClick={() => refund(detail)} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                Refund this sale
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
