"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, ShieldCheck, Boxes, Workflow, FileSpreadsheet, ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { InlineError } from "@/components/InlineError";
import { Toaster } from "@/components/Toaster";
import { useActionError } from "@/lib/useActionError";
import { useAuth } from "@/lib/stores";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/types";

const FEATURES = [
  { icon: Boxes, title: "One source of truth", text: "Every ILL customer — old or new, active or disconnected." },
  { icon: Workflow, title: "Onboarding pipeline", text: "Delivery → Billing → First-time billing, end to end." },
  { icon: FileSpreadsheet, title: "Bulk import & export", text: "Validated Excel import; export any filtered view." },
  { icon: ShieldCheck, title: "Role-scoped & audited", text: "Every change logged with who, when, and old → new." },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const { run, error, loading } = useActionError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

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

  const inputBase =
    "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary/50";

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.1fr_1fr]">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-700 to-sky-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* texture + glows */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }}
        />
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Radio className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">ILL Customer Tracker</div>
            <div className="text-xs text-cyan-100/80">Customer Tracking System</div>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[2.1rem] font-semibold leading-[1.15] tracking-tight">
            Know every ILL customer, and exactly where each one stands.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cyan-100/80">
            A clean register of who you serve — and the live state of every new customer&apos;s onboarding.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.12]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <div className="mt-3 text-sm font-medium">{f.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-cyan-100/70">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-cyan-100/60">
          <Lock className="h-3 w-3" /> Secure, role-based access · ILL CTS v1.0
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center bg-background px-5 py-12 sm:px-10">
        <div className="animate-in w-full max-w-sm">
          {/* logo */}
          <div className="mb-9 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/30 lg:hidden">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in to the customer register.</p>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoFocus
                autoComplete="email"
                className={inputBase}
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(inputBase, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <InlineError message={error} />

            <Button type="submit" loading={loading} className="mt-2 h-11 w-full justify-center text-sm">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            Trouble signing in? Contact your administrator.
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
