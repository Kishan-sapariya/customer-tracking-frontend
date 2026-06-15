"use client";
import { useState } from "react";
import { inr, compactInr } from "@/lib/format";
import { cn } from "@/lib/utils";

// Shows a money value in Indian short notation (₹1.64 Cr / ₹5.73 L / ₹70 K) and
// reveals the full amount on click. A <span> (not a button) so it can nest
// inside clickable cards/rows without invalid markup.
export function Amount({
  value,
  className,
  signed,
}: {
  value: number | null | undefined;
  className?: string;
  signed?: boolean; // prefix a + for positive values (e.g. ARC difference)
}) {
  const [full, setFull] = useState(false);
  if (value === null || value === undefined) return <span className={className}>—</span>;

  const sign = signed && value > 0 ? "+" : "";
  const text = full ? inr(value) : compactInr(value);

  return (
    <span
      role="button"
      tabIndex={0}
      title={full ? "Click to collapse" : inr(value)}
      onClick={(e) => {
        e.stopPropagation();
        setFull((f) => !f);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          setFull((f) => !f);
        }
      }}
      className={cn("cursor-pointer tabular-nums underline-offset-2 hover:underline", className)}
    >
      {sign}
      {text}
    </span>
  );
}
