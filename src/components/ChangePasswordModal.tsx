"use client";
import { useState } from "react";
import { Button, Modal, Field, Input } from "./ui";
import { InlineError } from "./InlineError";
import { useActionError } from "@/lib/useActionError";
import { api } from "@/lib/api";

// Self-service change password (FR-1.3). Shared by the sidebar user menu.
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { run, error, loading } = useActionError();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const submit = () =>
    run(() => api("/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } }), {
      successMessage: "Password updated",
      onSuccess: onClose,
    });
  return (
    <Modal
      open
      onClose={onClose}
      title="Change password"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={submit}>Update</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Current password" required><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" /></Field>
        <Field label="New password" required hint="At least 8 characters"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password" /></Field>
        <InlineError message={error} />
      </div>
    </Modal>
  );
}
