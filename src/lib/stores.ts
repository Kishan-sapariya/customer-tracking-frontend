import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, Role } from "./types";
import { clearToken, setToken } from "./api";

// ── Auth store (token + user, persisted) ─────────────────────────────────────
interface AuthState {
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (token, user) => {
        setToken(token);
        set({ user });
      },
      logout: () => {
        clearToken();
        set({ user: null });
      },
      setUser: (user) => set({ user }),
    }),
    { name: "ill_cts_auth" }
  )
);

// Capability helper — the single place that maps roles → what they can do
// (mirrors the PRD §4.1 permission matrix; UI gating only, API re-checks).
export function can(role: Role | undefined) {
  const isWriter = role === "ACCOUNTS" || role === "MASTER";
  return {
    writeCustomers: isWriter,
    setDelivery: role === "DELIVERY" || isWriter,
    recordBilling: isWriter,
    recordFtb: isWriter,
    lifecycle: isWriter,
    manageUsers: role === "ADMIN" || role === "MASTER",
    systemSettings: role === "MASTER",
  };
}

// ── Theme store (dark/light, persisted per user) ─────────────────────────────
interface ThemeState {
  dark: boolean;
  toggle: () => void;
  set: (dark: boolean) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => {
        const next = !get().dark;
        applyTheme(next);
        set({ dark: next });
      },
      set: (dark) => {
        applyTheme(dark);
        set({ dark });
      },
    }),
    { name: "ill_cts_theme" }
  )
);

export function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
}

// ── UI store (mobile nav drawer + desktop sidebar collapse) ──────────────────
interface UIState {
  mobileNavOpen: boolean;
  setMobileNav: (open: boolean) => void;
  toggleMobileNav: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}
export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      mobileNavOpen: false,
      setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
      toggleMobileNav: () => set({ mobileNavOpen: !get().mobileNavOpen }),
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    // Only the collapse preference persists; the mobile drawer always starts closed.
    { name: "ill_cts_ui", partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) }
  )
);

// ── Toast store (success/failure feedback — FR-7.5) ──────────────────────────
export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}
interface ToastState {
  toasts: Toast[];
  push: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: number) => void;
}
let toastId = 0;
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type = "success") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
