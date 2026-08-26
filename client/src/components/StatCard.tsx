import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "ocean",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: "ocean" | "coral" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    ocean: "from-ocean-500 to-ocean-700",
    coral: "from-coral-500 to-coral-600",
    emerald: "from-emerald-500 to-emerald-700",
    amber: "from-amber-500 to-amber-600",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tones[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
