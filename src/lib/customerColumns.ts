import type { ExportColumn } from "./excel";
import type { Customer } from "./types";
import { STATUS_LABEL } from "./format";

// Export columns mirror the visible table columns (FR-8.4). The detailed
// toggle flattens key JSON fields for migration/reconciliation.
export const customerExportColumns: ExportColumn<Customer>[] = [
  { header: "Customer Code", accessor: (c) => c.customerCode },
  { header: "Company", accessor: (c) => c.company, width: 26 },
  { header: "Contact", accessor: (c) => c.contactName },
  { header: "Phone", accessor: (c) => c.phone },
  { header: "Email", accessor: (c) => c.email, width: 24 },
  { header: "Username", accessor: (c) => c.username },
  { header: "SAM Executive", accessor: (c) => d(c).sam?.samExecutiveName ?? "" },
  { header: "City", accessor: (c) => c.city },
  { header: "Bandwidth", accessor: (c) => c.bandwidth },
  { header: "ARC (INR)", accessor: (c) => c.arcAmount ?? "" },
  { header: "OTC (INR)", accessor: (c) => c.otcAmount ?? "" },
  { header: "Type", accessor: (c) => c.customerType },
  { header: "Status", accessor: (c) => STATUS_LABEL[c.status] ?? c.status },
  { header: "Active", accessor: (c) => (c.isActive ? "Active" : "Deactive") },
  { header: "Created", accessor: (c) => new Date(c.createdAt).toLocaleDateString("en-IN") },
];

const d = (c: Customer) => c.details ?? {};
// The full, lossless customer export — every captured field. This is what the
// "Export Data" button uses so a download always carries the complete record.
export const customerDetailedColumns: ExportColumn<Customer>[] = [
  ...customerExportColumns,
  // Contact (name parts)
  { header: "First Name", accessor: (c) => d(c).contact?.firstName ?? "" },
  { header: "Last Name", accessor: (c) => d(c).contact?.lastName ?? "" },
  // Identity / financial
  { header: "GST", accessor: (c) => d(c).identity?.gstNumber ?? "" },
  { header: "Legal Name", accessor: (c) => d(c).identity?.legalName ?? "" },
  { header: "PAN", accessor: (c) => d(c).identity?.panNumber ?? "" },
  { header: "TAN", accessor: (c) => d(c).identity?.tanNumber ?? "" },
  // Address
  { header: "State", accessor: (c) => d(c).address?.state ?? "" },
  { header: "Installation Address", accessor: (c) => d(c).address?.installation ?? "", width: 28 },
  { header: "Installation Pincode", accessor: (c) => d(c).address?.installationPincode ?? "" },
  { header: "Billing Address", accessor: (c) => d(c).address?.billing ?? "", width: 28 },
  { header: "Billing Pincode", accessor: (c) => d(c).address?.billingPincode ?? "" },
  // PO & Billing
  { header: "PO Number", accessor: (c) => d(c).billing?.poNumber ?? "" },
  { header: "PO Expiry", accessor: (c) => fmtMaybe(d(c).billing?.poExpiryDate) },
  { header: "Bill Number", accessor: (c) => d(c).billing?.billNumber ?? "" },
  { header: "Bill Date", accessor: (c) => fmtMaybe(d(c).billing?.billDate) },
  { header: "Billing Cycle", accessor: (c) => c.billingCycle ?? d(c).billing?.cycle ?? "" },
  // Migration extras
  { header: "Account Manager", accessor: (c) => d(c).contactPersons?.accountManager ?? "" },
  { header: "Circle", accessor: (c) => d(c).address?.circle ?? "" },
  { header: "Industry Type", accessor: (c) => d(c).service?.industryType ?? "" },
  // Contact persons
  { header: "Tech Incharge Mobile", accessor: (c) => d(c).contactPersons?.techInchargeMobile ?? "" },
  { header: "Tech Incharge Email", accessor: (c) => d(c).contactPersons?.techInchargeEmail ?? "" },
  { header: "Accounts Incharge Mobile", accessor: (c) => d(c).contactPersons?.accountsInchargeMobile ?? "" },
  { header: "Accounts Incharge Email", accessor: (c) => d(c).contactPersons?.accountsInchargeEmail ?? "" },
  { header: "BDM Name", accessor: (c) => d(c).contactPersons?.bdmName ?? "" },
  { header: "Service Manager", accessor: (c) => d(c).contactPersons?.serviceManager ?? "" },
  // Network (SAM is already in the base columns above)
  { header: "Circuit ID", accessor: (c) => d(c).service?.circuitId ?? "" },
  { header: "No. of IPs", accessor: (c) => d(c).service?.numberOfIPs ?? "" },
  { header: "IP Addresses", accessor: (c) => d(c).service?.ipAddresses ?? "", width: 28 },
  // Milestones & lifecycle
  { header: "Go-Live Date", accessor: (c) => fmtMaybe(d(c).lifecycle?.goLiveDate) },
  { header: "FTB Amount", accessor: (c) => c.ftbAmount ?? "" },
  { header: "FTB Date", accessor: (c) => fmtMaybe(c.ftbReceivedDate) },
  { header: "Delivery Date", accessor: (c) => fmtMaybe(c.deliveryDate) },
  { header: "Delivery Notes", accessor: (c) => c.deliveryNotes ?? "", width: 28 },
  { header: "Disconnected At", accessor: (c) => fmtMaybe(c.disconnectedAt) },
  { header: "Disconnect Reason", accessor: (c) => c.disconnectReason ?? "", width: 28 },
  // Misc
  { header: "Needs Review", accessor: (c) => (c.needsReview ? "Yes" : "") },
  { header: "Notes", accessor: (c) => d(c).meta?.notes ?? "", width: 30 },
];

function fmtMaybe(v: unknown): string {
  if (!v) return "";
  const date = new Date(v as string);
  return Number.isNaN(date.getTime()) ? String(v) : date.toLocaleDateString("en-IN");
}
