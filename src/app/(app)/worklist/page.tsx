"use client";
import { PageHeader } from "@/components/PageHeader";
import { CustomerTable } from "@/components/CustomerTable";
import { useAuth, can } from "@/lib/stores";

// Focused "what's outstanding for me" view per role (PRD §12.9). Delivery sees
// only delivery-pending; Accounts sees billing- and FTB-pending.
export default function WorklistPage() {
  const role = useAuth((s) => s.user?.role);
  const caps = can(role);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My Worklist"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Worklist" }]}
        description="Exactly what's pending for your role — act on it without scrolling the full register."
      />

      {caps.setDelivery && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-amber-600">Delivery pending</h2>
          <CustomerTable locked={{ type: "NEW", status: "DELIVERY_PENDING" }} fileLabel="Worklist_Delivery_Pending" />
        </section>
      )}

      {caps.recordBilling && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-amber-600">Billing pending</h2>
          <CustomerTable locked={{ type: "NEW", status: "BILLING_PENDING" }} fileLabel="Worklist_Billing_Pending" />
        </section>
      )}

      {caps.recordFtb && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-amber-600">FTB pending</h2>
          <CustomerTable locked={{ type: "NEW", status: "FTB_PENDING" }} fileLabel="Worklist_FTB_Pending" />
        </section>
      )}
    </div>
  );
}
