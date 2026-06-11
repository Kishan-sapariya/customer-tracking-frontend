"use client";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useUI } from "@/lib/stores";

// Minimal top bar — mobile menu toggle + theme. The user menu and logout now
// live at the bottom of the sidebar.
export function Topbar() {
  const toggleMobileNav = useUI((s) => s.toggleMobileNav);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-5">
      <button
        onClick={toggleMobileNav}
        className="-ml-1 flex items-center gap-2 rounded-lg p-2 text-foreground hover:bg-surface-muted md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
        <span className="text-sm font-semibold">ILL CTS</span>
      </button>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
