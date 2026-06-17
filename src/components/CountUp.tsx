"use client";
import { useEffect, useRef, useState } from "react";

// Animated number that eases from its previous value up to the target. Used by
// the dashboard stat cards so figures "tick up" on load. Honors
// prefers-reduced-motion (jumps straight to the value) and groups with en-IN.
export function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0); // animate from the last shown value on change

  useEffect(() => {
    const from = fromRef.current;
    const diff = value - from;
    if (diff === 0) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || duration <= 0) {
      const id = requestAnimationFrame(() => {
        setDisplay(value);
        fromRef.current = value;
      });
      return () => cancelAnimationFrame(id);
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display.toLocaleString("en-IN")}</>;
}
