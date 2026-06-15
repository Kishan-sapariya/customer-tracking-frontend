"use client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, ArrowRight, type LucideIcon } from "lucide-react";

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
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  hint?: string;
  sub?: string; // a secondary highlighted value (e.g. the ARC figure)
  subLabel?: string; // small caption for the sub value
  subArrow?: "up" | "down"; // directional arrow + color on the sub value
  subTone?: "primary" | "success" | "warning" | "danger" | "neutral"; // color the sub value
  journey?: { start: string; current: string }; // start → current ARC view
}) {
  const router = useRouter();
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary-subtle",
    success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    danger: "text-red-600 bg-red-50 dark:bg-red-950/40",
    neutral: "text-slate-500 bg-slate-100 dark:bg-slate-800",
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
