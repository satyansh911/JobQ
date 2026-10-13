"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { stamp as stampMotion, shouldPlayStamp } from "@/lib/motion";

/**
 * A ticket: a stub holding the token, a dashed perforation, and the body.
 * The side notches cut through to whatever is behind — pass `hole` when the
 * ticket sits on something other than paper.
 */
export function Ticket({
  stubLabel = "Ticket",
  token,
  children,
  tone = "card",
  hole,
  compact = false,
  className,
}: {
  stubLabel?: string;
  token: React.ReactNode;
  children: React.ReactNode;
  tone?: "card" | "gold";
  hole?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ticket flex rounded-[10px] border-2 border-ink shadow-hard",
        tone === "gold" ? "bg-gold" : "bg-card",
        className
      )}
      style={hole ? ({ "--hole": hole } as React.CSSProperties) : undefined}
    >
      <div
        className={cn(
          "perforation flex flex-none flex-col justify-center py-4",
          compact ? "w-[84px] pl-5" : "w-[112px] pl-6"
        )}
      >
        <span className={cn("text-[13px]", tone === "gold" ? "text-ink" : "text-ink-muted")}>{stubLabel}</span>
        <span className={cn("t-token whitespace-nowrap", compact && "!text-[18px]")}>{token}</span>
      </div>
      <div className={cn("flex min-w-0 flex-1 items-center gap-3 py-4 pl-5", compact ? "pr-6" : "pr-[30px]")}>
        {children}
      </div>
    </div>
  );
}

/**
 * Hired / Rejected stamp. Lands once, the first time this device sees the
 * new status; after that it just sits there.
 */
export function Stamp({
  status,
  applicationId,
  text,
  className,
}: {
  status: "Hired" | "Rejected";
  applicationId?: number;
  /** Defaults to the seeker wording: "You're up!" / "Not this time". */
  text?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (applicationId !== undefined) setPlay(shouldPlayStamp(applicationId, status));
  }, [applicationId, status]);

  const hired = status === "Hired";
  const variants = reduce ? stampMotion.reduced : stampMotion.full;

  return (
    <motion.span
      className={cn(
        "stamp",
        hired ? "bg-hired-tint text-hired" : "bg-rejected-tint text-rejected !text-[17px]",
        className
      )}
      variants={variants}
      initial={play ? "lifted" : false}
      animate="landed"
      style={{ rotate: -9 }}
    >
      {text ?? (hired ? "You're up!" : "Not this time")}
    </motion.span>
  );
}

/**
 * A number whose digits roll upward when it changes. Used for the token in
 * the apply toast and for counts. Reduced motion swaps instantly.
 */
export function NumberRoll({ value, className }: { value: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn("inline-flex tabular-nums", className)} aria-label={value}>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="inline-block h-[1em] overflow-hidden leading-none">
            <span
              className="flex flex-col"
              style={{
                transform: `translateY(-${Number(ch)}em)`,
                transition: reduce ? "none" : "transform 500ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              {"0123456789".split("").map((d) => (
                <span key={d} className="h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        )
      )}
    </span>
  );
}
