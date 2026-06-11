"use client";
import { useEffect, useState } from "react";
import {
  Users, Boxes, PackagePlus, Activity, PowerOff, Truck, ReceiptText, IndianRupee, CheckCircle2, HeartPulse,
  ArrowUpCircle, ArrowDownCircle, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, Spinner } from "@/components/ui";
import { apiData } from "@/lib/api";
import { inr } from "@/lib/format";
import type { DashboardCounts } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

interface Money { count: number; amount: number }
interface StatsResponse {
  counts: DashboardCounts;
  arc: { total: number; active: number; old: number; new: number };
  commercial: { upgrade: Money; downgrade: Money; rateRevision: Money; disconnection: Money };
  trend: { month: string; count: number }[];
  oldVsNew: { type: string; count: number }[];
  fy: string;
}

const compactInr = (v: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function DashboardPage() {
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    apiData<StatsResponse>("/stats").then(setData);
  }, []);

  if (!data) {
    return <div className="flex justify-center py-24"><Spinner className="h-6 w-6" /></div>;
  }

  const c = data.counts;
  const arc = data.arc;
  const cm = data.commercial;

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
        <StatCard label="Total Customers" value={c.total} icon={Users} href="/customers" tone="primary" sub={inr(arc.total)} subLabel="Total ARC" />
        <StatCard label="Old Customers" value={c.old} icon={Boxes} href="/customers?type=OLD" tone="neutral" sub={inr(arc.old)} subLabel="Old ARC" />
        <StatCard label="New Customers" value={c.new} icon={PackagePlus} href="/customers?type=NEW" tone="primary" sub={inr(arc.new)} subLabel="New ARC" />
        <StatCard label="Active" value={c.active} icon={Activity} href="/customers?active=true" tone="success" sub={inr(arc.active)} subLabel="Active ARC" />
        <StatCard label="Deactive" value={c.disconnected} icon={PowerOff} href="/customers?status=DISCONNECTED" tone="danger" sub={inr(cm.disconnection.amount)} subLabel="ARC churned" />
      </div>

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
