"use client";
import { useCallback, useEffect, useState } from "react";
import { UserPlus, KeyRound, Power } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Modal, Field, Input, Select, Spinner, EmptyState } from "@/components/ui";
import { InlineError } from "@/components/InlineError";
import { useActionError } from "@/lib/useActionError";
import { api, apiList } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserRecord } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = { ACCOUNTS: "Accounts", DELIVERY: "Delivery", ADMIN: "Admin", MASTER: "Master" };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<UserRecord | null>(null);
  const { run } = useActionError();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiList<UserRecord>("/users");
      setUsers(res.items);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleActive = (u: UserRecord) =>
    run(() => api(`/users/${u.id}`, { method: "PUT", body: { isActive: !u.isActive } }), {
      successMessage: u.isActive ? "User disabled" : "User enabled",
      onSuccess: load,
    });

  return (
    <div>
      <PageHeader
        title="Users"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }]}
        description="Create users, set roles, disable accounts, and reset passwords."
        actions={<Button size="sm" onClick={() => setCreating(true)}><UserPlus className="h-4 w-4" /> New user</Button>}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users yet" hint="Create your first user with “New user”." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="divide-x divide-border border-b border-border bg-surface-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground [&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials = u.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={u.id} className="divide-x divide-border border-b border-border last:border-0 transition-colors hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary">
                          {initials}
                        </span>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-inset ring-border">
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-400"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-red-500")} />
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setResetting(u)}><KeyRound className="h-3.5 w-3.5" /> Reset</Button>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(u)} className={u.isActive ? "text-danger" : "text-emerald-600"}>
                          <Power className="h-3.5 w-3.5" /> {u.isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {creating && <CreateUserModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); }} />}
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}

function CreateUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "ACCOUNTS" });
  const set = (k: string) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = () =>
    run(() => api("/users", { method: "POST", body: f }), { successMessage: "User created", onSuccess: onDone });
  return (
    <Modal open onClose={onClose} title="New user" footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={loading} onClick={submit}>Create</Button></>}>
      <div className="flex flex-col gap-3">
        <Field label="Name" required><Input value={f.name} onChange={set("name")} placeholder="Full name" /></Field>
        <Field label="Email" required><Input type="email" value={f.email} onChange={set("email")} placeholder="user@ill.com" /></Field>
        <Field label="Temporary password" required hint="At least 8 characters"><Input type="text" value={f.password} onChange={set("password")} placeholder="Set a temporary password" /></Field>
        <Field label="Role" required>
          <Select value={f.role} onChange={set("role")}>
            <option value="ACCOUNTS">Accounts</option>
            <option value="DELIVERY">Delivery</option>
            <option value="ADMIN">Admin</option>
            <option value="MASTER">Master</option>
          </Select>
        </Field>
        <InlineError message={error} />
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: UserRecord; onClose: () => void }) {
  const { run, error, loading } = useActionError();
  const [pw, setPw] = useState("");
  const submit = () =>
    run(() => api(`/users/${user.id}/reset-password`, { method: "POST", body: { newPassword: pw } }), {
      successMessage: "Password reset",
      onSuccess: onClose,
    });
  return (
    <Modal open onClose={onClose} title={`Reset password — ${user.name}`} footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={loading} onClick={submit}>Reset</Button></>}>
      <div className="flex flex-col gap-3">
        <Field label="New password" required hint="At least 8 characters"><Input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" /></Field>
        <InlineError message={error} />
      </div>
    </Modal>
  );
}
