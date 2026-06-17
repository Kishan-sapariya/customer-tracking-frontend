"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle,
  Building2, TrendingUp,
} from "lucide-react";
import { Input, Select, Spinner, EmptyState, Button } from "./ui";
import { StatusBadge, TypeBadge, ActiveBadge } from "./Badges";
import { ActionMenu } from "./ActionMenu";
import { PipelineActions } from "./PipelineActions";
import { ExportButton } from "./ExportButton";
import { apiList } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { Amount } from "./Amount";
import { cn } from "@/lib/utils";
import { customerExportColumns, customerDetailedColumns } from "@/lib/customerColumns";
import { useAuth, can } from "@/lib/stores";
import type { Customer, Pagination } from "@/lib/types";

export interface CustomerFilters {
  type?: "OLD" | "NEW";
  status?: string;
  active?: "true" | "false";
  needsReview?: "true" | "false";
  sam?: string;
}

function bandwidthMbps(bw?: string | null): number | null {
  if (!bw) return null;
  const m = String(bw).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// The reusable customer DataTable (FR-4.1/4.2). Used on the main list and inside
// every stat-card drill-down. `locked` filters are always applied (e.g. the
// Old-customers tab); `initial` seeds the user-adjustable filters from the URL.
export function CustomerTable({
  locked = {},
  initial = {},
  fileLabel = "Customers",
  showActions = true,
}: {
  locked?: CustomerFilters;
  initial?: CustomerFilters & { search?: string };
  fileLabel?: string;
  showActions?: boolean;
}) {
  const router = useRouter();
  const role = useAuth((s) => s.user?.role);
  const caps = can(role);

  const [search, setSearch] = useState(initial.search ?? "");
  const [debounced, setDebounced] = useState(search);
  const [type, setType] = useState(initial.type ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [active, setActive] = useState(initial.active ?? "");
  const [sam, setSam] = useState(initial.sam ?? "");
  const [samOptions, setSamOptions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailed, setDetailed] = useState(false);

  const [items, setItems] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(
    () => ({
      search: debounced || undefined,
      type: (locked.type ?? type) || undefined,
      status: (locked.status ?? status) || undefined,
      active: (locked.active ?? active) || undefined,
      needsReview: locked.needsReview || undefined,
      sam: (locked.sam ?? sam) || undefined,
      sortBy,
      sortDir,
      page,
      pageSize,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debounced, type, status, active, sam, sortBy, sortDir, page, pageSize, locked.type, locked.status, locked.active, locked.needsReview, locked.sam]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiList<Customer>("/customers", { query });
      setItems(res.items);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced, type, status, active, sam, pageSize]);

  // Load distinct SAM names once for the filter dropdown (skipped when locked).
  useEffect(() => {
    if (locked.sam) return;
    apiList<string>("/customers/sams")
      .then((res) => setSamOptions(res.items ?? []))
      .catch(() => setSamOptions([]));
  }, [locked.sam]);

  const toggleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const fetchAll = async () => {
    const res = await apiList<Customer>("/customers/export", { query: { ...query, page: 1, pageSize: 5000 } });
    return res.items;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, contact, phone, code, username…" className="pl-9" />
        </div>
        {!locked.type && (
          <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto">
            <option value="">All types</option>
            <option value="OLD">Old</option>
            <option value="NEW">New</option>
          </Select>
        )}
        {!locked.status && (
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
            <option value="">All statuses</option>
            <option value="DELIVERY_PENDING">Delivery Pending</option>
            <option value="BILLING_PENDING">Billing Pending</option>
            <option value="FTB_PENDING">FTB Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="DISCONNECTED">Disconnected</option>
          </Select>
        )}
        {!locked.active && (
          <Select value={active} onChange={(e) => setActive(e.target.value)} className="w-auto">
            <option value="">Active & Deactive</option>
            <option value="true">Active only</option>
            <option value="false">Deactive only</option>
          </Select>
        )}
        {!locked.sam && (
          <Select value={sam} onChange={(e) => setSam(e.target.value)} className="w-auto">
            <option value="">All SAMs</option>
            {samOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        )}
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} className="accent-[var(--primary)]" />
          Detailed export
        </label>
        <ExportButton
          currentRows={items}
          fetchAll={fetchAll}
          columns={detailed ? customerDetailedColumns : customerExportColumns}
          fileName={fileLabel.replace(/\s+/g, "_")}
          sheetName={fileLabel}
        />
      </div>

      {/* "Show N entries" */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Show</span>
        <Select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))} className="h-8 w-auto text-xs">
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
        <span>entries</span>
      </div>

      {/* Table (desktop) — scrolls internally with a sticky header. Outer wrapper
          rounds + clips so the scrollbar doesn't expose a white corner. */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="divide-x divide-border text-left text-[11px] uppercase tracking-wide text-muted-foreground [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:border-b [&>th]:border-border [&>th]:bg-surface-muted">
              <Th onClick={() => toggleSort("customerCode")} sorted={sortBy === "customerCode"} dir={sortDir}>Code</Th>
              <Th onClick={() => toggleSort("company")} sorted={sortBy === "company"} dir={sortDir}>Company</Th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">SAM</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <Th onClick={() => toggleSort("arcAmount")} sorted={sortBy === "arcAmount"} dir={sortDir}>ARC</Th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <Th onClick={() => toggleSort("createdAt")} sorted={sortBy === "createdAt"} dir={sortDir}>Created</Th>
              {showActions && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 12 : 11} className="py-16">
                  <div className="flex justify-center"><Spinner /></div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 12 : 11}><EmptyState title="No customers found" hint="Try adjusting your filters or search." /></td>
              </tr>
            ) : (
              items.map((c) => {
                const mbps = bandwidthMbps(c.bandwidth);
                return (
                  <tr key={c.id} className="divide-x divide-border border-b border-border last:border-0 transition-colors hover:bg-surface-muted/40">
                    <td className="cursor-pointer px-4 py-3 font-mono text-xs text-muted-foreground" onClick={() => router.push(`/customers/${c.id}`)}>
                      <span className="inline-flex items-center gap-1">
                        {c.needsReview && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        {c.customerCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-400">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <button onClick={() => router.push(`/customers/${c.id}`)} className="text-left font-semibold text-foreground hover:text-primary">
                          {c.company}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.contactName || c.phone ? (
                        <div className="flex flex-col leading-tight">
                          {c.contactName && <span className="text-foreground">{c.contactName}</span>}
                          {c.phone && <span className="text-[11px]">{c.phone}</span>}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.username || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.details?.sam?.samExecutiveName || "—"}</td>
                    <td className="px-4 py-3">
                      {c.bandwidth ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            mbps !== null && mbps < 100
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
                          )}
                        >
                          <TrendingUp className="h-3 w-3" /> {c.bandwidth}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums"><Amount value={c.arcAmount} /></td>
                    <td className="px-4 py-3"><TypeBadge type={c.customerType} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><ActiveBadge active={c.isActive} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(c.createdAt)}</td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <PipelineActions customer={c} onDone={load} compact />
                          {caps.lifecycle && <ActionMenu customer={c} onDone={load} />}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface"><EmptyState title="No customers found" hint="Try adjusting your filters or search." /></div>
        ) : (
          items.map((c) => {
            const mbps = bandwidthMbps(c.bandwidth);
            return (
              <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-400">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => router.push(`/customers/${c.id}`)} className="text-left font-semibold text-foreground">
                      {c.company}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-mono">
                        {c.needsReview && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        {c.customerCode}
                      </span>
                      {c.contactName && <span>· {c.contactName}</span>}
                      {c.phone && <span>· {c.phone}</span>}
                      {c.username && <span className="font-mono">· {c.username}</span>}
                      {c.details?.sam?.samExecutiveName && <span>· SAM: {c.details.sam.samExecutiveName}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <TypeBadge type={c.customerType} />
                  <StatusBadge status={c.status} />
                  <ActiveBadge active={c.isActive} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Plan</div>
                    {c.bandwidth ? (
                      <span
                        className={cn(
                          "mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          mbps !== null && mbps < 100
                            ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
                        )}
                      >
                        <TrendingUp className="h-3 w-3" /> {c.bandwidth}
                      </span>
                    ) : (
                      <div className="text-muted-foreground">—</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">ARC</div>
                    <div className="mt-0.5 font-medium tabular-nums"><Amount value={c.arcAmount} /></div>
                  </div>
                </div>

                {showActions && (caps.lifecycle || c.customerType === "NEW") && (
                  <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-border pt-3">
                    <PipelineActions customer={c} onDone={load} compact />
                    {caps.lifecycle && <ActionMenu customer={c} onDone={load} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Page {pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, onClick, sorted, dir }: { children: React.ReactNode; onClick: () => void; sorted: boolean; dir: "asc" | "desc" }) {
  return (
    <th className="px-4 py-3 font-medium">
      <button onClick={onClick} className="inline-flex items-center gap-1 uppercase hover:text-foreground">
        {children}
        {sorted && (dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}
