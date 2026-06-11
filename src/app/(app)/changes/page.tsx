"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, PowerOff } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Select, Spinner, EmptyState, Button } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { apiList } from "@/lib/api";
import { inr, fmtDateTime, ACTION_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Action = "UPGRADE" | "DOWNGRADE" | "RATE_REVISION" | "DISCONNECTION";

interface ChangeRow {
  id: string;
  action: Action;
  oldValues: { arcAmount?: number; bandwidth?: string } | null;
  newValues: { arcAmount?: number; bandwidth?: string } | null;
  reason: string | null;
  createdAt: string;
  customer: { id: string; customerCode: string; company: string; arcAmount: number | null };
  performedBy: { name: string; role: string } | null;
}

const ACTION_STYLE: Record<Action, { color: string; icon: typeof ArrowUpCircle }> = {
  UPGRADE: { color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400", icon: ArrowUpCircle },
  DOWNGRADE: { color: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400", icon: ArrowDownCircle },
  RATE_REVISION: { color: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400", icon: RefreshCw },
  DISCONNECTION: { color: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400", icon: PowerOff },
};

const exportColumns = [
  { header: "Date", accessor: (r: ChangeRow) => fmtDateTime(r.createdAt) },
  { header: "Customer Code", accessor: (r: ChangeRow) => r.customer.customerCode },
  { header: "Company", accessor: (r: ChangeRow) => r.customer.company, width: 26 },
  { header: "Action", accessor: (r: ChangeRow) => ACTION_LABEL[r.action] ?? r.action },
  { header: "Old ARC", accessor: (r: ChangeRow) => r.oldValues?.arcAmount ?? "" },
  { header: "New ARC", accessor: (r: ChangeRow) => r.newValues?.arcAmount ?? "" },
  { header: "Old Bandwidth", accessor: (r: ChangeRow) => r.oldValues?.bandwidth ?? "" },
  { header: "New Bandwidth", accessor: (r: ChangeRow) => r.newValues?.bandwidth ?? "" },
  { header: "By", accessor: (r: ChangeRow) => r.performedBy?.name ?? "" },
  { header: "Reason", accessor: (r: ChangeRow) => r.reason ?? "" },
];

function ChangesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialAction = (sp.get("action") as Action) || "";

  const [action, setAction] = useState<string>(initialAction);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [items, setItems] = useState<ChangeRow[]>([]);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number; page: number; pageSize: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiList<ChangeRow>("/changes", { query: { action: action || undefined, page, pageSize } });
      setItems(res.items);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [action, page, pageSize]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [action]);

  const fetchAll = async () => {
    const res = await apiList<ChangeRow>("/changes", { query: { action: action || undefined, page: 1, pageSize: 5000 } });
    return res.items;
  };

  return (
    <div>
      <PageHeader
        title="Commercial Changes"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Commercial Changes" }]}
        description="Every upgrade, downgrade, rate revision and disconnection — with old → new values, who made the change, and when."
        actions={
          <ExportButton currentRows={items} fetchAll={fetchAll} columns={exportColumns} fileName="Commercial_Changes" sheetName="Commercial Changes" />
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto">
          <option value="">All changes</option>
          <option value="UPGRADE">Upgrades</option>
          <option value="DOWNGRADE">Downgrades</option>
          <option value="RATE_REVISION">Rate Revisions</option>
          <option value="DISCONNECTION">Disconnections</option>
        </Select>
      </div>

      {/* Table (desktop) — scrolls internally with a sticky header */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-xl border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="divide-x divide-border text-left text-[11px] uppercase tracking-wide text-muted-foreground [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:border-b [&>th]:border-border [&>th]:bg-surface-muted">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">By</th>
              <th className="px-4 py-3 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-16"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No commercial changes yet" hint="Upgrades, downgrades, rate revisions and disconnections will appear here." /></td></tr>
            ) : (
              items.map((r) => {
                const s = ACTION_STYLE[r.action];
                const Icon = s.icon;
                return (
                  <tr key={r.id} className="divide-x divide-border border-b border-border last:border-0 hover:bg-surface-muted/40">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => router.push(`/customers/${r.customer.id}`)} className="text-left hover:text-primary">
                        <div className="font-medium">{r.customer.company}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{r.customer.customerCode}</div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", s.color)}>
                        <Icon className="h-3 w-3" /> {ACTION_LABEL[r.action] ?? r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs"><ChangeDetail row={r} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.performedBy ? <>{r.performedBy.name}<div className="text-[10px]">{r.performedBy.role}</div></> : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.reason || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface"><EmptyState title="No commercial changes yet" hint="Upgrades, downgrades, rate revisions and disconnections will appear here." /></div>
        ) : (
          items.map((r) => {
            const s = ACTION_STYLE[r.action];
            const Icon = s.icon;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => router.push(`/customers/${r.customer.id}`)} className="min-w-0 text-left">
                    <div className="truncate font-semibold">{r.customer.company}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{r.customer.customerCode}</div>
                  </button>
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", s.color)}>
                    <Icon className="h-3 w-3" /> {ACTION_LABEL[r.action] ?? r.action}
                  </span>
                </div>
                <div className="mt-3 text-xs"><ChangeDetail row={r} /></div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span>{fmtDateTime(r.createdAt)}</span>
                  {r.performedBy && <span>by {r.performedBy.name} · {r.performedBy.role}</span>}
                </div>
                {r.reason && <div className="mt-1.5 text-[11px] italic text-muted-foreground">“{r.reason}”</div>}
              </div>
            );
          })
        )}
      </div>

      {pagination && pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-2">Page {pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChangeDetail({ row }: { row: ChangeRow }) {
  const oldArc = row.oldValues?.arcAmount;
  const newArc = row.newValues?.arcAmount;
  const oldBw = row.oldValues?.bandwidth;
  const newBw = row.newValues?.bandwidth;

  if (row.action === "DISCONNECTION") {
    return <span className="text-danger">ARC churned: {inr(row.customer.arcAmount)}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {oldArc !== undefined && newArc !== undefined && oldArc !== newArc && (
        <span>ARC: <span className="text-muted-foreground">{inr(oldArc)}</span> → <span className="font-medium text-foreground">{inr(newArc)}</span></span>
      )}
      {oldBw && newBw && oldBw !== newBw && (
        <span>BW: <span className="text-muted-foreground">{oldBw}</span> → <span className="font-medium text-foreground">{newBw}</span></span>
      )}
    </div>
  );
}

export default function ChangesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
      <ChangesInner />
    </Suspense>
  );
}
