"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Users, Boxes, PackagePlus, Activity, PowerOff, Truck, ReceiptText, IndianRupee, CheckCircle2, HeartPulse,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, ArrowUp, ArrowDown, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Amount } from "@/components/Amount";
import { Card } from "@/components/ui";
import { apiData } from "@/lib/api";
import { inr, compactInr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardCounts } from "@/lib/types";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
  AreaChart, Area, BarChart, Bar,
} from "recharts";

interface Money { count: number; amount: number }
interface Commercial { upgrade: Money; downgrade: Money; rateRevision: Money; disconnection: Money }
type Period = "all" | "q1" | "q2" | "q3" | "q4";
interface StatsResponse {
  counts: DashboardCounts;
  arc: { total: number; active: number; old: number; new: number; baseTotal: number; baseOld: number; baseNew: number };
  commercial: Commercial;
  commercialByType: { new: Commercial; old: Commercial };
  commercialPeriods: Record<Period, Commercial>;
  trend: { month: string; count: number }[];
  oldVsNew: { type: string; count: number }[];
  fy: string;
}

const COMM_SERIES = [
  { key: "upgrade", name: "Upgrades", color: "#059669" }, // emerald-600
  { key: "downgrade", name: "Downgrades", color: "#f59e0b" }, // amber-500
  { key: "disconnection", name: "Disconnections", color: "#ef4444" }, // red-500
] as const;

// On-brand chart palette (cyan / sky) so charts read as part of the theme.
const BRAND = { cyan: "#06b6d4", sky: "#38bdf8" } as const;

// Vivid, varied palette for the stat-card top bars. Rotated per card so two
// neighbours never share a color (the icon badge still carries the semantics).
const ACCENTS = ["#3b82f6", "#eab308", "#ef4444", "#22c55e", "#8b5cf6", "#06b6d4"] as const; // blue·yellow·red·green·violet·cyan
const ac = (i: number) => ACCENTS[i % ACCENTS.length];

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "q1", label: "Q1" },
  { key: "q2", label: "Q2" },
  { key: "q3", label: "Q3" },
  { key: "q4", label: "Q4" },
];


export default function DashboardPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    apiData<StatsResponse>("/stats").then(setData);
  }, []);

  if (!data) {
    return <DashboardSkeleton />;
  }

  const c = data.counts;
  const arc = data.arc;
  const cm = data.commercial; // all-time, used by the cards/chart below
  // `arc.total/old/new` are sums across ALL customers (disconnected ones still
  // carry their last ARC). Subtract the churned ARC — total and per-type — so the
  // cards' current values reflect the live book (and Old + New = Total).
  const totalCurrentArc = arc.total - cm.disconnection.amount;
  const oldCurrentArc = arc.old - data.commercialByType.old.disconnection.amount;
  const newCurrentArc = arc.new - data.commercialByType.new.disconnection.amount;
  // Waterfall with a FIXED baseline: the old (legacy) customers' original ARC
  // never changes as new customers are added. New customers show up as their own
  // segment, then the commercial changes:
  //   Old ARC + New ARC + upgrades − downgrades − disconnections = Current ARC
  // For "all time" this equals the live active ARC (baseOld+baseNew = baseTotal,
  // and baseTotal + up − down − churn = active).
  const cmP = data.commercialPeriods[period];
  const oldStartArc = arc.baseOld; // fixed legacy baseline
  const newStartArc = arc.baseNew; // new customers' original ARC
  const currentArc = oldStartArc + newStartArc + cmP.upgrade.amount - cmP.downgrade.amount - cmP.disconnection.amount;
  const netChange = currentArc - oldStartArc; // growth since the legacy book

  // Three ARC-impact lines (upgrades / downgrades / disconnections) across the
  // fiscal quarters. Rate revision is excluded (bandwidth-only, no ARC impact).
  const cp = data.commercialPeriods;
  const quarterChartData = (["q1", "q2", "q3", "q4"] as const).map((q, i) => ({
    quarter: `Q${i + 1}`,
    upgrade: cp[q].upgrade.amount,
    downgrade: cp[q].downgrade.amount,
    disconnection: cp[q].disconnection.amount,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: "Dashboard" }]}
        description="The customer register at a glance. Click any card to drill into the list."
        badge={
          <span className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            FY {data.fy}
          </span>
        }
      />

      {/* Row 1 — counts + ARC */}
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Customers" value={c.total} icon={Users} href="/customers" tone="primary" accent={ac(0)} subLabel="Total ARC (start → current)" journey={{ start: <Amount value={arc.baseTotal} />, current: <Amount value={totalCurrentArc} /> }} />
        <StatCard label="Old Customers" value={c.old} icon={Boxes} href="/customers?type=OLD" tone="neutral" accent={ac(1)} subLabel="Old ARC (start → current)" journey={{ start: <Amount value={arc.baseOld} />, current: <Amount value={oldCurrentArc} /> }} />
        <StatCard label="New Customers" value={c.new} icon={PackagePlus} href="/customers?type=NEW" tone="primary" accent={ac(2)} subLabel="New ARC (start → current)" journey={{ start: <Amount value={arc.baseNew} />, current: <Amount value={newCurrentArc} /> }} />
        <StatCard label="Active" value={c.active} icon={Activity} href="/customers?active=true" tone="success" accent={ac(3)} sub={<Amount value={arc.active} />} subLabel="Active ARC" subArrow="up" />
        <StatCard label="Deactive" value={c.disconnected} icon={PowerOff} href="/customers?status=DISCONNECTED" tone="danger" accent={ac(4)} sub={<Amount value={cm.disconnection.amount} />} subLabel="ARC churned" subArrow="down" />
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
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Old ARC (start)</div>
                <Amount value={oldStartArc} className="text-lg font-semibold text-muted-foreground" />
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Current ARC</div>
                <Amount value={currentArc} className="text-2xl font-semibold tracking-tight" />
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
                <Amount value={Math.abs(netChange)} />
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
          <WaterSeg label="Old ARC" note={`${c.old} old · fixed`} value={<Amount value={oldStartArc} />} />
          <Op>+</Op>
          <WaterSeg label="New ARC" note={`${c.new} new`} value={<Amount value={newStartArc} />} tone="primary" arrow="up" />
          <Op>+</Op>
          <WaterSeg label="Upgrades" note={`${cmP.upgrade.count} change${cmP.upgrade.count === 1 ? "" : "s"}`} value={<Amount value={cmP.upgrade.amount} />} tone="success" arrow="up" />
          <Op>−</Op>
          <WaterSeg label="Downgrades" note={`${cmP.downgrade.count} change${cmP.downgrade.count === 1 ? "" : "s"}`} value={<Amount value={cmP.downgrade.amount} />} tone="warning" arrow="down" />
          <Op>−</Op>
          <WaterSeg label="Disconnections" note={`${cmP.disconnection.count} churned`} value={<Amount value={cmP.disconnection.amount} />} tone="danger" arrow="down" />
          <Op>=</Op>
          <WaterSeg label="Current ARC" note={`${c.active} active`} value={<Amount value={currentArc} />} tone="primary" highlight />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          “Old ARC” is the legacy customers&apos; original book — a fixed baseline that doesn&apos;t change as new customers are added.
          {period !== "all" && ` Commercial changes shown for ${PERIOD_LABELS.find((p) => p.key === period)?.label} of FY ${data.fy}.`}{" "}
          Rate revisions change bandwidth only, so they don&apos;t affect ARC.
        </p>
      </Card>

      {/* Row 2 — commercial changes (count + ARC impact) — all, then split by type */}
      <CommercialRow title="Commercial changes" cm={cm} />
      <CommercialRow title="Commercial changes · New customers" cm={data.commercialByType.new} typeParam="NEW" />
      <CommercialRow title="Commercial changes · Old customers" cm={data.commercialByType.old} typeParam="OLD" />

      {/* Commercial changes (bar) + Old vs New split (pie), side by side */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Commercial changes — grouped bar chart by quarter */}
        <Card>
          <h3 className="mb-1 text-sm font-semibold">Commercial changes — ARC impact by quarter</h3>
          <p className="mb-4 text-xs text-muted-foreground">Upgrade, downgrade and disconnection ARC across FY {data.fy}.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={quarterChartData} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
              <defs>
                {COMM_SERIES.map((s) => (
                  <linearGradient key={s.key} id={`bar-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={compactInr} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={48} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--surface-muted)" }} content={<ChartTooltip format={inr} />} />
              {COMM_SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={`url(#bar-${s.key})`} radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out" />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
            {COMM_SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </Card>

        {/* Old vs New split — donut */}
        <Card className="flex flex-col">
          <h3 className="mb-1 text-sm font-semibold">Old vs New split</h3>
          <p className="mb-4 text-xs text-muted-foreground">Customer mix across the register.</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.oldVsNew} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="var(--surface)" strokeWidth={3} animationDuration={800} animationEasing="ease-out">
                {data.oldVsNew.map((entry, i) => (
                  <Cell key={i} fill={entry.type === "NEW" ? BRAND.cyan : BRAND.sky} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND.cyan }} /> New ({c.new})</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND.sky }} /> Old ({c.old})</span>
          </div>
        </Card>
      </div>

      {/* Pipeline counts */}
      <SectionHeading>New-customer pipeline</SectionHeading>
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Delivery Pending" value={c.deliveryPending} icon={Truck} href="/customers?type=NEW&status=DELIVERY_PENDING" tone="warning" accent={ac(1)} />
        <StatCard label="Billing Pending" value={c.billingPending} icon={ReceiptText} href="/customers?type=NEW&status=BILLING_PENDING" tone="warning" accent={ac(2)} />
        <StatCard label="FTB Pending" value={c.ftbPending} icon={IndianRupee} href="/customers?type=NEW&status=FTB_PENDING" tone="warning" accent={ac(3)} />
        <StatCard label="Completed" value={c.completed} icon={CheckCircle2} href="/customers?type=NEW&status=COMPLETED" tone="success" accent={ac(4)} />
      </div>

      {/* Data health + monthly trend */}
      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          label="Data health — missing key fields"
          value={c.dataHealth}
          icon={HeartPulse}
          href="/customers"
          tone={c.dataHealth > 0 ? "danger" : "success"}
          accent={ac(0)}
          hint={c.dataHealth > 0 ? "Records missing ARC, bandwidth, or contact" : "All records have key fields"}
        />

        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">New customers per month</h3>
          {data.trend.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND.cyan} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={BRAND.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="New customers"
                  stroke={BRAND.cyan}
                  strokeWidth={2.5}
                  fill="url(#trendFill)"
                  dot={{ r: 3, fill: BRAND.cyan, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
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
  value: ReactNode;
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

// A row of the four commercial-change stat cards. Cards link to the changes
// list, optionally scoped to a customer type (New/Old) via ?type=.
function CommercialRow({ title, cm, typeParam }: { title: string; cm: Commercial; typeParam?: "NEW" | "OLD" }) {
  const t = typeParam ? `&type=${typeParam}` : "";
  return (
    <>
      <SectionHeading>{title}</SectionHeading>
      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upgrades" value={cm.upgrade.count} icon={ArrowUpCircle} href={`/changes?action=UPGRADE${t}`} tone="success" accent={ac(2)} sub={<Amount value={cm.upgrade.amount} />} subLabel="ARC gained" subTone="success" />
        <StatCard label="Downgrades" value={cm.downgrade.count} icon={ArrowDownCircle} href={`/changes?action=DOWNGRADE${t}`} tone="warning" accent={ac(3)} sub={<Amount value={cm.downgrade.amount} />} subLabel="ARC reduced" subTone="warning" />
        <StatCard label="Rate Revisions" value={cm.rateRevision.count} icon={RefreshCw} href={`/changes?action=RATE_REVISION${t}`} tone="primary" accent={ac(4)} hint="Bandwidth change · no ARC impact" />
        <StatCard label="Disconnections" value={cm.disconnection.count} icon={PowerOff} href={`/changes?action=DISCONNECTION${t}`} tone="danger" accent={ac(0)} sub={<Amount value={cm.disconnection.amount} />} subLabel="ARC churned" subTone="danger" />
      </div>
    </>
  );
}

// Accented section heading — a small primary bar before the label.
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <span className="h-3.5 w-1 rounded-full bg-primary" />
      {children}
    </h2>
  );
}

// Shared tooltip for every chart so they look identical (color dot · name · value).
function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; payload?: { fill?: string } }[];
  label?: string | number;
  format?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      {label != null && label !== "" && <div className="mb-1 font-medium text-foreground">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill ?? "var(--primary)" }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {format ? format(Number(p.value)) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Shimmering skeleton shown while the dashboard stats load — mirrors the layout.
function DashboardSkeleton() {
  return (
    <div className="animate-in">
      <div className="mb-6 border-b border-border pb-4">
        <div className="skeleton mb-2 h-3 w-24 rounded" />
        <div className="skeleton h-7 w-44 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton mt-4 h-44 rounded-xl" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="skeleton h-80 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  );
}
