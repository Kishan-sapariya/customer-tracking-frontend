"use client";
import { useToasts } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const styles = {
  success: "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  error: "border-danger/30 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  info: "border-primary/30 bg-primary-subtle text-primary",
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn("animate-in flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm shadow-lg", styles[t.type])}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="max-w-xs">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
