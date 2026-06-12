"use client";
import { useEffect, useState } from "react";
import {
  Users, Boxes, PackagePlus, Activity, PowerOff, Truck, ReceiptText, IndianRupee, CheckCircle2, HeartPulse,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, ArrowUp, ArrowDown, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, Spinner } from "@/components/ui";
import { apiData } from "@/lib/api";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardCounts } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

interface Money { count: number; amount: number }
interface Commercial { upgrade: Money; downgrade: Money; rateRevision: Money; disconnection: Money }
type Period = "all" | "q1" | "q2" | "q3" | "q4";
interface StatsResponse {
  counts: DashboardCounts;
  arc: { total: number; active: number; old: number; new: number; baseTotal: number; baseOld: number; baseNew: number };
  commercial: Commercial;
  commercialPeriods: Record<Period, Commercial>;
  trend: { month: string; count: number }[];
  oldVsNew: { type: string; count: number }[];
  fy: string;
}

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "q1", label: "Q1" },
  { key: "q2", label: "Q2" },
  { key: "q3", label: "Q3" },
  { key: "q4", label: "Q4" },
];

const compactInr = (v: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function DashboardPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    apiData<StatsResponse>("/stats").then(setData);
  }, []);

  if (!data) {
    return <div className="flex justify-center py-24"><Spinner className="h-6 w-6" /></div>;
  }

  const c = data.counts;
  const arc = data.arc;
  const cm = data.commercial; // all-time, used by the cards/chart below
  // Period-aware waterfall: reverse the selected period's changes out of the
  // live active ARC to get the "Total ARC" anchor, so
  //   Total ARC + upgrades − downgrades − disconnections = Current ARC
  // reconciles for any period.
  const cmP = data.commercialPeriods[period];
  const totalArc = arc.active - cmP.upgrade.amount + cmP.downgrade.amount + cmP.disconnection.amount;
  const netChange = arc.active - totalArc; // = upgrades − downgrades − churn for the period

  // Rate Revision has no ARC impact (bandwidth-only), so it's excluded from the
  // ARC-impact chart — its count is shown on its card.
  const commercialData = [
    { name: "Upgrade", amount: cm.upgrade.amount, count: cm.upgrade.count, fill: "#059669" },
    { name: "Downgrade", amount: cm.downgrade.amount, count: cm.downgrade.count, fill: "#d97706" },
    { name: "Disconnection", amount: cm.disconnection.amount, count: cm.disconnection.count, fill: "#dc2626" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: "Dashboard" }]}
        description={`The customer register at a glance · FY ${data.fy}. Click any card to drill into the list.`}
      />

      {/* Row 1 — counts + ARC */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Customers" value={c.total} icon={Users} href="/customers" tone="primary" subLabel="Total ARC (start → current)" journey={{ start: inr(arc.baseTotal), current: inr(arc.total) }} />
        <StatCard label="Old Customers" value={c.old} icon={Boxes} href="/customers?type=OLD" tone="neutral" subLabel="Old ARC (start → current)" journey={{ start: inr(arc.baseOld), current: inr(arc.old) }} />
        <StatCard label="New Customers" value={c.new} icon={PackagePlus} href="/customers?type=NEW" tone="primary" subLabel="New ARC (start → current)" journey={{ start: inr(arc.baseNew), current: inr(arc.new) }} />
        <StatCard label="Active" value={c.active} icon={Activity} href="/customers?active=true" tone="success" sub={inr(arc.active)} subLabel="Active ARC" subArrow="up" />
        <StatCard label="Deactive" value={c.disconnected} icon={PowerOff} href="/customers?status=DISCONNECTED" tone="danger" sub={inr(cm.disconnection.amount)} subLabel="ARC churned" subArrow="down" />
      </div>

      {/* Current ARC — waterfall: total + upgrades − downgrades − disconnections */}
      <Card className="mt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-primary">
              <IndianRupee className="h-3.5 w-3.5" /> Current ARC · live book
            </div>
            {/* Start ARC → Current ARC journey for the selected period */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Start ARC</div>
                <div className="text-lg font-semibold tabular-nums text-muted-foreground">{inr(totalArc)}</div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Current ARC</div>
                <div className="text-2xl font-semibold tracking-tight tabular-nums">{inr(arc.active)}</div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 self-end rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  netChange >= 0
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400"
                )}
              >
                {netChange >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {inr(Math.abs(netChange))}
              </span>
            </div>
          </div>
          {/* period selector */}
          <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
            {PERIOD_LABELS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  period === p.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* waterfall */}
        <div className="mt-4 flex flex-wrap items-stretch gap-2 text-sm">
          <WaterSeg label="Total ARC" note={`${c.total} customers`} value={inr(totalArc)} />
          <Op>+</Op>
          <WaterSeg label="Upgrades" note={`${cmP.upgrade.count} change${cmP.upgrade.count === 1 ? "" : "s"}`} value={inr(cmP.upgrade.amount)} tone="success" arrow="up" />
          <Op>−</Op>
          <WaterSeg label="Downgrades" note={`${cmP.downgrade.count} change${cmP.downgrade.count === 1 ? "" : "s"}`} value={inr(cmP.downgrade.amount)} tone="warning" arrow="down" />
          <Op>−</Op>
          <WaterSeg label="Disconnections" note={`${cmP.disconnection.count} churned`} value={inr(cmP.disconnection.amount)} tone="danger" arrow="down" />
          <Op>=</Op>
          <WaterSeg label="Current ARC" note={`${c.active} active`} value={inr(arc.active)} tone="primary" highlight />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {period === "all"
            ? "“Total ARC” is the original value of every customer before any plan change."
            : `Showing commercial changes within ${PERIOD_LABELS.find((p) => p.key === period)?.label} of FY ${data.fy}.`}{" "}
          Rate revisions change bandwidth only, so they don&apos;t affect ARC.
        </p>
      </Card>

      {/* Row 2 — commercial changes (count + ARC impact) */}
      <h2 className="mb-3 mt-7 text-sm font-semibold text-muted-foreground">Commercial changes</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upgrades" value={cm.upgrade.count} icon={ArrowUpCircle} href="/changes?action=UPGRADE" tone="success" sub={inr(cm.upgrade.amount)} subLabel="ARC gained" />
        <StatCard label="Downgrades" value={cm.downgrade.count} icon={ArrowDownCircle} href="/changes?action=DOWNGRADE" tone="warning" sub={inr(cm.downgrade.amount)} subLabel="ARC reduced" />
        <StatCard label="Rate Revisions" value={cm.rateRevision.count} icon={RefreshCw} href="/changes?action=RATE_REVISION" tone="primary" hint="Bandwidth change · no ARC impact" />
        <StatCard label="Disconnections" value={cm.disconnection.count} icon={PowerOff} href="/changes?action=DISCONNECTION" tone="danger" sub={inr(cm.disconnection.amount)} subLabel="ARC churned" />
      </div>

      {/* Commercial changes chart */}
      <Card className="mt-4">
        <h3 className="mb-1 text-sm font-semibold">Commercial changes — ARC impact</h3>
        <p className="mb-4 text-xs text-muted-foreground">Monetary impact of each lifecycle action across the register.</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={commercialData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis tickFormatter={compactInr} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={56} />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)" }}
              content={({ active, payload, label }) =>
                active && payload && payload.length ? (
                  <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
                    <div className="font-medium">{label}</div>
                    <div className="text-muted-foreground">{(payload[0].payload as any).count} change(s)</div>
                    <div className="font-semibold text-foreground">{inr((payload[0].payload as any).amount)}</div>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {commercialData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
          {commercialData.map((d) => (
            <span key={d.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
              {d.name} · <span className="font-medium text-foreground">{d.count}</span> · {inr(d.amount)}
            </span>
          ))}
        </div>
      </Card>

      {/* Pipeline counts */}
      <h2 className="mb-3 mt-7 text-sm font-semibold text-muted-foreground">New-customer pipeline</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Delivery Pending" value={c.deliveryPending} icon={Truck} href="/customers?type=NEW&status=DELIVERY_PENDING" tone="warning" />
        <StatCard label="Billing Pending" value={c.billingPending} icon={ReceiptText} href="/customers?type=NEW&status=BILLING_PENDING" tone="warning" />
        <StatCard label="FTB Pending" value={c.ftbPending} icon={IndianRupee} href="/customers?type=NEW&status=FTB_PENDING" tone="warning" />
        <StatCard label="Completed" value={c.completed} icon={CheckCircle2} href="/customers?status=COMPLETED" tone="success" />
      </div>

      {/* Data health + monthly trend */}
      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          label="Data health — missing key fields"
          value={c.dataHealth}
          icon={HeartPulse}
          href="/customers"
          tone={c.dataHealth > 0 ? "danger" : "success"}
          hint={c.dataHealth > 0 ? "Records missing ARC, bandwidth, or contact" : "All records have key fields"}
        />

        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">New customers per month</h3>
          {data.trend.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Old vs New split */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Old vs New split</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.oldVsNew} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {data.oldVsNew.map((entry, i) => (
                  <Cell key={i} fill={entry.type === "NEW" ? "var(--primary)" : "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> New ({c.new})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Old ({c.old})</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// One step in the ARC waterfall — label, amount, and a count note.
function WaterSeg({
  label,
  note,
  value,
  tone = "default",
  highlight,
  arrow,
}: {
  label: string;
  note?: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
  highlight?: boolean;
  arrow?: "up" | "down";
}) {
  const toneColor: Record<string, string> = {
    default: "text-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-danger",
    primary: "text-primary",
  };
  return (
    <div
      className={cn(
        "min-w-[130px] flex-1 rounded-lg border px-3 py-2",
        highlight ? "border-primary/40 bg-primary-subtle/50" : "border-border bg-surface"
      )}
    >
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums", toneColor[tone])}>
        {arrow === "up" && <ArrowUp className="h-3.5 w-3.5" />}
        {arrow === "down" && <ArrowDown className="h-3.5 w-3.5" />}
        {value}
      </div>
      {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
    </div>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center px-0.5 text-lg font-medium text-muted-foreground">{children}</div>;
}
