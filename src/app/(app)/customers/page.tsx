"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CustomerTable, type CustomerFilters } from "@/components/CustomerTable";
import { Spinner } from "@/components/ui";

function CustomersInner() {
  const sp = useSearchParams();
  const initial: CustomerFilters & { search?: string } = {
    type: (sp.get("type") as "OLD" | "NEW") || undefined,
    status: sp.get("status") || undefined,
    active: (sp.get("active") as "true" | "false") || undefined,
    sam: sp.get("sam") || undefined,
    search: sp.get("search") || undefined,
  };

  // Human label reflecting the deep-linked filter (also used as export sheet name).
  const parts = [
    initial.type === "OLD" ? "Old" : initial.type === "NEW" ? "New" : null,
    initial.active === "true" ? "Active" : initial.active === "false" ? "Deactive" : null,
    initial.status ? initial.status.replace(/_/g, " ").toLowerCase() : null,
  ].filter(Boolean);
  const label = parts.length ? `Customers · ${parts.join(" · ")}` : "All Customers";

  return (
    <div>
      <PageHeader
        title="Customers"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Customers" }]}
        description="The full ILL customer register. Search, filter, sort, act, and export."
      />
      <CustomerTable initial={initial} fileLabel={label} />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
      <CustomersInner />
    </Suspense>
  );
}
