"use client";
import { useState } from "react";
import { Button, Modal, Field, Input, Select } from "./ui";
import { InlineError } from "./InlineError";
import { useActionError } from "@/lib/useActionError";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";

// Edit customer master (Accounts & Master only) — audit-logged server-side (FR-4.4).
// Full field set mirroring the Add-Customer form.
export function EditCustomerModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const d = customer.details ?? {};
  const cp = d.contactPersons ?? {};
  const [f, setF] = useState<Record<string, string>>({
    customerCode: customer.customerCode,
    company: customer.company,
    name: d.contact?.name ?? customer.contactName ?? "",
    firstName: d.contact?.firstName ?? "",
    lastName: d.contact?.lastName ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    city: customer.city ?? "",
    state: d.address?.state ?? "",
    arcAmount: customer.arcAmount?.toString() ?? "",
    otcAmount: customer.otcAmount?.toString() ?? "",
    gstNumber: d.identity?.gstNumber ?? "",
    legalName: d.identity?.legalName ?? "",
    panNumber: d.identity?.panNumber ?? "",
    tanNumber: d.identity?.tanNumber ?? "",
    installationAddress: d.address?.installation ?? "",
    installationPincode: d.address?.installationPincode ?? "",
    billingAddress: d.address?.billing ?? "",
    billingPincode: d.address?.billingPincode ?? "",
    poNumber: d.billing?.poNumber ?? "",
    billDate: dateInput(d.billing?.billDate),
    billingCycle: customer.billingCycle ?? "MONTHLY",
    techInchargeMobile: cp.techInchargeMobile ?? "",
    techInchargeEmail: cp.techInchargeEmail ?? "",
    accountsInchargeMobile: cp.accountsInchargeMobile ?? "",
    accountsInchargeEmail: cp.accountsInchargeEmail ?? "",
    bdmName: cp.bdmName ?? "",
    serviceManager: cp.serviceManager ?? "",
    bandwidth: customer.bandwidth ?? "",
    numberOfIPs: d.service?.numberOfIPs?.toString() ?? "",
    ipAddresses: d.service?.ipAddresses ?? "",
    circuitId: d.service?.circuitId ?? "",
    username: d.service?.username ?? "",
    samExecutiveName: d.sam?.samExecutiveName ?? "",
    notes: d.meta?.notes ?? "",
  });
  const set = (k: string) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const v = (k: string) => f[k] ?? "";

  const submit = () => {
    const num = (k: string) => (f[k] ? Number(f[k]) : undefined);
    const str = (k: string) => f[k] || undefined;
    const body = {
      customerCode: f.customerCode,
      company: f.company,
      name: str("name"),
      firstName: str("firstName"),
      lastName: str("lastName"),
      phone: str("phone"),
      email: str("email"),
      city: str("city"),
      state: str("state"),
      arcAmount: num("arcAmount"),
      otcAmount: num("otcAmount"),
      gstNumber: str("gstNumber"),
      legalName: str("legalName"),
      panNumber: str("panNumber"),
      tanNumber: str("tanNumber"),
      installationAddress: str("installationAddress"),
      installationPincode: str("installationPincode"),
      billingAddress: str("billingAddress"),
      billingPincode: str("billingPincode"),
      poNumber: str("poNumber"),
      billDate: str("billDate"),
      billingCycle: str("billingCycle"),
      techInchargeMobile: str("techInchargeMobile"),
      techInchargeEmail: str("techInchargeEmail"),
      accountsInchargeMobile: str("accountsInchargeMobile"),
      accountsInchargeEmail: str("accountsInchargeEmail"),
      bdmName: str("bdmName"),
      serviceManager: str("serviceManager"),
      bandwidth: str("bandwidth"),
      numberOfIPs: num("numberOfIPs"),
      ipAddresses: str("ipAddresses"),
      circuitId: str("circuitId"),
      username: str("username"),
      samExecutiveName: str("samExecutiveName"),
      notes: str("notes"),
    };
    run(() => api(`/customers/${customer.id}`, { method: "PUT", body }), {
      successMessage: "Customer updated",
      onSuccess: onDone,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit — ${customer.company}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={submit}>Save changes</Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <Group title="Contact Information">
          <Field label="Company" required><Input value={v("company")} onChange={set("company")} placeholder="e.g. BlueWave Solutions" /></Field>
          <Field label="Name"><Input value={v("name")} onChange={set("name")} placeholder="Full name" /></Field>
          <Field label="First Name"><Input value={v("firstName")} onChange={set("firstName")} placeholder="First name" /></Field>
          <Field label="Last Name"><Input value={v("lastName")} onChange={set("lastName")} placeholder="Last name" /></Field>
          <Field label="Phone"><Input value={v("phone")} onChange={set("phone")} placeholder="Phone number" /></Field>
          <Field label="Email"><Input value={v("email")} onChange={set("email")} placeholder="Email address" /></Field>
          <Field label="City"><Input value={v("city")} onChange={set("city")} placeholder="City" /></Field>
          <Field label="State"><Input value={v("state")} onChange={set("state")} placeholder="State" /></Field>
        </Group>
        <Group title="Financial Details">
          <Field label="ARC (₹)"><Input type="number" value={v("arcAmount")} onChange={set("arcAmount")} placeholder="Annual recurring charge" /></Field>
          <Field label="OTC (₹)"><Input type="number" value={v("otcAmount")} onChange={set("otcAmount")} placeholder="One-time charge" /></Field>
          <Field label="GST"><Input value={v("gstNumber")} onChange={set("gstNumber")} placeholder="e.g. 27ABCDE1234F1Z5" /></Field>
          <Field label="Legal Name"><Input value={v("legalName")} onChange={set("legalName")} placeholder="Legal name as per GST" /></Field>
          <Field label="PAN"><Input value={v("panNumber")} onChange={set("panNumber")} placeholder="e.g. ABCDE1234F" /></Field>
          <Field label="TAN"><Input value={v("tanNumber")} onChange={set("tanNumber")} placeholder="e.g. PUNA12345C" /></Field>
        </Group>
        <Group title="Address Details">
          <Field label="Installation Address"><Input value={v("installationAddress")} onChange={set("installationAddress")} placeholder="Full installation address" /></Field>
          <Field label="Installation Pincode"><Input value={v("installationPincode")} onChange={set("installationPincode")} placeholder="Pincode" /></Field>
          <Field label="Billing Address"><Input value={v("billingAddress")} onChange={set("billingAddress")} placeholder="Full billing address" /></Field>
          <Field label="Billing Pincode"><Input value={v("billingPincode")} onChange={set("billingPincode")} placeholder="Pincode" /></Field>
        </Group>
        <Group title="PO & Billing">
          <Field label="PO Number"><Input value={v("poNumber")} onChange={set("poNumber")} placeholder="Purchase order number" /></Field>
          <Field label="Bill Date" hint="PO expiry = bill date + 1 year"><Input type="date" value={v("billDate")} onChange={set("billDate")} placeholder="dd/mm/yyyy" /></Field>
          <Field label="PO Expiry Date" hint="Auto-computed"><Input type="date" value={computeExpiry(v("billDate"))} disabled readOnly /></Field>
          <Field label="Billing Cycle">
            <Select value={v("billingCycle") || "MONTHLY"} onChange={set("billingCycle")}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="HALF_YEARLY">Half-Yearly</option>
              <option value="YEARLY">Yearly</option>
            </Select>
          </Field>
        </Group>
        <Group title="Contact Persons">
          <Field label="Tech Incharge Mobile"><Input value={v("techInchargeMobile")} onChange={set("techInchargeMobile")} placeholder="Tech incharge phone" /></Field>
          <Field label="Tech Incharge Email"><Input value={v("techInchargeEmail")} onChange={set("techInchargeEmail")} placeholder="Tech incharge email" /></Field>
          <Field label="Accounts Incharge Mobile"><Input value={v("accountsInchargeMobile")} onChange={set("accountsInchargeMobile")} placeholder="Accounts incharge phone" /></Field>
          <Field label="Accounts Incharge Email"><Input value={v("accountsInchargeEmail")} onChange={set("accountsInchargeEmail")} placeholder="Accounts incharge email" /></Field>
          <Field label="BDM Name"><Input value={v("bdmName")} onChange={set("bdmName")} placeholder="BDM name" /></Field>
          <Field label="Service Manager"><Input value={v("serviceManager")} onChange={set("serviceManager")} placeholder="Service manager name" /></Field>
        </Group>
        <Group title="Network & SAM">
          <Field label="Bandwidth (Mbps)"><Input value={v("bandwidth")} onChange={set("bandwidth")} placeholder="e.g. 100 Mbps" /></Field>
          <Field label="Number of IPs"><Input type="number" value={v("numberOfIPs")} onChange={set("numberOfIPs")} placeholder="Number of IPs" /></Field>
          <Field label="IP Addresses"><Input value={v("ipAddresses")} onChange={set("ipAddresses")} placeholder="103.45.67.1, 103.45.67.2" /></Field>
          <Field label="Circuit ID"><Input value={v("circuitId")} onChange={set("circuitId")} placeholder="e.g. CKT-00231" /></Field>
          <Field label="Username"><Input value={v("username")} onChange={set("username")} placeholder="Customer username" /></Field>
          <Field label="SAM Executive Name"><Input value={v("samExecutiveName")} onChange={set("samExecutiveName")} placeholder="SAM executive name" /></Field>
        </Group>
        <Field label="Notes"><Input value={v("notes")} onChange={set("notes")} placeholder="Any additional notes" /></Field>
        <p className="text-[11px] text-muted-foreground">Plan/ARC changes here are audit-logged. For tracked lifecycle changes, prefer the Actions menu.</p>
        <InlineError message={error} />
      </div>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
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

function dateInput(v: unknown): string {
  if (!v) return "";
  const date = new Date(v as string);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
