"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Logo — the real JobQ wordmark. Used in every header.
 * ------------------------------------------------------------------ */
export const Logo = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/logo.png" alt="JobQ" className={cn("h-9 w-auto", className)} />
);

/* ------------------------------------------------------------------ *
 * LogoMark — the square badge crop of the logo, for tight spots
 * (button icons, the app menu-bar strip).
 * ------------------------------------------------------------------ */
export const LogoMark = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/logo-icon.png"
    alt=""
    aria-hidden
    className={cn("w-5 h-5 object-contain", className)}
  />
);

/* ------------------------------------------------------------------ *
 * primaryPill — the white pill treatment shared by every primary CTA
 * (the "Browse Jobs" button and the AI tool triggers).
 * ------------------------------------------------------------------ */
export const primaryPill =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

/* ------------------------------------------------------------------ *
 * PrimaryButton — rounded-full white pill, mark + label + chevron
 * ------------------------------------------------------------------ */
export const PrimaryButton = ({
  label = "Browse Jobs",
  href = "/jobs",
  full = false,
}: {
  label?: string;
  href?: string;
  full?: boolean;
}) => (
  <Link href={href} className={cn(primaryPill, full && "w-full")}>
    <LogoMark className="w-4 h-4" />
    {label}
    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
  </Link>
);

/* ------------------------------------------------------------------ *
 * SectionEyebrow — dot + label, with optional tag pill
 * ------------------------------------------------------------------ */
export const SectionEyebrow = ({
  label,
  tag,
}: {
  label: string;
  tag?: string;
}) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="w-1.5 h-1.5 rounded-full bg-white" />
    <span className="text-white font-medium">{label}</span>
    {tag && (
      <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">
        {tag}
      </span>
    )}
  </div>
);

/* ------------------------------------------------------------------ *
 * gradientStyle — the shiny sweeping headline treatment
 * ------------------------------------------------------------------ */
export const gradientStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  filter: "url(#c3-noise)",
};
