"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCog, UserCheck, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Input, Spinner, EmptyState } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { StatCard } from "@/components/StatCard";
import { Amount } from "@/components/Amount";
import { apiList } from "@/lib/api";
import { compactInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/excel";

// One row per SAM Executive — customers held, ARC on them, and commercial activity.
interface SamRow {
  sam: string;
  customers: number;
  active: number;
  oldCustomers: number;
  newCustomers: number;
  arc: number;
  oldArc: number;
  newArc: number;
  activeArc: number;
  upgrade: { count: number; amount: number };
  downgrade: { count: number; amount: number };
  rateRevision: { count: number };
  disconnection: { count: number; amount: number };
}

const exportColumns: ExportColumn<SamRow>[] = [
  { header: "SAM Executive", accessor: (r) => r.sam, width: 26 },
  { header: "Customers", accessor: (r) => r.customers },
  { header: "Active", accessor: (r) => r.active },
  { header: "Old Customers", accessor: (r) => r.oldCustomers },
  { header: "New Customers", accessor: (r) => r.newCustomers },
  { header: "Total ARC (INR)", accessor: (r) => r.arc },
  { header: "Old ARC (INR)", accessor: (r) => r.oldArc },
  { header: "New ARC (INR)", accessor: (r) => r.newArc },
  { header: "Upgrades", accessor: (r) => r.upgrade.count },
  { header: "Upgrade ARC (INR)", accessor: (r) => r.upgrade.amount },
  { header: "Downgrades", accessor: (r) => r.downgrade.count },
  { header: "Downgrade ARC (INR)", accessor: (r) => r.downgrade.amount },
  { header: "Rate Revisions", accessor: (r) => r.rateRevision.count },
  { header: "Disconnections", accessor: (r) => r.disconnection.count },
  { header: "Disconnected ARC (INR)", accessor: (r) => r.disconnection.amount },
  { header: "Active ARC (INR)", accessor: (r) => r.activeArc },
];

export default function SamsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiList<SamRow>("/sams")
      .then((res) => setRows(res.items))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.sam.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  // Totals across the (filtered) SAMs.
  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({ active: acc.active + r.active, activeArc: acc.activeArc + r.activeArc }),
        { active: 0, activeArc: 0 }
      ),
    [filtered]
  );

  const go = (sam: string) => router.push(`/customers?sam=${encodeURIComponent(sam)}`);

  return (
    <div>
      <PageHeader
        title="SAM-wise Customers"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "SAM-wise" }]}
        description="Every SAM Executive with the customers linked to them and the ARC they carry. Click a SAM to see their customers."
        actions={<ExportButton currentRows={filtered} columns={exportColumns} fileName="SAM_wise_Customers" sheetName="SAM-wise" />}
      />

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SAM executive…" className="pl-9" />
        </div>
      </div>

      {/* Totals */}
      {!loading && filtered.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="SAMs" value={filtered.length} icon={UserCog} tone="primary" accent="#3b82f6" />
          <StatCard label="Active Customers" value={totals.active} icon={UserCheck} tone="success" accent="#22c55e" />
          <StatCard label="Active ARC" value={compactInr(totals.activeArc)} icon={TrendingUp} tone="primary" accent="#06b6d4" />
        </div>
      )}

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="divide-x divide-border text-left text-[11px] uppercase tracking-wide text-muted-foreground [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:border-b [&>th]:border-border [&>th]:bg-surface-muted">
                <th className="px-4 py-3 font-medium">SAM Executive</th>
                <th className="px-4 py-3 text-right font-medium">Customers</th>
                <th className="px-4 py-3 text-right font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Old</th>
                <th className="px-4 py-3 text-right font-medium">New</th>
                <th className="px-4 py-3 text-right font-medium">Upgrades</th>
                <th className="px-4 py-3 text-right font-medium">Downgrades</th>
                <th className="px-4 py-3 text-right font-medium">Rate Rev.</th>
                <th className="px-4 py-3 text-right font-medium">Disconnections</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-16"><div className="flex justify-center"><Spinner /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState title="No SAMs found" hint="No customers have a SAM executive assigned yet." /></td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.sam} onClick={() => go(r.sam)} className="cursor-pointer divide-x divide-border border-b border-border last:border-0 transition-colors hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                          <UserCog className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-foreground">{r.sam}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><StatCell count={r.customers} amount={r.arc} /></td>
                    <td className="px-4 py-3 text-right"><StatCell count={r.active} amount={r.activeArc} tone="text-emerald-600" /></td>
                    <td className="px-4 py-3 text-right"><StatCell count={r.oldCustomers} amount={r.oldArc} /></td>
                    <td className="px-4 py-3 text-right"><StatCell count={r.newCustomers} amount={r.newArc} /></td>
                    <td className="px-4 py-3 text-right"><ChangeCell count={r.upgrade.count} amount={r.upgrade.amount} tone="text-emerald-600" /></td>
                    <td className="px-4 py-3 text-right"><ChangeCell count={r.downgrade.count} amount={r.downgrade.amount} tone="text-amber-600" /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.rateRevision.count || "—"}</td>
                    <td className="px-4 py-3 text-right"><ChangeCell count={r.disconnection.count} amount={r.disconnection.amount} tone="text-danger" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface"><EmptyState title="No SAMs found" hint="No customers have a SAM executive assigned yet." /></div>
        ) : (
          filtered.map((r) => (
            <button key={r.sam} onClick={() => go(r.sam)} className="rounded-xl border border-border bg-surface p-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <UserCog className="h-4 w-4" />
                </span>
                <span className="font-semibold text-foreground">{r.sam}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <MobileStat label="Customers" count={r.customers} amount={r.arc} />
                <MobileStat label="Active" count={r.active} amount={r.activeArc} tone="text-emerald-600" />
                <MobileStat label="Old" count={r.oldCustomers} amount={r.oldArc} />
                <MobileStat label="New" count={r.newCustomers} amount={r.newArc} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
                <span className="text-emerald-600">↑ {r.upgrade.count} · <Amount value={r.upgrade.amount} /></span>
                <span className="text-amber-600">↓ {r.downgrade.count} · <Amount value={r.downgrade.amount} /></span>
                <span>⟳ {r.rateRevision.count}</span>
                <span className="text-danger">⊗ {r.disconnection.count} · <Amount value={r.disconnection.amount} /></span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// A stat cell: customer count on top, their ARC below (keeps count + ARC in one
// column so the table stays compact).
function StatCell({ count, amount, tone }: { count: number; amount: number; tone?: string }) {
  return (
    <div className="leading-tight">
      <div className="font-medium tabular-nums">{count.toLocaleString("en-IN")}</div>
      <div className={cn("text-[11px] tabular-nums", tone ?? "text-muted-foreground")}><Amount value={amount} /></div>
    </div>
  );
}

// A commercial-change cell: count on top, ARC impact below (— when zero).
function ChangeCell({ count, amount, tone }: { count: number; amount: number; tone: string }) {
  if (!count) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="leading-tight">
      <div className="font-medium tabular-nums">{count}</div>
      <div className={cn("text-[11px] tabular-nums", tone)}><Amount value={amount} /></div>
    </div>
  );
}

// Mobile equivalent: label with count · ARC on one line.
function MobileStat({ label, count, amount, tone }: { label: string; count: number; amount: number; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium tabular-nums">
        {count.toLocaleString("en-IN")}
        <span className={cn("text-[11px] font-normal", tone ?? "text-muted-foreground")}> · <Amount value={amount} /></span>
      </div>
    </div>
  );
}
