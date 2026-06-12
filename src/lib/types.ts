// Shared client types mirroring the backend Prisma enums + envelope (PRD §6, §9.2).
export type Role = "ACCOUNTS" | "DELIVERY" | "ADMIN" | "MASTER";
export type CustomerType = "OLD" | "NEW";
export type CustomerStatus =
  | "DELIVERY_PENDING"
  | "BILLING_PENDING"
  | "FTB_PENDING"
  | "COMPLETED"
  | "DISCONNECTED";
export type BillingCycle = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";
export type HistoryAction =
  | "CREATED"
  | "DELIVERY_SET"
  | "BILLING_SET"
  | "FTB_SET"
  | "UPGRADE"
  | "DOWNGRADE"
  | "RATE_REVISION"
  | "DISCONNECTION"
  | "RECONNECTION"
  | "EDIT";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Customer {
  id: string;
  customerCode: string;
  company: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  username: string | null;
  customerType: CustomerType;
  status: CustomerStatus;
  isActive: boolean;
  needsReview: boolean;
  bandwidth: string | null;
  arcAmount: number | null;
  otcAmount: number | null;
  deliveryDate: string | null;
  deliveryNotes: string | null;
  billingCycle: BillingCycle | null;
  billingDetails: Record<string, unknown> | null;
  ftbAmount: number | null;
  ftbReceivedDate: string | null;
  disconnectedAt: string | null;
  disconnectReason: string | null;
  details: Record<string, any>;
  source: "EXCEL" | "SINGLE";
  createdAt: string;
  updatedAt: string;
  history?: HistoryEntry[];
}

export interface HistoryEntry {
  id: string;
  action: HistoryAction;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  reason: string | null;
  createdAt: string;
  performedBy?: { name: string; role: Role };
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DashboardCounts {
  total: number;
  old: number;
  new: number;
  active: number;
  disconnected: number;
  deliveryPending: number;
  billingPending: number;
  ftbPending: number;
  completed: number;
  dataHealth: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
