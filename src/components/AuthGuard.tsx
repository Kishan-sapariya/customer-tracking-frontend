"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/stores";
import { api, getToken } from "@/lib/api";
import { Spinner } from "./ui";
import type { AuthUser } from "@/lib/types";

// Client-side route guard: validates the localStorage JWT against /auth/me on
// mount, refreshes the cached user, and bounces to /login if missing/expired.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      try {
        const res = await api<{ data: { user: AuthUser } }>("/auth/me");
        if (!cancelled) {
          setUser(res.data.user);
          setChecked(true);
        }
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  return <>{children}</>;
}
