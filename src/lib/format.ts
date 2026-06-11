// Indian-locale currency + date formatting for ARC/OTC/FTB and milestones.
export function inr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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
