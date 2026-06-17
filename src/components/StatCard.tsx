"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, ArrowRight, type LucideIcon } from "lucide-react";
import { CountUp } from "./CountUp";

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
  subArrow,
  subTone,
  journey,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  hint?: string;
  sub?: ReactNode; // a secondary highlighted value (e.g. the ARC figure)
  subLabel?: string; // small caption for the sub value
  subArrow?: "up" | "down"; // directional arrow + color on the sub value
  subTone?: "primary" | "success" | "warning" | "danger" | "neutral"; // color the sub value
  journey?: { start: ReactNode; current: ReactNode }; // start → current ARC view
  accent?: string; // decorative top-bar color (CSS color); caller rotates a palette so neighbours differ
}) {
  const router = useRouter();
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary-subtle ring-1 ring-inset ring-primary/15",
    success: "text-emerald-600 bg-emerald-50 ring-1 ring-inset ring-emerald-500/15 dark:bg-emerald-950/40",
    warning: "text-amber-600 bg-amber-50 ring-1 ring-inset ring-amber-500/15 dark:bg-amber-950/40",
    danger: "text-red-600 bg-red-50 ring-1 ring-inset ring-red-500/15 dark:bg-red-950/40",
    neutral: "text-slate-500 bg-slate-100 ring-1 ring-inset ring-slate-400/15 dark:bg-slate-800",
  };
  const subTextTones: Record<string, string> = {
    primary: "text-primary",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-danger",
    neutral: "text-slate-500",
  };

  return (
    <button
      type="button"
      onClick={() => href && router.push(href)}
      disabled={!href}
      className={cn(
        "animate-in group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4 text-left transition-all",
        href && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      )}
    >
      {/* decorative top accent bar — color comes from the caller's rotating palette */}
      <span
        className="absolute inset-x-0 top-0 h-0.5 opacity-80 transition-all group-hover:h-1 group-hover:opacity-100"
        style={{ background: accent ?? "var(--primary)" }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
            tones[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </div>

      {/* Start → Current ARC journey */}
      {journey ? (
        <div className="-mt-1 border-t border-border pt-2">
          {subLabel && <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{subLabel}</div>}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="tabular-nums text-muted-foreground">{journey.start}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="font-semibold tabular-nums text-emerald-600">{journey.current}</span>
          </div>
        </div>
      ) : (
        sub && (
          <div className="-mt-1 border-t border-border pt-2">
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-semibold tabular-nums",
                subTone
                  ? subTextTones[subTone]
                  : subArrow === "up"
                  ? "text-emerald-600"
                  : subArrow === "down"
                  ? "text-danger"
                  : "text-primary"
              )}
            >
              {subArrow === "up" && <ArrowUp className="h-3.5 w-3.5" />}
              {subArrow === "down" && <ArrowDown className="h-3.5 w-3.5" />}
              {sub}
            </div>
            {subLabel && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{subLabel}</div>}
          </div>
        )
      )}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </button>
  );
}
