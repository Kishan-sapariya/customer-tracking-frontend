"use client";
import { useCallback, useState } from "react";
import { ApiError } from "./api";
import { useToasts } from "./stores";

// Ported from the main CRM (PRD §9.1): runs an async action, captures a
// human-readable error for inline display right next to the button, and also
// fires a toast. Returns { run, error, clearError, loading }.
export function useActionError() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pushToast = useToasts((s) => s.push);

  const run = useCallback(
    async <T>(
      fn: () => Promise<T>,
      opts: { successMessage?: string; onSuccess?: (r: T) => void } = {}
    ): Promise<T | undefined> => {
      setError(null);
      setLoading(true);
      try {
        const result = await fn();
        if (opts.successMessage) pushToast(opts.successMessage, "success");
        opts.onSuccess?.(result);
        return result;
      } catch (e) {
        const message =
          e instanceof ApiError
            ? humanize(e)
            : "Something went wrong. Please try again.";
        setError(message);
        pushToast(message, "error");
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [pushToast]
  );

  return { run, error, clearError: () => setError(null), loading };
}

function humanize(e: ApiError): string {
  // Zod field errors come back as details[] — show the first one plainly.
  if (Array.isArray(e.details) && e.details.length > 0) {
    const first = e.details[0] as { field?: string; message?: string };
    if (first?.message) {
      return first.field ? `${prettyField(first.field)}: ${first.message}` : first.message;
    }
  }
  return e.message;
}

function prettyField(field: string): string {
  const last = field.split(".").pop() ?? field;
  return last
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
