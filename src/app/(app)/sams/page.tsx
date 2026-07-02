"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCog, Users, Activity, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Input, Spinner, EmptyState } from "@/components/ui";
import { ExportButton } from "@/components/ExportButton";
import { Amount } from "@/components/Amount";
import { apiList } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/excel";

// One row per SAM Executive — how many customers they hold and the ARC on them.
interface SamRow {
  sam: string;
  customers: number;
  active: number;
  arc: number;
  activeArc: number;
}

const exportColumns: ExportColumn<SamRow>[] = [
  { header: "SAM Executive", accessor: (r) => r.sam, width: 26 },
  { header: "Customers", accessor: (r) => r.customers },
  { header: "Active", accessor: (r) => r.active },
  { header: "Total ARC (INR)", accessor: (r) => r.arc },
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
        (acc, r) => ({ customers: acc.customers + r.customers, arc: acc.arc + r.arc }),
        { customers: 0, arc: 0 }
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
        <div className="mb-4 grid grid-cols-3 gap-3">
          <SummaryTile label="SAMs" value={String(filtered.length)} icon={UserCog} />
          <SummaryTile label="Customers" value={totals.customers.toLocaleString("en-IN")} icon={Users} />
          <SummaryTile label="Total ARC" value={<Amount value={totals.arc} />} icon={Activity} />
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
                <th className="px-4 py-3 text-right font-medium">Total ARC</th>
                <th className="px-4 py-3 text-right font-medium">Active ARC</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16"><div className="flex justify-center"><Spinner /></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><EmptyState title="No SAMs found" hint="No customers have a SAM executive assigned yet." /></td></tr>
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
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{r.customers.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.active.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right tabular-nums"><Amount value={r.arc} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600"><Amount value={r.activeArc} /></td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></td>
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
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Customers</div>
                  <div className="font-medium tabular-nums">{r.customers.toLocaleString("en-IN")} <span className="text-[11px] text-muted-foreground">({r.active} active)</span></div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total ARC</div>
                  <div className="font-medium tabular-nums"><Amount value={r.arc} /></div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: typeof UserCog }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-surface p-4")}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}
