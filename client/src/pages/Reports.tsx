import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { api } from "../lib/api";
import { money } from "../lib/format";
import type { DashboardSummary } from "../types";

interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

const PIE_COLORS = ["#14a7e0", "#ff7a59", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export function Reports() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/dashboard/summary"), api.get("/dashboard/top-products", { params: { limit: "8" } })]).then(([s, t]) => {
      setSummary(s.data);
      setTopProducts(t.data);
      setLoading(false);
    });
  }, []);

  if (loading || !summary) return <p className="text-sm text-slate-400">Loading reports…</p>;

  const inventoryPie = Object.entries(summary.inventoryByType).map(([type, qty]) => ({ name: type, value: qty }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-400">Top products and inventory composition.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Top products by revenue</h2>
          {topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No sales recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => money(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Bar dataKey="revenue" fill="#0985bd" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Inventory units by category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={inventoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {inventoryPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Units Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {topProducts.map((p) => (
              <tr key={p.productId}>
                <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                <td className="px-4 py-3 text-right text-slate-500">{p.quantity}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{money(p.revenue)}</td>
              </tr>
            ))}
            {topProducts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
