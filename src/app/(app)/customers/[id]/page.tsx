"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Pencil, FileJson } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Spinner, Button } from "@/components/ui";
import { StatusBadge, TypeBadge, ActiveBadge } from "@/components/Badges";
import { Amount } from "@/components/Amount";
import { PipelineActions } from "@/components/PipelineActions";
import { ActionMenu } from "@/components/ActionMenu";
import { EditCustomerModal } from "@/components/EditCustomerModal";
import { apiData } from "@/lib/api";
import { fmtDate, fmtDateTime, ACTION_LABEL } from "@/lib/format";
import { useAuth, can } from "@/lib/stores";
import type { Customer } from "@/lib/types";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAuth((s) => s.user?.role);
  const caps = can(role);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const load = useCallback(() => {
    apiData<Customer>(`/customers/${id}`).then(setCustomer);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!customer) return <div className="flex justify-center py-24"><Spinner /></div>;

  const d = customer.details ?? {};
  return (
    <div>
      <PageHeader
        title={customer.company}
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: customer.company },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <PipelineActions customer={customer} onDone={load} compact />
            {caps.writeCustomers && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {caps.lifecycle && <ActionMenu customer={customer} onDone={load} />}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{customer.customerCode}</span>
        <TypeBadge type={customer.customerType} />
        <StatusBadge status={customer.status} />
        <ActiveBadge active={customer.isActive} />
        {customer.needsReview && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
            Needs review
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: details */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <h3 className="mb-3 text-sm font-semibold">Service & Financials</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Bandwidth" value={customer.bandwidth} />
              <Detail label="ARC" value={<Amount value={customer.arcAmount} />} />
              <Detail label="OTC" value={<Amount value={customer.otcAmount} />} />
              <Detail label="Billing cycle" value={customer.billingCycle} />
              <Detail label="No. of IPs" value={d.service?.numberOfIPs} />
              <Detail label="IP Addresses" value={d.service?.ipAddresses} />
              <Detail label="Circuit ID" value={d.service?.circuitId} />
              <Detail label="Username" value={d.service?.username} />
              <Detail label="SAM Executive" value={d.sam?.samExecutiveName} />
              <Detail label="Account Manager" value={d.contactPersons?.accountManager} />
              <Detail label="Circle" value={d.address?.circle} />
              <Detail label="Industry Type" value={d.service?.industryType} />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold">Contact & Identity</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Contact" value={customer.contactName} />
              <Detail label="Phone" value={customer.phone} />
              <Detail label="Email" value={customer.email} />
              <Detail label="Legal name" value={d.identity?.legalName} />
              <Detail label="GST" value={d.identity?.gstNumber} />
              <Detail label="PAN" value={d.identity?.panNumber} />
              <Detail label="TAN" value={d.identity?.tanNumber} />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold">Address</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="City" value={customer.city} />
              <Detail label="State" value={d.address?.state} />
              <Detail label="Installation address" value={d.address?.installation} />
              <Detail label="Installation pincode" value={d.address?.installationPincode} />
              <Detail label="Billing address" value={d.address?.billing} />
              <Detail label="Billing pincode" value={d.address?.billingPincode} />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold">PO & Billing</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="PO number" value={d.billing?.poNumber} />
              <Detail label="PO expiry" value={fmtDate(d.billing?.poExpiryDate)} />
              <Detail label="Bill date" value={fmtDate(d.billing?.billDate)} />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold">Contact Persons</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Tech incharge mobile" value={d.contactPersons?.techInchargeMobile} />
              <Detail label="Tech incharge email" value={d.contactPersons?.techInchargeEmail} />
              <Detail label="Accounts incharge mobile" value={d.contactPersons?.accountsInchargeMobile} />
              <Detail label="Accounts incharge email" value={d.contactPersons?.accountsInchargeEmail} />
              <Detail label="BDM name" value={d.contactPersons?.bdmName} />
              <Detail label="Service manager" value={d.contactPersons?.serviceManager} />
            </dl>
          </Card>

          {customer.customerType === "NEW" && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold">Pipeline milestones</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Detail label="Delivery date" value={fmtDate(customer.deliveryDate)} />
                <Detail label="Delivery notes" value={customer.deliveryNotes} />
                <Detail label="FTB amount" value={<Amount value={customer.ftbAmount} />} />
                <Detail label="FTB received" value={fmtDate(customer.ftbReceivedDate)} />
              </dl>
            </Card>
          )}

          {!customer.isActive && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-danger">Disconnection</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Detail label="Disconnected at" value={fmtDate(customer.disconnectedAt)} />
                <Detail label="Reason" value={customer.disconnectReason} />
              </dl>
            </Card>
          )}

          <Card>
            <button onClick={() => setShowJson((s) => !s)} className="flex items-center gap-2 text-sm font-semibold">
              <FileJson className="h-4 w-4 text-primary" /> Full captured snapshot (JSON) {showJson ? "▾" : "▸"}
            </button>
            {showJson && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-surface-muted p-3 text-[11px] leading-relaxed">
                {JSON.stringify(customer.details, null, 2)}
              </pre>
            )}
          </Card>
        </div>

        {/* Right: lifecycle history timeline (FR-5.2) */}
        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold">Lifecycle history</h3>
          <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
            {(customer.history ?? []).map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-surface" />
                <div className="text-xs font-medium">{ACTION_LABEL[h.action] ?? h.action}</div>
                <div className="text-[11px] text-muted-foreground">
                  {fmtDateTime(h.createdAt)}
                  {h.performedBy && ` · ${h.performedBy.name}`}
                </div>
                {(h.action === "UPGRADE" || h.action === "DOWNGRADE" || h.action === "RATE_REVISION") && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    ARC <Amount value={(h.oldValues as any)?.arcAmount} /> → <span className="text-foreground"><Amount value={(h.newValues as any)?.arcAmount} /></span>
                  </div>
                )}
                {(h.newValues as any)?.effectiveDate && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Effective: <span className="text-foreground">{fmtDate((h.newValues as any).effectiveDate)}</span>
                  </div>
                )}
                {h.reason && <div className="mt-0.5 text-[11px] italic text-muted-foreground">“{h.reason}”</div>}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {editing && <EditCustomerModal customer={customer} onClose={() => setEditing(false)} onDone={() => { setEditing(false); load(); }} />}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-medium">{empty ? "—" : value}</dd>
    </div>
  );
}
