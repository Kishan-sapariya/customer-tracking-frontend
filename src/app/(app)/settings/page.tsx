"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Field, Input, Select, Spinner } from "@/components/ui";
import { InlineError } from "@/components/InlineError";
import { useActionError } from "@/lib/useActionError";
import { api, apiData } from "@/lib/api";

// System settings — Master only (FR-7.3, §13.1). The cutoff that decides
// OLD vs NEW, and which date field drives it.
export default function SettingsPage() {
  const { run, error, loading } = useActionError();
  const [settings, setSettings] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    apiData<Record<string, string>>("/settings").then(setSettings);
  }, []);

  if (!settings) return <div className="flex justify-center py-24"><Spinner /></div>;

  const set = (k: string, v: string) => setSettings((p) => ({ ...(p as object), [k]: v }));
  const save = () =>
    run(() => api("/settings", { method: "PUT", body: settings }), { successMessage: "Settings saved" });

  return (
    <div>
      <PageHeader
        title="Settings"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
        description="System-level configuration. Changes apply to new entries and inference."
      />
      <Card className="max-w-xl">
        <div className="flex flex-col gap-4">
          <Field
            label="Fiscal cutoff date"
            hint="Customers on/after this date default to NEW; before it, OLD. Indian FY boundary."
          >
            <Input type="date" value={settings.cutoffDate ?? ""} onChange={(e) => set("cutoffDate", e.target.value)} />
          </Field>
          <Field label="Cutoff is decided by" hint="Which date field classifies a customer (PRD §13.1)">
            <Select value={settings.cutoffField ?? "goLiveDate"} onChange={(e) => set("cutoffField", e.target.value)}>
              <option value="goLiveDate">Go-Live date</option>
              <option value="billDate">Bill date</option>
              <option value="entryDate">Entry date</option>
            </Select>
          </Field>
          <Field label="Default theme">
            <Select value={settings.theme ?? "cyan"} onChange={(e) => set("theme", e.target.value)}>
              <option value="cyan">Cyan / White</option>
              <option value="sky">Light Blue / White</option>
            </Select>
          </Field>
          <InlineError message={error} />
          <div><Button loading={loading} onClick={save}>Save settings</Button></div>
        </div>
      </Card>
    </div>
  );
}
