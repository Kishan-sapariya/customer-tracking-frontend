"use client";
import { AlertCircle } from "lucide-react";

// Human-readable error right next to the action (ported from CRM, PRD §9.1).
export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger dark:bg-red-950/30">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
