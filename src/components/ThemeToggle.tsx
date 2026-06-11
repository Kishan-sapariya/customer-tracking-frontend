"use client";
import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme, applyTheme } from "@/lib/stores";
import { Button } from "./ui";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  // Re-apply the persisted theme class on mount (after hydration).
  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
