import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  header: string;
  // value accessor; return string | number | null
  accessor: (row: T) => string | number | null | undefined;
  width?: number;
}

// Generic .xlsx export powering the reusable ExportButton (PRD §5.8/8.2).
// What you see (current filter/sort/columns) is what you export.
export function exportToXlsx<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName = "Data"
) {
  const aoa: (string | number | null)[][] = [
    columns.map((c) => c.header),
    ...rows.map((r) => columns.map((c) => c.accessor(r) ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.max(12, c.header.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

// Parse an uploaded Excel/CSV file into raw row objects keyed by header.
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const first = wb.SheetNames[0];
  const ws = wb.Sheets[first];
  return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
}

// Generate + download the import template with the exact expected columns (FR-2.4).
export const TEMPLATE_COLUMNS = [
  "Customer Code",
  // Contact Information
  "Company Name",
  "Name",
  "First Name",
  "Last Name",
  "Phone",
  "Email",
  "City",
  "State",
  // Financial Details
  "ARC Amount",
  "OTC Amount",
  "GST Number",
  "Legal Name",
  "PAN Number",
  "TAN Number",
  // Address Details
  "Installation Address",
  "Installation Pincode",
  "Billing Address",
  "Billing Pincode",
  // PO & Billing (PO Expiry is auto-computed = Bill Date + 1 year; Bill Date is
  // left blank for new customers — it's filled later in the billing step)
  "PO Number",
  "Bill Date",
  "Billing Cycle",
  // Contact Persons
  "Tech Incharge Mobile",
  "Tech Incharge Email",
  "Accounts Incharge Mobile",
  "Accounts Incharge Email",
  "BDM Name",
  "Service Manager",
  // Network & SAM
  "Bandwidth (Mbps)",
  "No. of IPs",
  "IP Addresses",
  "Circuit ID",
  "Username",
  "SAM Executive Name",
  // Misc
  "Go-Live Date",
  "Notes",
];

export function downloadTemplate(kind: "old" | "new") {
  const example =
    kind === "old"
      ? ["ILL-00101", "Acme Legacy Pvt Ltd", "Ravi Kumar", "Ravi", "Kumar", "9000000001", "ravi@acme.com", "Pune", "Maharashtra",
         360000, 5000, "27ABCDE1234F1Z5", "Acme Legacy Pvt Ltd", "ABCDE1234F", "PUNA12345C",
         "Survey 12, Pune", "411001", "Survey 12, Pune", "411001",
         "PO-2025-001", "2025-08-01", "YEARLY",
         "9000000011", "tech@acme.com", "9000000012", "accounts@acme.com", "Anil Mehta", "Sunil Rao",
         "100 Mbps", 8, "103.45.67.1, 103.45.67.2", "CKT-001", "acme_ill", "Priya Nair",
         "2025-08-01", "Migrated from FY26 sheet"]
      : ["", "Nova New Pvt Ltd", "Sara Shah", "Sara", "Shah", "9000000002", "sara@nova.com", "Mumbai", "Maharashtra",
         600000, 8000, "", "Nova New Pvt Ltd", "", "",
         "Mumbai HQ", "400001", "Mumbai HQ", "400001",
         "PO-2026-101", "", "MONTHLY",
         "9000000021", "tech@nova.com", "9000000022", "accounts@nova.com", "Rohit Sen", "Maya Iyer",
         "200 Mbps", 16, "", "CKT-101", "nova_ill", "Priya Nair",
         "2026-05-01", "Leave delivery/FTB blank — filled via pipeline"];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, example]);
  ws["!cols"] = TEMPLATE_COLUMNS.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind === "old" ? "Old Customers" : "New Customers");
  XLSX.writeFile(wb, `ILL-CTS_${kind}-customers_template.xlsx`);
}
