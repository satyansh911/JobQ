"use client";

import React from "react";
import Link from "next/link";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Queue, TakeANumber } from "@/components/jq/illustrations";

/**
 * Auth layout: the red panel on the left with an illustration and a line,
 * the form on the right. On phones the panel shrinks to a red band.
 */
export function AuthShell({
  art = "queue",
  line,
  band,
  wide = false,
  children,
}: {
  art?: "queue" | "number";
  line: React.ReactNode;
  /** Right side of the phone band, e.g. "Step 1 of 2" or a back button. */
  band?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const Art = art === "number" ? TakeANumber : Queue;
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper md:flex-row">
      {/* phones: band */}
      <div className="flex h-16 flex-none items-center justify-between border-b-2 border-ink bg-red px-4 md:hidden">
        <LogoChip />
        {band}
      </div>

      {/* 768+: panel */}
      <aside
        className={cn(
          "hidden flex-none flex-col justify-between gap-8 border-r-2 border-ink bg-red px-10 py-10 text-white md:flex lg:px-14",
          wide ? "md:w-[40%]" : "md:w-[44%]"
        )}
      >
        <LogoChip />
        <figure className="rounded-[10px] border-2 border-ink bg-paper p-5 shadow-hard-lg">
          <Art className="w-full" />
        </figure>
        <p className="font-display text-[38px] leading-[1.02] font-extrabold tracking-[-0.03em] text-white lg:text-[46px]">{line}</p>
      </aside>

      <main id="main" className="flex flex-1 items-center justify-center px-5 py-6 md:px-6 md:py-10">
        <div className={cn("flex w-full flex-col gap-6", wide ? "max-w-[600px]" : "max-w-[420px]")}>{children}</div>
      </main>
    </div>
  );
}

/** Your logo on a paper chip, so its red Q survives the red panel. */
function LogoChip() {
  return (
    <Link href="/" aria-label="JobQ home" className="inline-flex rounded-[10px] border-2 border-ink bg-paper px-3 py-1 md:self-start md:py-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-black.png" alt="JobQ" className="h-7 w-auto md:h-8" />
    </Link>
  );
}

export function AuthHeading({ title, sub }: { title: string; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[48px]">{title}</h1>
      {sub && <p className="text-ink-muted">{sub}</p>}
    </div>
  );
}

/** The square icon above a state heading: inbox sent, password saved, link expired. */
export function StateIcon({ tone, children }: { tone: "queue" | "hired" | "plain"; children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-14 place-items-center rounded-[10px] border-2 border-ink shadow-hard [&_svg]:size-6",
        tone === "queue" && "bg-queue-tint text-queue",
        tone === "hired" && "bg-hired-tint text-hired",
        tone === "plain" && "bg-paper-deep text-ink"
      )}
    >
      {children}
    </span>
  );
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-[10px] border-2 border-red-deep bg-error-tint px-3.5 py-3 text-[15px]">
      <CircleAlert className="mt-0.5 size-[18px] flex-none text-red-deep" strokeWidth={2.5} aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="text-[14px] font-normal text-red-deep">
      {children}
    </span>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid,
  describedBy,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative block">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        required
        className="min-h-12 w-full rounded-[10px] border-2 border-ink bg-card pr-14 pl-3.5 text-[16px] text-ink aria-invalid:border-red-deep aria-invalid:shadow-[0_0_0_3px_var(--color-error-ring)] disabled:border-disabled-line disabled:bg-disabled"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute top-0.5 right-0.5 grid size-11 place-items-center"
      >
        {show ? <EyeOff className="size-5" strokeWidth={2.25} /> : <Eye className="size-5" strokeWidth={2.25} />}
      </button>
    </span>
  );
}
