"use client";
import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import { Button } from "./ui";
import { exportToXlsx, type ExportColumn } from "@/lib/excel";
import { useToasts } from "@/lib/stores";

// One ExportButton powers every list/drill-down (PRD §5.8 / §8.2).
// Configured by { currentRows, fetchAll, columns, fileName }. Offers
// "current page" vs "all matching filter".
export function ExportButton<T>({
  currentRows,
  fetchAll,
  columns,
  fileName,
  sheetName,
}: {
  currentRows: T[];
  fetchAll?: () => Promise<T[]>;
  columns: ExportColumn<T>[];
  fileName: string;
  sheetName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const push = useToasts((s) => s.push);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const doExport = async (mode: "page" | "all") => {
    setOpen(false);
    try {
      setBusy(true);
      const rows = mode === "all" && fetchAll ? await fetchAll() : currentRows;
      if (rows.length === 0) {
        push("Nothing to export", "info");
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      exportToXlsx(rows, columns, `${fileName}_${date}.xlsx`, sheetName);
      push(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`, "success");
    } catch {
      push("Export failed", "error");
    } finally {
      setBusy(false);
    }
  };

  // No pagination → single-click export.
  if (!fetchAll) {
    return (
      <Button variant="outline" size="sm" loading={busy} onClick={() => doExport("page")}>
        <Download className="h-4 w-4" /> Export Data
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" loading={busy} onClick={() => setOpen((o) => !o)}>
        <Download className="h-4 w-4" /> Export Data <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <button
            className="block w-full px-3 py-2 text-left text-xs hover:bg-surface-muted"
            onClick={() => doExport("page")}
          >
            Export current page
          </button>
          <button
            className="block w-full border-t border-border px-3 py-2 text-left text-xs hover:bg-surface-muted"
            onClick={() => doExport("all")}
          >
            Export all (matching filter)
          </button>
        </div>
      )}
    </div>
  );
}
