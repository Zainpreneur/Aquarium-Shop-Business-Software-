import { titleCase } from "../lib/format";

const palettes: Record<string, string> = {
  HEALTHY: "bg-emerald-100 text-emerald-700",
  QUARANTINE: "bg-amber-100 text-amber-700",
  SICK: "bg-red-100 text-red-700",
  DECEASED: "bg-gray-200 text-gray-600",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-red-100 text-red-700",
  PARTIALLY_REFUNDED: "bg-amber-100 text-amber-700",
  VOID: "bg-gray-200 text-gray-600",
  DRAFT: "bg-gray-200 text-gray-600",
  ORDERED: "bg-ocean-100 text-ocean-700",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  EASY: "bg-emerald-100 text-emerald-700",
  MODERATE: "bg-amber-100 text-amber-700",
  DIFFICULT: "bg-orange-100 text-orange-700",
  EXPERT: "bg-red-100 text-red-700",
  LIVESTOCK: "bg-ocean-100 text-ocean-700",
  PLANT: "bg-emerald-100 text-emerald-700",
  EQUIPMENT: "bg-indigo-100 text-indigo-700",
  FOOD: "bg-amber-100 text-amber-700",
  CHEMICAL: "bg-purple-100 text-purple-700",
  DECOR: "bg-pink-100 text-pink-700",
  SUPPLY: "bg-teal-100 text-teal-700",
  OTHER: "bg-gray-200 text-gray-600",
  FRESHWATER: "bg-ocean-100 text-ocean-700",
  SALTWATER: "bg-cyan-100 text-cyan-700",
  BRACKISH: "bg-lime-100 text-lime-700",
  NA: "bg-gray-100 text-gray-500",
  ADMIN: "bg-coral-500/15 text-coral-600",
  MANAGER: "bg-ocean-100 text-ocean-700",
  STAFF: "bg-gray-200 text-gray-600",
};

export function Badge({ value, className = "" }: { value?: string | null; className?: string }) {
  if (!value) return null;
  const palette = palettes[value] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${palette} ${className}`}>
      {titleCase(value)}
    </span>
  );
}
