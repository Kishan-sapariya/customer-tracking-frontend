"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, ShieldCheck, Boxes, Workflow, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { InlineError } from "@/components/InlineError";
import { Toaster } from "@/components/Toaster";
import { useActionError } from "@/lib/useActionError";
import { useAuth } from "@/lib/stores";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const DEMO = [
  { label: "Admin", email: "admin@email.com", password: "admin123", role: "Full access" },
  { label: "Accounts", email: "account@email.com", password: "123456", role: "Add / bill / FTB" },
  { label: "Delivery", email: "delivery@email.com", password: "delivery123", role: "Delivery only" },
  { label: "Viewer", email: "viewer@email.com", password: "viewer123", role: "Read-only + users" },
];

const FEATURES = [
  { icon: Boxes, title: "One source of truth", text: "Every ILL customer — old or new, active or disconnected." },
  { icon: Workflow, title: "Onboarding pipeline", text: "Delivery → Billing → First-time billing, tracked end to end." },
  { icon: FileSpreadsheet, title: "Bulk + export", text: "Excel import with validation; export any filtered view." },
  { icon: ShieldCheck, title: "Role-scoped & audited", text: "Accounts, Delivery, Admin, Master — every change logged." },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const { run, error, loading } = useActionError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await run(
      () => api<{ data: { token: string; user: AuthUser } }>("/auth/login", { method: "POST", body: { email, password } }),
      {
        successMessage: "Welcome back",
        onSuccess: (res) => {
          setSession(res.data.token, res.data.user);
          router.replace("/dashboard");
        },
      }
    );
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-700 to-sky-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* decorative glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Radio className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">ILL Customer Tracker</div>
            <div className="text-xs text-cyan-100/80">Customer Tracking System</div>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Know every ILL customer, and exactly where each one stands.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-cyan-100/80">
            A clean register of who you serve — and the live state of every new
            customer&apos;s onboarding.
          </p>

          <div className="mt-9 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <f.icon className="h-5 w-5 text-cyan-100" />
                <div className="mt-2 text-sm font-medium">{f.title}</div>
                <div className="mt-0.5 text-xs text-cyan-100/70">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-cyan-100/60">ILL only · v1.0</div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          {/* mobile brand */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">ILL Customer Tracker</h1>
              <p className="text-xs text-muted-foreground">Customer Tracking System</p>
            </div>
          </div>

          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to the customer register.</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoFocus autoComplete="email" />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </Field>
            <InlineError message={error} />
            <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-7">
            <div className="mb-2.5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> Demo logins <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fill(d.email, d.password)}
                  className="group flex flex-col rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary-subtle"
                >
                  <span className="text-xs font-medium text-foreground">{d.label}</span>
                  <span className="text-[11px] text-muted-foreground">{d.role}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Click a role to fill the form, then Sign in.</p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
