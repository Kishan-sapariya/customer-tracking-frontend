"use client";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/format";
import type { CustomerStatus, CustomerType } from "@/lib/types";

// StatusBadge — amber pending / emerald completed / red-slate disconnected (PRD §8.1).
const STATUS_STYLE: Record<CustomerStatus, string> = {
  DELIVERY_PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-600/20",
  BILLING_PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-600/20",
  FTB_PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-amber-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-600/20",
  DISCONNECTED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-slate-500/20",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", STATUS_STYLE[status])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// TypeBadge — slate for Old, cyan for New (PRD §8.1).
export function TypeBadge({ type }: { type: CustomerType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        type === "NEW"
          ? "bg-primary-subtle text-primary ring-primary/20"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-slate-500/20"
      )}
    >
      {type === "NEW" ? "New" : "Old"}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-600/20"
          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 ring-red-600/20"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-red-500")} />
      {active ? "Active" : "Deactive"}
    </span>
  );
}
