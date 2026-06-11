"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, ArrowUpCircle, ArrowDownCircle, RefreshCw, PowerOff, Power } from "lucide-react";
import { Button, Modal, Field, Input, Select, Tooltip } from "./ui";
import { InlineError } from "./InlineError";
import { useActionError } from "@/lib/useActionError";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import type { Customer } from "@/lib/types";

type ActionType = "UPGRADE" | "DOWNGRADE" | "RATE_REVISION" | "DISCONNECTION" | "RECONNECTION";
const MENU_W = 176; // w-44

// Per-row Upgrade / Downgrade / Rate-Revision / Disconnection menu + modals (FR-5).
export function ActionMenu({ customer, onDone }: { customer: Customer; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActionType | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const items: { key: ActionType; label: string; icon: typeof ArrowUpCircle; danger?: boolean; iconColor: string; show: boolean }[] = [
    { key: "UPGRADE", label: "Upgrade", icon: ArrowUpCircle, iconColor: "text-emerald-600", show: customer.isActive },
    { key: "DOWNGRADE", label: "Downgrade", icon: ArrowDownCircle, iconColor: "text-amber-600", show: customer.isActive },
    { key: "RATE_REVISION", label: "Rate Revision", icon: RefreshCw, iconColor: "text-sky-600", show: customer.isActive },
    { key: "DISCONNECTION", label: "Disconnection", icon: PowerOff, danger: true, iconColor: "text-danger", show: customer.isActive },
    { key: "RECONNECTION", label: "Reconnect", icon: Power, iconColor: "text-emerald-600", show: !customer.isActive },
  ];
  const visible = items.filter((i) => i.show);

  // Position the portal menu relative to the trigger, flipping up if needed so
  // it never gets clipped by the table's overflow container.
  const openMenu = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = visible.length * 36 + 8;
    const top = window.innerHeight - r.bottom > menuH + 8 ? r.bottom + 4 : r.top - menuH - 4;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    setCoords({ top, left });
    setOpen(true);
  };

  // Close on outside click, scroll, or resize (a fixed menu would drift on scroll).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <Tooltip label="More actions">
        <Button ref={btnRef} variant="ghost" size="icon" onClick={() => (open ? setOpen(false) : openMenu())} aria-label="Actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </Tooltip>

      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_W }}
            className="z-[60] overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
          >
            {visible.map((i) => (
              <button
                key={i.key}
                onClick={() => {
                  setActive(i.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-surface-muted ${i.danger ? "text-danger" : ""}`}
              >
                <i.icon className={`h-3.5 w-3.5 ${i.iconColor}`} /> {i.label}
              </button>
            ))}
          </div>,
          document.body
        )}

      {active && (
        <ActionModal
          customer={customer}
          action={active}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            onDone();
          }}
        />
      )}
    </>
  );
}

function ActionModal({
  customer,
  action,
  onClose,
  onDone,
}: {
  customer: Customer;
  action: ActionType;
  onClose: () => void;
  onDone: () => void;
}) {
  const { run, error, loading } = useActionError();
  const [bandwidth, setBandwidth] = useState(customer.bandwidth ?? "");
  const [arc, setArc] = useState<string>(customer.arcAmount?.toString() ?? "");
  const [reason, setReason] = useState("");

  const isPlanChange = action === "UPGRADE" || action === "DOWNGRADE" || action === "RATE_REVISION";
  const titles: Record<ActionType, string> = {
    UPGRADE: "Upgrade Plan",
    DOWNGRADE: "Downgrade Plan",
    RATE_REVISION: "Rate Revision",
    DISCONNECTION: "Disconnect Customer",
    RECONNECTION: "Reconnect Customer",
  };

  // Rate Revision changes bandwidth only (ARC unchanged). Upgrade/Downgrade
  // change both bandwidth and ARC.
  const submit = async () => {
    const body: Record<string, unknown> = { action, reason: reason || undefined };
    if (isPlanChange) {
      body.newBandwidth = bandwidth || undefined;
      if (action !== "RATE_REVISION") body.newArcAmount = arc ? Number(arc) : undefined;
    }
    await run(() => api(`/customers/${customer.id}/action`, { method: "POST", body }), {
      successMessage: `${titles[action]} completed`,
      onSuccess: onDone,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={titles[action]}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={loading} onClick={submit} variant={action === "DISCONNECTION" ? "danger" : "primary"}>
            Complete
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-surface-muted p-3 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Current bandwidth</span><span className="font-medium text-foreground">{customer.bandwidth ?? "—"}</span></div>
          <div className="mt-1 flex justify-between"><span>Current ARC</span><span className="font-medium text-foreground">{inr(customer.arcAmount)}</span></div>
        </div>

        {isPlanChange && (
          <Field label="New bandwidth" required={action === "RATE_REVISION"}>
            <Input value={bandwidth} onChange={(e) => setBandwidth(e.target.value)} placeholder="e.g. 200 Mbps" />
          </Field>
        )}
        {isPlanChange && action !== "RATE_REVISION" && (
          <Field label="New ARC (₹)" required>
            <Input type="number" value={arc} onChange={(e) => setArc(e.target.value)} placeholder="e.g. 450000" />
          </Field>
        )}
        {action === "RATE_REVISION" && (
          <p className="text-[11px] text-muted-foreground">Rate revision changes bandwidth only — the ARC stays the same.</p>
        )}
        <Field label={action === "DISCONNECTION" ? "Reason for disconnection" : "Reason / note"}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional note for the history log" />
        </Field>
        {action === "DISCONNECTION" && (
          <p className="text-[11px] text-muted-foreground">
            The customer stays in the register (never deleted) and drops out of active counts.
          </p>
        )}
        <InlineError message={error} />
      </div>
    </Modal>
  );
}
