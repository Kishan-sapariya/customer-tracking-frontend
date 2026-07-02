"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, PowerOff, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Input, Select, Spinner, EmptyState, Button, Modal, Field } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { InlineError } from "@/components/InlineError";
import { apiList, api } from "@/lib/api";
import { useActionError } from "@/lib/useActionError";
import { useAuth, can } from "@/lib/stores";
import { fmtDate, fmtDateTime, ACTION_LABEL } from "@/lib/format";
import { Amount } from "@/components/Amount";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Action = "UPGRADE" | "DOWNGRADE" | "RATE_REVISION" | "DISCONNECTION";
type DateRange = "all" | "last_month" | "custom";
const RANGE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom" },
];

// Resolve a preset (or custom from/to) into an ISO date window for the API.
// "Last month" = the previous calendar month.
function resolveRange(range: DateRange, from: string, to: string): { dateFrom?: string; dateTo?: string } {
  if (range === "last_month") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // last day of prev month
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (range === "custom") {
    return {
      dateFrom: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      dateTo: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
    };
  }
  return {};
}

interface ChangesSummary { count: number; gained: number; reduced: number; churned: number; netArc: number }

interface ChangeRow {
  id: string;
  action: Action;
  oldValues: { arcAmount?: number; bandwidth?: string } | null;
  newValues: { arcAmount?: number; bandwidth?: string; effectiveDate?: string; mailReceivedDate?: string } | null;
  reason: string | null;
  createdAt: string;
  customer: { id: string; customerCode: string; company: string; arcAmount: number | null; details?: { service?: { circuitId?: string } } };
  performedBy: { name: string; role: string } | null;
}

const ACTION_STYLE: Record<Action, { color: string; icon: typeof ArrowUpCircle }> = {
  UPGRADE: { color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400", icon: ArrowUpCircle },
  DOWNGRADE: { color: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400", icon: ArrowDownCircle },
  RATE_REVISION: { color: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-400", icon: RefreshCw },
  DISCONNECTION: { color: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400", icon: PowerOff },
};

// Format a date as YYYY-MM-DD (the importer's expected format), using local
// date parts so the day doesn't shift across time zones.
function isoDate(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Commercial-changes export. The first block mirrors the importer template's
// columns (so an export round-trips back through the importer); the rest are
// extra human-friendly context. The importer keys customers on Circuit ID.
const exportColumns = [
  // ── Importer-compulsory columns (must always be present) ──
  { header: "Circuit ID", accessor: (r: ChangeRow) => r.customer.details?.service?.circuitId ?? "" },
  { header: "Change Type", accessor: (r: ChangeRow) => r.action }, // raw enum so it re-imports
  { header: "New ARC", accessor: (r: ChangeRow) => r.newValues?.arcAmount ?? "" },
  { header: "New Bandwidth", accessor: (r: ChangeRow) => r.newValues?.bandwidth ?? "" },
  { header: "Effective Date", accessor: (r: ChangeRow) => isoDate(r.newValues?.effectiveDate) },
  { header: "Mail Received Date", accessor: (r: ChangeRow) => isoDate(r.newValues?.mailReceivedDate) },
  { header: "Disconnection Reason", accessor: (r: ChangeRow) => (r.action === "DISCONNECTION" ? r.reason ?? "" : "") },
  { header: "Reason", accessor: (r: ChangeRow) => (r.action === "DISCONNECTION" ? "" : r.reason ?? ""), width: 30 },
  // ── Extra context columns ──
  { header: "Customer Code", accessor: (r: ChangeRow) => r.customer.customerCode },
  { header: "Company", accessor: (r: ChangeRow) => r.customer.company, width: 26 },
  { header: "Old ARC", accessor: (r: ChangeRow) => r.oldValues?.arcAmount ?? "" },
  { header: "ARC Difference", accessor: (r: ChangeRow) => { const d = arcDiff(r); return d ? (d.dir === "up" ? d.amount : -d.amount) : ""; } },
  { header: "Old Bandwidth", accessor: (r: ChangeRow) => r.oldValues?.bandwidth ?? "" },
  { header: "Recorded At", accessor: (r: ChangeRow) => fmtDateTime(r.createdAt) },
  { header: "By", accessor: (r: ChangeRow) => r.performedBy?.name ?? "" },
];

// ARC change for an upgrade/downgrade (null for other actions or no change).
function arcDiff(row: ChangeRow): { amount: number; dir: "up" | "down" } | null {
  if (row.action !== "UPGRADE" && row.action !== "DOWNGRADE") return null;
  const oldArc = row.oldValues?.arcAmount;
  const newArc = row.newValues?.arcAmount;
  if (oldArc === undefined || newArc === undefined) return null;
  const diff = newArc - oldArc;
  if (diff === 0) return null;
  return { amount: Math.abs(diff), dir: diff > 0 ? "up" : "down" };
}

function ChangesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialAction = (sp.get("action") as Action) || "";
  const initialType = (sp.get("type") as "OLD" | "NEW") || "";

  const [action, setAction] = useState<string>(initialAction);
  const [type, setType] = useState<string>(initialType);
  const [range, setRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const { dateFrom, dateTo } = useMemo(
    () => resolveRange(range, customFrom, customTo),
    [range, customFrom, customTo]
  );
  const [items, setItems] = useState<ChangeRow[]>([]);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number; page: number; pageSize: number } | null>(null);
  const [summary, setSummary] = useState<ChangesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChangeRow | null>(null);
  const [deleting, setDeleting] = useState<ChangeRow | null>(null);

  const caps = can(useAuth((s) => s.user?.role));
  const canAct = caps.lifecycle || caps.deleteChanges;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ items: ChangeRow[]; pagination: typeof pagination; summary: ChangesSummary }>(
        "/changes",
        { query: { action: action || undefined, type: type || undefined, dateFrom, dateTo, page, pageSize } }
      );
      setItems(res.items);
      setPagination(res.pagination);
      setSummary(res.summary);
    } finally {
      setLoading(false);
    }
  }, [action, type, dateFrom, dateTo, page, pageSize]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [action, type, dateFrom, dateTo]);

  const fetchAll = async () => {
    const res = await apiList<ChangeRow>("/changes", { query: { action: action || undefined, type: type || undefined, dateFrom, dateTo, page: 1, pageSize: 5000 } });
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto">
          <option value="">All changes</option>
          <option value="UPGRADE">Upgrades</option>
          <option value="DOWNGRADE">Downgrades</option>
          <option value="RATE_REVISION">Rate Revisions</option>
          <option value="DISCONNECTION">Disconnections</option>
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto">
          <option value="">All customers</option>
          <option value="NEW">New</option>
          <option value="OLD">Old</option>
        </Select>
        <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setRange(o.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                range === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <>
            <Input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="w-auto" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="w-auto" />
          </>
        )}
      </div>

      {summary && summary.count > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/40 p-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total changes</div>
            <div className="text-2xl font-semibold tabular-nums">{summary.count}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Net ARC impact</div>
            <div className={cn("flex items-center justify-end gap-1 text-2xl font-semibold tabular-nums", summary.netArc >= 0 ? "text-emerald-600" : "text-danger")}>
              {summary.netArc >= 0 ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
              <Amount value={Math.abs(summary.netArc)} />
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              +<Amount value={summary.gained} /> gained · −<Amount value={summary.reduced} /> reduced · −<Amount value={summary.churned} /> churned
            </div>
          </div>
        </div>
      )}

      {/* Table (desktop) — scrolls internally with a sticky header */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="divide-x divide-border text-left text-[11px] uppercase tracking-wide text-muted-foreground [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:border-b [&>th]:border-border [&>th]:bg-surface-muted">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Difference</th>
              <th className="px-4 py-3 font-medium">By</th>
              {canAct && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canAct ? 7 : 6} className="py-16"><div className="flex justify-center"><Spinner /></div></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={canAct ? 7 : 6}><EmptyState title="No commercial changes yet" hint="Upgrades, downgrades, rate revisions and disconnections will appear here." /></td></tr>
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
                    <td className="px-4 py-3"><ArcDiff row={r} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.performedBy ? <>{r.performedBy.name}<div className="text-[10px]">{r.performedBy.role}</div></> : "—"}
                    </td>
                    {canAct && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {caps.lifecycle && (
                            <button onClick={() => setEditing(r)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary" title="Edit change">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {caps.deleteChanges && (
                            <button onClick={() => setDeleting(r)} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-danger" title="Delete change">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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
                <div className="mt-3 flex items-start justify-between gap-2 text-xs">
                  <ChangeDetail row={r} />
                  <ArcDiff row={r} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span>{fmtDateTime(r.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {r.performedBy && <span>by {r.performedBy.name} · {r.performedBy.role}</span>}
                    {caps.lifecycle && (
                      <button onClick={() => setEditing(r)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-primary hover:bg-surface-muted" title="Edit change">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                    {caps.deleteChanges && (
                      <button onClick={() => setDeleting(r)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-danger hover:bg-surface-muted" title="Delete change">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
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

      {editing && (
        <EditChangeModal
          row={editing}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); load(); }}
        />
      )}

      {deleting && (
        <DeleteChangeModal
          row={deleting}
          onClose={() => setDeleting(null)}
          onDone={() => { setDeleting(null); load(); }}
        />
      )}
    </div>
  );
}

// Confirm + delete a commercial change (Admin & Master). When it's the
// customer's latest change of its kind, the server reverts their live values.
function DeleteChangeModal({ row, onClose, onDone }: { row: ChangeRow; onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const reverts = row.action !== "DISCONNECTION"
    ? "If this is the customer's most recent change, their ARC/bandwidth will revert to the previous values."
    : "If the customer is still disconnected by this change, deleting it will reactivate them.";

  const submit = async () => {
    await run(() => api(`/changes/${row.id}`, { method: "DELETE" }), {
      successMessage: "Change deleted",
      onSuccess: onDone,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete ${ACTION_LABEL[row.action] ?? row.action}?`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="danger" loading={loading} onClick={submit}>Delete</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <div className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Customer</span><span className="font-medium text-foreground">{row.customer.company}</span></div>
          <div className="mt-1 flex justify-between"><span>Recorded</span><span className="font-medium text-foreground">{fmtDateTime(row.createdAt)}</span></div>
        </div>
        <p className="text-muted-foreground">
          This permanently removes the change from the log. {reverts}
        </p>
        <InlineError message={error} />
      </div>
    </Modal>
  );
}

// Edit a recorded commercial change. Fields shown depend on the action type:
// ARC for upgrade/downgrade, bandwidth for upgrade/downgrade/rate-revision,
// and dates + reason for all. Saving syncs the customer's live values when this
// is their most recent change (handled server-side).
function EditChangeModal({ row, onClose, onDone }: { row: ChangeRow; onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const isArc = row.action === "UPGRADE" || row.action === "DOWNGRADE";
  const isBw = row.action === "UPGRADE" || row.action === "DOWNGRADE" || row.action === "RATE_REVISION";

  const [bandwidth, setBandwidth] = useState(row.newValues?.bandwidth ?? "");
  const [arc, setArc] = useState(row.newValues?.arcAmount?.toString() ?? "");
  const [effectiveDate, setEffectiveDate] = useState(isoDate(row.newValues?.effectiveDate));
  const [mailReceivedDate, setMailReceivedDate] = useState(isoDate(row.newValues?.mailReceivedDate));
  const [reason, setReason] = useState(row.reason ?? "");

  const submit = async () => {
    const body: Record<string, unknown> = {
      effectiveDate: effectiveDate || undefined,
      mailReceivedDate: mailReceivedDate || undefined,
      reason,
    };
    if (isBw) body.newBandwidth = bandwidth || undefined;
    if (isArc) body.newArcAmount = arc ? Number(arc) : undefined;
    await run(() => api(`/changes/${row.id}`, { method: "PATCH", body }), {
      successMessage: "Change updated",
      onSuccess: onDone,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${ACTION_LABEL[row.action] ?? row.action}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={submit}>Save changes</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Customer</span><span className="font-medium text-foreground">{row.customer.company}</span></div>
          <div className="mt-1 flex justify-between"><span>Recorded</span><span className="font-medium text-foreground">{fmtDateTime(row.createdAt)}</span></div>
        </div>
        {isBw && (
          <Field label="New bandwidth">
            <Input value={bandwidth} onChange={(e) => setBandwidth(e.target.value)} placeholder="e.g. 200 Mbps" />
          </Field>
        )}
        {isArc && (
          <Field label="New ARC (₹)">
            <Input type="number" value={arc} onChange={(e) => setArc(e.target.value)} placeholder="e.g. 450000" />
          </Field>
        )}
        <Field label={row.action === "DISCONNECTION" ? "Disconnection date" : "Effective date"}>
          <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </Field>
        <Field label="Mail received date">
          <Input type="date" value={mailReceivedDate} onChange={(e) => setMailReceivedDate(e.target.value)} />
        </Field>
        <Field label={row.action === "DISCONNECTION" ? "Reason for disconnection" : "Reason / note"}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional note for the history log" />
        </Field>
        {isArc && (
          <p className="text-[11px] text-muted-foreground">
            If this is the customer&apos;s most recent change, their current ARC/bandwidth will update too.
          </p>
        )}
        <InlineError message={error} />
      </div>
    </Modal>
  );
}

// ARC difference badge — green +amount for upgrades, red −amount for downgrades.
function ArcDiff({ row }: { row: ChangeRow }) {
  const d = arcDiff(row);
  if (!d) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset",
        d.dir === "up"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400"
      )}
    >
      {d.dir === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {d.dir === "up" ? "+" : "−"}
      <Amount value={d.amount} />
    </span>
  );
}

function ChangeDetail({ row }: { row: ChangeRow }) {
  const oldArc = row.oldValues?.arcAmount;
  const newArc = row.newValues?.arcAmount;
  const oldBw = row.oldValues?.bandwidth;
  const newBw = row.newValues?.bandwidth;
  const eff = row.newValues?.effectiveDate;

  const effLine = eff ? (
    <span className="text-muted-foreground">Effective: <span className="text-foreground">{fmtDate(eff)}</span></span>
  ) : null;

  if (row.action === "DISCONNECTION") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-danger">ARC churned: <Amount value={row.customer.arcAmount} /></span>
        {effLine}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {oldArc !== undefined && newArc !== undefined && oldArc !== newArc && (
        <span>ARC: <span className="text-muted-foreground"><Amount value={oldArc} /></span> → <span className="font-medium text-foreground"><Amount value={newArc} /></span></span>
      )}
      {oldBw && newBw && oldBw !== newBw && (
        <span>BW: <span className="text-muted-foreground">{oldBw}</span> → <span className="font-medium text-foreground">{newBw}</span></span>
      )}
      {effLine}
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
