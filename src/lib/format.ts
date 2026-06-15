// Indian-locale currency + date formatting for ARC/OTC/FTB and milestones.
export function inr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Indian short notation: ₹1.64 Cr / ₹5.73 L / ₹70 K. Click-to-reveal full
// amount is handled by the <Amount> component.
export function compactInr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const neg = value < 0;
  const v = Math.abs(value);
  const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
  let body: string;
  if (v >= 1e7) body = `${trim(v / 1e7)} Cr`;
  else if (v >= 1e5) body = `${trim(v / 1e5)} L`;
  else if (v >= 1e3) body = `${trim(v / 1e3)} K`;
  else body = String(Math.round(v));
  return `${neg ? "-" : ""}₹${body}`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABEL: Record<string, string> = {
  DELIVERY_PENDING: "Delivery Pending",
  BILLING_PENDING: "Billing Pending",
  FTB_PENDING: "FTB Pending",
  COMPLETED: "Completed",
  DISCONNECTED: "Disconnected",
};

export const ACTION_LABEL: Record<string, string> = {
  CREATED: "Created",
  DELIVERY_SET: "Delivery recorded",
  BILLING_SET: "Billing recorded",
  FTB_SET: "FTB recorded",
  UPGRADE: "Upgraded",
  DOWNGRADE: "Downgraded",
  RATE_REVISION: "Rate revised",
  DISCONNECTION: "Disconnected",
  RECONNECTION: "Reconnected",
  EDIT: "Edited",
};
