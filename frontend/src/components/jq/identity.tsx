/* eslint-disable @next/next/no-img-element */
import React from "react";
import { cn } from "@/lib/utils";
import { companyInitials, initialsColour } from "@/lib/format";

/**
 * Company logo, or initials on a fill picked from the name so a company
 * keeps the same colour everywhere.
 */
export function CompanyLogo({
  name,
  src,
  size = 48,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const box = { width: size, height: size };
  if (src) {
    return (
      <span
        className={cn("grid flex-none place-items-center overflow-hidden rounded-[10px] border-2 border-ink bg-white", className)}
        style={box}
      >
        <img src={src} alt="" className="size-full object-cover" />
      </span>
    );
  }
  const fill = initialsColour(name);
  return (
    <span
      aria-hidden="true"
      className={cn("grid flex-none place-items-center rounded-[10px] border-2 border-ink font-display font-extrabold", className)}
      style={{ ...box, background: fill.bg, color: fill.fg, fontSize: Math.round(size * 0.36) }}
    >
      {companyInitials(name)}
    </span>
  );
}

/** The only circle in the system. Gold ring-fill when Priority is active. */
export function Avatar({
  name,
  src,
  size = 44,
  priority = false,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative grid flex-none place-items-center overflow-hidden rounded-full border-2 border-ink font-display font-extrabold",
        priority ? "bg-gold text-ink" : "bg-queue text-white",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}
