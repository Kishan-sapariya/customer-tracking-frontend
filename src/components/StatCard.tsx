"use client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// Clickable stat card — navigates to the customers list pre-filtered via URL
// query (shareable/bookmarkable, PRD §5.6 / §8.3). One component, prop-configured.
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "primary",
  hint,
  sub,
  subLabel,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  hint?: string;
  sub?: string; // a secondary highlighted value (e.g. the ARC figure)
  subLabel?: string; // small caption for the sub value
}) {
  const router = useRouter();
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary-subtle",
    success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    danger: "text-red-600 bg-red-50 dark:bg-red-950/40",
    neutral: "text-slate-500 bg-slate-100 dark:bg-slate-800",
  };

  return (
    <button
      type="button"
      onClick={() => href && router.push(href)}
      disabled={!href}
      className={cn(
        "animate-in group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all",
        href && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && (
        <div className="-mt-1 border-t border-border pt-2">
          <div className="text-sm font-semibold tabular-nums text-primary">{sub}</div>
          {subLabel && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{subLabel}</div>}
        </div>
      )}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </button>
  );
}
