"use client";
import { useCallback, useEffect, useState } from "react";
import { UserPlus, KeyRound, Power } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, Button, Modal, Field, Input, Select, Spinner, EmptyState } from "@/components/ui";
import { InlineError } from "@/components/InlineError";
import { useActionError } from "@/lib/useActionError";
import { api, apiList } from "@/lib/api";
import { fmtDate } from "@/lib/format";
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

      <Card className="p-0">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-2.5">
                    <span className={u.isActive ? "text-emerald-600" : "text-danger"}>{u.isActive ? "Active" : "Disabled"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setResetting(u)}><KeyRound className="h-3.5 w-3.5" /> Reset</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(u)} className={u.isActive ? "text-danger" : "text-emerald-600"}>
                        <Power className="h-3.5 w-3.5" /> {u.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

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
