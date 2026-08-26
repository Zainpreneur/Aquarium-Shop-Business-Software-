import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Fish,
  Users,
  Truck,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  LogOut,
  Shield,
  Waves,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Fish },
  { to: "/sales", label: "Sales History", icon: ClipboardList },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-700 text-white">
            <Waves size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">Aquashop</p>
            <p className="text-xs text-slate-400 leading-tight">Business Suite</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-ocean-50 text-ocean-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-ocean-50 text-ocean-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`
              }
            >
              <Shield size={18} />
              Staff Accounts
            </NavLink>
          )}
        </nav>
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-100 text-sm font-semibold text-ocean-700">
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Waves size={20} className="text-ocean-600" />
            <span className="font-semibold text-slate-800">Aquashop</span>
          </div>
          <button onClick={logout} className="text-sm text-slate-500">
            Sign out
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-2 py-2 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive ? "bg-ocean-50 text-ocean-700" : "text-slate-500"
                }`
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
