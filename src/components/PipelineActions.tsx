"use client";
import { useState } from "react";
import { Truck, ReceiptText, IndianRupee } from "lucide-react";
import { Button, Modal, Field, Input, Select, Tooltip } from "./ui";
import { InlineError } from "./InlineError";
import { useActionError } from "@/lib/useActionError";
import { useAuth, can } from "@/lib/stores";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

// Per-step colors for the icon-only pipeline buttons.
const STEP_STYLE: Record<"delivery" | "billing" | "ftb", string> = {
  delivery: "text-sky-600 bg-sky-50 ring-sky-600/20 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-900/50",
  billing: "text-amber-600 bg-amber-50 ring-amber-600/20 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/50",
  ftb: "text-emerald-600 bg-emerald-50 ring-emerald-600/20 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
};

// Inline "advance the pipeline" control — shows the one button that the current
// user/role can act on for this customer's pending state (FR-3.4/3.5/3.6, §12.9).
export function PipelineActions({ customer, onDone, compact }: { customer: Customer; onDone: () => void; compact?: boolean }) {
  const role = useAuth((s) => s.user?.role);
  const caps = can(role);
  const [step, setStep] = useState<null | "delivery" | "billing" | "ftb">(null);

  if (customer.customerType !== "NEW") return null;

  let button: { label: string; icon: typeof Truck; step: "delivery" | "billing" | "ftb"; allowed: boolean } | null = null;
  if (customer.status === "DELIVERY_PENDING")
    button = { label: "Set Delivery", icon: Truck, step: "delivery", allowed: caps.setDelivery };
  else if (customer.status === "BILLING_PENDING")
    button = { label: "Record Billing", icon: ReceiptText, step: "billing", allowed: caps.recordBilling };
  else if (customer.status === "FTB_PENDING")
    button = { label: "Record FTB", icon: IndianRupee, step: "ftb", allowed: caps.recordFtb };

  if (!button || !button.allowed) return null;

  const Icon = button.icon;
  return (
    <>
      {compact ? (
        // Table: icon-only, color-coded, label on hover.
        <Tooltip label={button.label}>
          <button
            type="button"
            aria-label={button.label}
            onClick={() => setStep(button!.step)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              STEP_STYLE[button.step]
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        </Tooltip>
      ) : (
        // Detail-page header: keep the full labeled button.
        <Button size="sm" onClick={() => setStep(button!.step)}>
          <Icon className="h-3.5 w-3.5" /> {button.label}
        </Button>
      )}
      {step === "delivery" && <DeliveryModal customer={customer} onClose={() => setStep(null)} onDone={() => { setStep(null); onDone(); }} />}
      {step === "billing" && <BillingModal customer={customer} onClose={() => setStep(null)} onDone={() => { setStep(null); onDone(); }} />}
      {step === "ftb" && <FtbModal customer={customer} onClose={() => setStep(null)} onDone={() => { setStep(null); onDone(); }} />}
    </>
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

function ModalShell({ title, onClose, onSubmit, loading, error, children }: any) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={onSubmit}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {children}
        <InlineError message={error} />
      </div>
    </Modal>
  );
}

function DeliveryModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const submit = () =>
    run(() => api(`/customers/${customer.id}/delivery`, { method: "POST", body: { deliveryDate: date, deliveryNotes: notes || undefined } }), {
      successMessage: "Delivery recorded — moved to Billing Pending",
      onSuccess: onDone,
    });
  return (
    <ModalShell title={`Set Delivery — ${customer.company}`} onClose={onClose} onSubmit={submit} loading={loading} error={error}>
      <Field label="Delivery date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/yyyy" /></Field>
      <Field label="Delivery notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></Field>
    </ModalShell>
  );
}

function BillingModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const [cycle, setCycle] = useState(customer.billingCycle ?? "YEARLY");
  const [arc, setArc] = useState(customer.arcAmount?.toString() ?? "");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const submit = () =>
    run(
      () =>
        api(`/customers/${customer.id}/billing`, {
          method: "POST",
          body: { billingCycle: cycle, arcAmount: Number(arc), billNumber: billNumber || undefined, billDate: billDate || undefined },
        }),
      { successMessage: "Billing recorded — moved to FTB Pending", onSuccess: onDone }
    );
  return (
    <ModalShell title={`Record Billing — ${customer.company}`} onClose={onClose} onSubmit={submit} loading={loading} error={error}>
      <Field label="Billing cycle" required>
        <Select value={cycle} onChange={(e) => setCycle(e.target.value as any)}>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="HALF_YEARLY">Half-Yearly</option>
          <option value="YEARLY">Yearly</option>
        </Select>
      </Field>
      <Field label="ARC amount (₹)" required><Input type="number" value={arc} onChange={(e) => setArc(e.target.value)} placeholder="Annual recurring charge" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bill number"><Input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="e.g. INV-001" /></Field>
        <Field
          label="Bill date"
          hint={billDate ? `PO expiry → ${computeExpiry(billDate)}` : "Sets PO expiry (+1 year)"}
        >
          <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} placeholder="dd/mm/yyyy" />
        </Field>
      </div>
    </ModalShell>
  );
}

function FtbModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const submit = () =>
    run(() => api(`/customers/${customer.id}/ftb`, { method: "POST", body: { ftbAmount: Number(amount), ftbReceivedDate: date } }), {
      successMessage: "FTB recorded — customer Completed 🎉",
      onSuccess: onDone,
    });
  return (
    <ModalShell title={`Record First-Time Billing — ${customer.company}`} onClose={onClose} onSubmit={submit} loading={loading} error={error}>
      <Field label="FTB amount received (₹)" required><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount received" /></Field>
      <Field label="Received date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/yyyy" /></Field>
    </ModalShell>
  );
}
