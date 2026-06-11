"use client";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button, Field, Input, Select } from "./ui";
import { InlineError } from "./InlineError";
import { useActionError } from "@/lib/useActionError";
import { api } from "@/lib/api";

// Single-entry form, shared by both tabs (config: old vs new). Mirrors the main
// CRM's Add-Customer field set; validated server-side by the one Zod schema.
export function EntryForm({ kind, onSuccess }: { kind: "old" | "new"; onSuccess: () => void }) {
  const { run, error, loading } = useActionError();
  const [f, setF] = useState<Record<string, string>>({ billingCycle: "MONTHLY" });
  const set = (k: string) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const v = (k: string) => f[k] ?? "";

  // Fill every field with realistic sample data for quick testing. Uses a random
  // suffix so repeated clicks create distinct records. Old gets a bill date;
  // new does not (it's recorded later in the billing step).
  const prefill = () => {
    const n = Math.floor(1000 + Math.random() * 9000);
    const slug = `sample${n}`;
    setF({
      customerCode: "", // auto-generate
      company: `${kind === "old" ? "Legacy" : "Nova"} Test ${n} Pvt Ltd`,
      name: "Test User",
      firstName: "Test",
      lastName: `User ${n}`,
      phone: `90000${n}`,
      email: `${slug}@example.com`,
      city: "Pune",
      state: "Maharashtra",
      arcAmount: String(120000 + n * 10),
      otcAmount: "5000",
      gstNumber: "27ABCDE1234F1Z5",
      legalName: `${kind === "old" ? "Legacy" : "Nova"} Test ${n} Private Limited`,
      panNumber: "ABCDE1234F",
      tanNumber: "PUNA12345C",
      installationAddress: `Plot ${n}, Tech Park, Pune`,
      installationPincode: "411014",
      billingAddress: `Plot ${n}, Tech Park, Pune`,
      billingPincode: "411014",
      poNumber: `PO-${n}`,
      billDate: kind === "old" ? "2025-08-15" : "",
      billingCycle: "YEARLY",
      techInchargeMobile: `91111${n}`,
      techInchargeEmail: `tech.${slug}@example.com`,
      accountsInchargeMobile: `92222${n}`,
      accountsInchargeEmail: `accounts.${slug}@example.com`,
      bdmName: "Anil Mehta",
      serviceManager: "Sunil Rao",
      bandwidth: "100 Mbps",
      numberOfIPs: "8",
      ipAddresses: "103.45.67.1, 103.45.67.2",
      circuitId: `CKT-${n}`,
      username: `${slug}_ill`,
      samExecutiveName: "Priya Nair",
      goLiveDate: kind === "old" ? "2025-08-01" : "2026-05-01",
      notes: "Prefilled test data",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = (k: string) => (f[k] ? Number(f[k]) : undefined);
    const str = (k: string) => f[k] || undefined;
    const body = {
      customerCode: str("customerCode"),
      // Contact
      company: f.company,
      name: str("name"),
      firstName: str("firstName"),
      lastName: str("lastName"),
      phone: str("phone"),
      email: str("email"),
      city: str("city"),
      state: str("state"),
      // Financial
      arcAmount: num("arcAmount"),
      otcAmount: num("otcAmount"),
      gstNumber: str("gstNumber"),
      legalName: str("legalName"),
      panNumber: str("panNumber"),
      tanNumber: str("tanNumber"),
      // Address
      installationAddress: str("installationAddress"),
      installationPincode: str("installationPincode"),
      billingAddress: str("billingAddress"),
      billingPincode: str("billingPincode"),
      // PO & Billing (PO expiry is computed server-side = bill date + 1 year)
      poNumber: str("poNumber"),
      billDate: kind === "old" ? str("billDate") : undefined,
      billingCycle: str("billingCycle"),
      // Contact persons
      techInchargeMobile: str("techInchargeMobile"),
      techInchargeEmail: str("techInchargeEmail"),
      accountsInchargeMobile: str("accountsInchargeMobile"),
      accountsInchargeEmail: str("accountsInchargeEmail"),
      bdmName: str("bdmName"),
      serviceManager: str("serviceManager"),
      // Network & SAM
      bandwidth: str("bandwidth"),
      numberOfIPs: num("numberOfIPs"),
      ipAddresses: str("ipAddresses"),
      circuitId: str("circuitId"),
      username: str("username"),
      samExecutiveName: str("samExecutiveName"),
      // Misc
      goLiveDate: str("goLiveDate"),
      notes: str("notes"),
    };
    const ok = await run(() => api(`/customers/${kind}`, { method: "POST", body }), {
      successMessage: kind === "old" ? "Old customer added (Completed)" : "New customer added to pipeline",
      onSuccess,
    });
    if (ok) setF({ billingCycle: "MONTHLY" });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={prefill}>
          <Wand2 className="h-3.5 w-3.5" /> Prefill test data
        </Button>
      </div>

      <Section title="Contact Information">
        <Field label="Customer Code" hint="Blank → auto (ILL-00001…)"><Input value={v("customerCode")} onChange={set("customerCode")} placeholder="Auto-generate if blank" /></Field>
        <Field label="Company Name" required><Input value={v("company")} onChange={set("company")} placeholder="e.g. BlueWave Solutions" required /></Field>
        <Field label="Name"><Input value={v("name")} onChange={set("name")} placeholder="Full name" /></Field>
        <Field label="First Name"><Input value={v("firstName")} onChange={set("firstName")} placeholder="First name" /></Field>
        <Field label="Last Name"><Input value={v("lastName")} onChange={set("lastName")} placeholder="Last name" /></Field>
        <Field label="Phone"><Input value={v("phone")} onChange={set("phone")} placeholder="Phone number" /></Field>
        <Field label="Email"><Input type="email" value={v("email")} onChange={set("email")} placeholder="Email address" /></Field>
        <Field label="City"><Input value={v("city")} onChange={set("city")} placeholder="City" /></Field>
        <Field label="State"><Input value={v("state")} onChange={set("state")} placeholder="State" /></Field>
      </Section>

      <Section title="Financial Details">
        <Field label="ARC Amount (₹)"><Input type="number" value={v("arcAmount")} onChange={set("arcAmount")} placeholder="Annual recurring charge" /></Field>
        <Field label="OTC Amount (₹)"><Input type="number" value={v("otcAmount")} onChange={set("otcAmount")} placeholder="One-time charge" /></Field>
        <Field label="GST Number"><Input value={v("gstNumber")} onChange={set("gstNumber")} placeholder="e.g. 27ABCDE1234F1Z5" /></Field>
        <Field label="Legal Name"><Input value={v("legalName")} onChange={set("legalName")} placeholder="Legal name as per GST" /></Field>
        <Field label="PAN Number"><Input value={v("panNumber")} onChange={set("panNumber")} placeholder="e.g. ABCDE1234F" /></Field>
        <Field label="TAN Number"><Input value={v("tanNumber")} onChange={set("tanNumber")} placeholder="e.g. PUNA12345C" /></Field>
      </Section>

      <Section title="Address Details">
        <Field label="Installation Address"><Input value={v("installationAddress")} onChange={set("installationAddress")} placeholder="Full installation address" /></Field>
        <Field label="Installation Pincode"><Input value={v("installationPincode")} onChange={set("installationPincode")} placeholder="Pincode" /></Field>
        <Field label="Billing Address"><Input value={v("billingAddress")} onChange={set("billingAddress")} placeholder="Full billing address" /></Field>
        <Field label="Billing Pincode"><Input value={v("billingPincode")} onChange={set("billingPincode")} placeholder="Pincode" /></Field>
      </Section>

      <Section title="PO & Billing">
        <Field label="PO Number"><Input value={v("poNumber")} onChange={set("poNumber")} placeholder="Purchase order number" /></Field>
        {/* Bill Date & PO Expiry only for OLD customers — for NEW they're recorded
            later in the billing step. PO Expiry is always auto-computed. */}
        {kind === "old" && (
          <Field
            label="Bill Date"
            hint={addOneYearLabel(f.billDate)}
          >
            <Input type="date" value={v("billDate")} onChange={set("billDate")} placeholder="dd/mm/yyyy" />
          </Field>
        )}
        {kind === "old" && (
          <Field label="PO Expiry Date" hint="Auto: bill date + 1 year">
            <Input type="date" value={computeExpiry(f.billDate)} disabled readOnly />
          </Field>
        )}
        <Field label="Billing Cycle">
          <Select value={v("billingCycle") || "MONTHLY"} onChange={set("billingCycle")}>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="HALF_YEARLY">Half-Yearly</option>
            <option value="YEARLY">Yearly</option>
          </Select>
        </Field>
        {kind === "new" && (
          <p className="text-[11px] text-muted-foreground sm:col-span-2 lg:col-span-3">
            Bill date and PO expiry are recorded later when billing is processed for this new customer.
          </p>
        )}
      </Section>

      <Section title="Contact Persons">
        <Field label="Tech Incharge Mobile"><Input value={v("techInchargeMobile")} onChange={set("techInchargeMobile")} placeholder="Tech incharge phone" /></Field>
        <Field label="Tech Incharge Email"><Input type="email" value={v("techInchargeEmail")} onChange={set("techInchargeEmail")} placeholder="Tech incharge email" /></Field>
        <Field label="Accounts Incharge Mobile"><Input value={v("accountsInchargeMobile")} onChange={set("accountsInchargeMobile")} placeholder="Accounts incharge phone" /></Field>
        <Field label="Accounts Incharge Email"><Input type="email" value={v("accountsInchargeEmail")} onChange={set("accountsInchargeEmail")} placeholder="Accounts incharge email" /></Field>
        <Field label="BDM Name"><Input value={v("bdmName")} onChange={set("bdmName")} placeholder="BDM name" /></Field>
        <Field label="Service Manager"><Input value={v("serviceManager")} onChange={set("serviceManager")} placeholder="Service manager name" /></Field>
      </Section>

      <Section title="Network & SAM">
        <Field label="Bandwidth (Mbps)"><Input value={v("bandwidth")} onChange={set("bandwidth")} placeholder="e.g. 100 Mbps" /></Field>
        <Field label="Number of IPs"><Input type="number" value={v("numberOfIPs")} onChange={set("numberOfIPs")} placeholder="Number of IPs" /></Field>
        <Field label="IP Addresses" hint="Comma separated"><Input value={v("ipAddresses")} onChange={set("ipAddresses")} placeholder="103.45.67.1, 103.45.67.2" /></Field>
        <Field label="Circuit ID"><Input value={v("circuitId")} onChange={set("circuitId")} placeholder="e.g. CKT-00231" /></Field>
        <Field label="Username"><Input value={v("username")} onChange={set("username")} placeholder="Customer username" /></Field>
        <Field label="SAM Executive Name"><Input value={v("samExecutiveName")} onChange={set("samExecutiveName")} placeholder="SAM executive name" /></Field>
        <Field label="Go-Live Date" hint="Infers Old/New vs cutoff"><Input type="date" value={v("goLiveDate")} onChange={set("goLiveDate")} placeholder="dd/mm/yyyy" /></Field>
      </Section>

      <Field label="Notes"><Input value={v("notes")} onChange={set("notes")} placeholder="Any additional notes" /></Field>

      <InlineError message={error} />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>{kind === "old" ? "Add Old Customer" : "Add New Customer"}</Button>
        <span className="text-xs text-muted-foreground">
          {kind === "old" ? "Marked Completed immediately." : "Enters the Delivery → Billing → FTB pipeline."}
        </span>
      </div>
    </form>
  );
}

// PO expiry = bill date + 1 year (matches the server-side rule).
function computeExpiry(billDate?: string): string {
  if (!billDate) return "";
  const d = new Date(billDate);
  if (Number.isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
function addOneYearLabel(billDate?: string): string {
  const e = computeExpiry(billDate);
  return e ? `PO expiry auto-set to ${e}` : "PO expiry = bill date + 1 year";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}
