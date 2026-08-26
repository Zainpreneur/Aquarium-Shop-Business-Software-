import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, Package, Users, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";
import { money, shortDate, dateTime } from "../lib/format";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/Badge";
import type { DashboardSummary } from "../types";

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Loading dashboard…</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load dashboard.</p>;

  const chartData = data.salesTrend.map((d) => ({ ...d, label: shortDate(d.date) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400">Here's how your shop is doing.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={money(data.todayRevenue)} sub={`${data.todayOrders} orders`} icon={<DollarSign size={20} />} tone="ocean" />
        <StatCard label="This Month" value={money(data.monthRevenue)} sub={`${data.monthOrders} orders`} icon={<DollarSign size={20} />} tone="coral" />
        <StatCard label="Active Products" value={String(data.totalProducts)} sub={money(data.inventoryValue) + " inventory value"} icon={<Package size={20} />} tone="emerald" />
        <StatCard label="Customers" value={String(data.totalCustomers)} sub={`${data.lowStockCount} low-stock alerts`} icon={<Users size={20} />} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Sales — last 30 days</h2>
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No sales recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14a7e0" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14a7e0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => money(v)} />
                <Tooltip formatter={(v) => money(Number(v))} labelStyle={{ color: "#334155" }} />
                <Area type="monotone" dataKey="total" stroke="#0985bd" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Low stock alerts</h2>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-400">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {data.lowStockItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-700">{item.name}</p>
                    <Badge value={item.type} />
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {item.quantity} / {item.reorderLevel}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/inventory?lowStock=true" className="mt-4 inline-block text-xs font-semibold text-ocean-600 hover:underline">
            View all low-stock items →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-400">
                <th className="pb-2 pr-4">Sale #</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Cashier</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="py-2 pr-4 font-medium text-slate-700">{sale.saleNumber}</td>
                  <td className="py-2 pr-4 text-slate-500">{sale.customer?.name ?? "Walk-in"}</td>
                  <td className="py-2 pr-4 text-slate-500">{sale.user?.name}</td>
                  <td className="py-2 pr-4">
                    <Badge value={sale.status} />
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{dateTime(sale.createdAt)}</td>
                  <td className="py-2 text-right font-semibold text-slate-700">{money(sale.total)}</td>
                </tr>
              ))}
              {data.recentSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No sales yet — head to Point of Sale to record your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
