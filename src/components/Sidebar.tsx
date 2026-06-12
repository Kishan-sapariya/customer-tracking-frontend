"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  History,
  PackagePlus,
  Boxes,
  ListChecks,
  Settings,
  ShieldCheck,
  Radio,
  ArrowLeftRight,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  KeyRound,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, can, useUI } from "@/lib/stores";
import { ChangePasswordModal } from "./ChangePasswordModal";

const ROLE_LABEL: Record<string, string> = { ACCOUNTS: "Accounts", DELIVERY: "Delivery", ADMIN: "Admin", MASTER: "Master" };

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: () => true },
  { href: "/customers", label: "Customers", icon: Users, show: () => true },
  { href: "/old-customers", label: "Old Customers", icon: Boxes, show: (c: any) => c.writeCustomers },
  { href: "/new-customers", label: "New Customers", icon: PackagePlus, show: (c: any) => c.writeCustomers },
  { href: "/worklist", label: "My Worklist", icon: ListChecks, show: (c: any) => c.setDelivery || c.recordBilling },
  { href: "/changes", label: "Commercial Changes", icon: ArrowLeftRight, show: (c: any) => c.lifecycle || c.manageUsers },
  { href: "/users", label: "Users", icon: ShieldCheck, show: (c: any) => c.manageUsers },
  { href: "/settings", label: "Settings", icon: Settings, show: (c: any) => c.systemSettings },
];

function Brand({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) {
  return (
    <div className={cn("flex items-center py-5", collapsed ? "justify-center px-3" : "justify-between px-5")}>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radio className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-semibold">ILL CCD</div>
            <div className="text-[11px] text-muted-foreground">Customer Tracker</div>
          </div>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted md:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const role = useAuth((s) => s.user?.role);
  const caps = can(role);
  return (
    <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-1">
      {NAV.filter((n) => n.show(caps)).map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            title={collapsed ? n.label : undefined}
            className={cn(
              "flex items-center rounded-xl border text-sm font-medium transition-all",
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
              active
                ? "border-primary/30 bg-primary-subtle text-primary"
                : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <n.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
            {!collapsed && (
              <>
                <span className="flex-1">{n.label}</span>
                <ChevronRight className={cn("h-4 w-4 shrink-0 opacity-40", active && "opacity-70")} />
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// User card at the bottom of the sidebar — avatar + name/role, with a popup menu
// for Change password and Log out.
function SidebarUser({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="relative px-3 pt-2" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? `${user.name} · ${ROLE_LABEL[user.role]}` : undefined}
        className={cn(
          "flex w-full items-center rounded-xl border border-border bg-surface transition-colors hover:bg-surface-muted",
          collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2"
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
          {initials}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[user.role]}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute bottom-full z-50 mb-2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg",
            collapsed ? "left-2 w-52" : "left-3 right-3"
          )}
        >
          <button
            onClick={() => { setPwOpen(true); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-surface-muted"
          >
            <KeyRound className="h-3.5 w-3.5" /> Change password
          </button>
          <button
            onClick={() => { logout(); onNavigate?.(); router.push("/login"); }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-xs text-danger hover:bg-surface-muted"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      )}

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function Footer({ collapsed, onToggle, onNavigate }: { collapsed?: boolean; onToggle?: () => void; onNavigate?: () => void }) {
  return (
    <div className="border-t border-border pb-3 pt-1">
      <SidebarUser collapsed={collapsed} onNavigate={onNavigate} />
      <div className={cn("mt-2 flex items-center gap-2 px-3", collapsed ? "justify-center" : "justify-between px-5")}>
        {!collapsed && (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <History className="h-3 w-3" /> v1.0 · ILL only
          </span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            title={collapsed ? "Expand" : "Collapse"}
            className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground md:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { mobileNavOpen, setMobileNav, sidebarCollapsed, toggleSidebar } = useUI();
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileNav(false);
  }, [pathname, setMobileNav]);

  return (
    <>
      {/* Desktop rail (collapsible) */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
          sidebarCollapsed ? "w-[68px]" : "w-60"
        )}
      >
        <Brand collapsed={sidebarCollapsed} />
        <NavList collapsed={sidebarCollapsed} />
        <Footer collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>

      {/* Mobile drawer (always full-width labels) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <aside className="animate-slide-in absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-surface">
            <Brand onClose={() => setMobileNav(false)} />
            <NavList onNavigate={() => setMobileNav(false)} />
            <Footer onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
