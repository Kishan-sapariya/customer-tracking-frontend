"use client";
import { useState } from "react";
import { FilePlus2, UploadCloud } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Card } from "./ui";
import { EntryForm } from "./EntryForm";
import { ExcelUploader } from "./ExcelUploader";
import { CustomerTable } from "./CustomerTable";
import { cn } from "@/lib/utils";

// Shared ingestion screen for both tabs (config: old vs new). Two entry modes
// in one tab + the filtered list below (FR-2.1 / FR-3.1).
export function IngestionTab({ kind }: { kind: "old" | "new" }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const isOld = kind === "old";
  return (
    <div>
      <PageHeader
        title={isOld ? "Old Customers" : "New Customers"}
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: isOld ? "Old Customers" : "New Customers" }]}
        description={
          isOld
            ? "Legacy customers (on/before the cutoff). No delivery step — marked Completed on entry."
            : "New customers (on/after the cutoff). Enter into the Delivery → Billing → FTB pipeline."
        }
      />

      <Card className="mb-5">
        <div className="mb-4 inline-flex rounded-lg border border-border p-0.5">
          {([
            ["single", "Add single entry", FilePlus2],
            ["bulk", "Bulk Excel upload", UploadCloud],
          ] as const).map(([m, label, Icon]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {mode === "single" ? (
          <EntryForm kind={kind} onSuccess={refresh} />
        ) : (
          <ExcelUploader kind={kind} onDone={refresh} />
        )}
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {isOld ? "Old" : "New"} customers
      </h2>
      <CustomerTable
        key={refreshKey}
        locked={{ type: isOld ? "OLD" : "NEW" }}
        fileLabel={isOld ? "Old_Customers" : "New_Customers"}
      />
    </div>
  );
}
