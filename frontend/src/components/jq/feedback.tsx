"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toaster as Sonner } from "sonner";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClosedCounter } from "@/components/jq/illustrations";

/* ------------------------------------------------------------------ *
 * Toasts · bottom right (bottom centre on phones), 5s, pause on hover
 * ------------------------------------------------------------------ */
function ToastIcon({ tone }: { tone: "ok" | "error" | "info" }) {
  const cls = {
    ok: "bg-hired-tint border-hired text-hired",
    error: "bg-error-tint border-red-deep text-red-deep",
    info: "bg-queue-tint border-queue text-queue",
  }[tone];
  return (
    <span className={cn("grid size-8 flex-none place-items-center rounded-[8px] border-2", cls)}>
      {tone === "ok" ? (
        <Check className="size-4" strokeWidth={3} />
      ) : tone === "error" ? (
        <span className="font-display text-[17px] leading-none font-extrabold">!</span>
      ) : (
        <Info className="size-4" strokeWidth={3} />
      )}
    </span>
  );
}

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      duration={5000}
      gap={10}
      offset={24}
      mobileOffset={16}
      icons={{
        success: <ToastIcon tone="ok" />,
        error: <ToastIcon tone="error" />,
        info: <ToastIcon tone="info" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[min(400px,calc(100vw-32px))] items-center gap-3 rounded-[10px] border-2 border-ink bg-card px-3.5 py-3 text-[15px] text-ink shadow-hard font-sans",
          error: "!border-red-deep !shadow-hard-error",
          title: "font-bold",
          description: "text-ink-soft",
          actionButton:
            "ml-auto min-h-11 rounded-[10px] border-2 border-ink bg-card px-4 text-[15px] font-bold hover:bg-paper-deep",
          closeButton: "!static order-last grid size-9 place-items-center rounded-[8px] border-0 bg-transparent",
          icon: "!m-0 !size-8 flex-none",
        },
      }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Skeleton · warm paper, matches real row heights
 * ------------------------------------------------------------------ */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ *
 * Profile meter · always shows the next step as a link
 * ------------------------------------------------------------------ */
export function ProfileMeter({
  percent,
  done,
  total,
  next,
}: {
  percent: number;
  done: number;
  total: number;
  next?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <b>Profile {percent}% done</b>
        <span className="t-help">
          {done} of {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness"
        className="h-3.5 overflow-hidden rounded-[10px] border-2 border-ink bg-card"
      >
        <div
          className={cn("h-full bg-red", percent > 0 && percent < 100 && "border-r-2 border-ink")}
          style={{ width: `${percent}%` }}
        />
      </div>
      {next && <span className="t-help">{next}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Offline · "the counter's closed for a moment"
 * Replaces a data screen's content (full) or one section (inline).
 * Retries by itself every 15s, and on "Try again now".
 * ------------------------------------------------------------------ */
const RETRY_SECONDS = 15;

export function OfflineState({
  onRetry,
  variant = "full",
  detail,
  className,
}: {
  /** Re-run the failed fetch. Resolve once it has been attempted. */
  onRetry: () => unknown | Promise<unknown>;
  variant?: "full" | "inline";
  /** Inline only: what will reappear, e.g. "Your tickets will show up here again soon." */
  detail?: string;
  className?: string;
}) {
  const [left, setLeft] = useState(RETRY_SECONDS);
  const [busy, setBusy] = useState(false);
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;

  const retry = useCallback(async () => {
    setBusy(true);
    try {
      await retryRef.current();
    } finally {
      setBusy(false);
      setLeft(RETRY_SECONDS);
    }
  }, []);

  useEffect(() => {
    if (busy) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          void retry();
          return RETRY_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [busy, retry]);

  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-wrap items-center gap-3.5 rounded-[10px] border-2 border-dashed border-ink bg-paper-deep p-4",
          className
        )}
      >
        <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true" className="flex-none">
          <path d="M6 10h36l-3 6H9z" fill="#C03C48" stroke="#1D1517" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="9" y="16" width="30" height="26" fill="#F3EADA" stroke="#1D1517" strokeWidth="2.5" />
          <path d="M9 23h30M9 30h30M9 37h30" stroke="#1D1517" strokeWidth="2" />
        </svg>
        <div className="min-w-[12rem] flex-1">
          <b>The counter&apos;s closed for a moment.</b>
          <br />
          <span className="t-help">{detail ?? "This will show up here again soon."}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={retry} loading={busy}>
          {busy ? "Trying" : "Try again"}
        </Button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-4 px-6 pt-14 pb-16 text-center md:px-8", className)}
    >
      <ClosedCounter label="" className="w-[260px] md:w-[300px]" />
      <h2 className="t-h1 max-w-[16em]">The counter&apos;s closed for a moment.</h2>
      <p className="max-w-[34em] text-[17px] text-ink-soft md:text-[19px]">
        Try again in a minute. We&apos;ll keep trying in the background, and anything you&apos;ve
        typed or filtered will still be here.
      </p>
      <div className="flex w-full flex-col items-center gap-3.5 sm:w-auto sm:flex-row">
        <Button onClick={retry} loading={busy} className="w-full sm:w-auto">
          {busy ? "Trying" : "Try again now"}
        </Button>
        <span className="t-help" aria-live="polite">
          {busy ? "Checking…" : `Trying again in ${left}s`}
        </span>
      </div>
    </div>
  );
}

/** Dismiss button for custom toasts. */
export function ToastClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Dismiss"
      className="grid size-9 flex-none place-items-center rounded-[8px] hover:bg-paper-deep"
    >
      <X className="size-4" strokeWidth={2.75} />
    </button>
  );
}
