import React from "react";
import { cn } from "@/lib/utils";

/**
 * Status is the only place semantic colour appears. Each kind pairs a tint
 * fill with the dark text step measured against it — never the base.
 */
export function StatusBadge({
  kind = "neutral",
  children,
  className,
}: {
  kind?: "ok" | "warn" | "bad" | "neutral" | "accent";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[12px] font-medium",
        {
          ok: "status-ok",
          warn: "status-warn",
          bad: "status-bad",
          neutral: "status-neutral",
          accent: "status-accent",
        }[kind],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Maps an application status to its semantic colour. */
export const statusKind = (s: string): "ok" | "bad" | "neutral" =>
  s === "Hired" ? "ok" : s === "Rejected" ? "bad" : "neutral";
