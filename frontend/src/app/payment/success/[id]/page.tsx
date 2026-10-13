"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { stamp } from "@/lib/motion";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/jq/feedback";
import { priorityUntil } from "@/components/marketing/pricing-ctas";

const DAY = 24 * 60 * 60 * 1000;
const fmt = (d: Date, time = false) =>
  d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(time && { hour: "numeric", minute: "2-digit" }) });

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 border-t-[1.5px] border-dashed border-line py-2.5 text-[15px] md:py-3 md:text-[16px]", className)}>
      <span>{label}</span>
      {children}
    </div>
  );
}

export default function PaymentSuccess() {
  const { id } = useParams<{ id: string }>();
  const { isAuth, user, loading } = useAppData();
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!loading && !isAuth) router.replace(`/login?next=${encodeURIComponent(`/payment/success/${id}`)}`);
  }, [loading, isAuth, id, router]);

  if (loading || !user) {
    return (
      <div className="container-app grid items-center gap-12 pt-12 pb-20 lg:grid-cols-[1fr_520px]" role="status" aria-label="Loading your receipt">
        <div className="flex flex-col gap-4"><Skeleton className="h-16 w-4/5" /><Skeleton className="h-5 w-3/5" /></div>
        <Skeleton className="h-[340px] rounded-[10px]" />
      </div>
    );
  }

  const until = priorityUntil(user.subscription);
  if (!until) {
    return (
      <div className="container-app flex flex-col items-start gap-5 pt-12 pb-24 md:pt-16">
        <h1 className="font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] md:text-[56px]">We can&apos;t see Priority on your account.</h1>
        <p className="max-w-[34em] text-[18px] text-ink-soft">
          If you were charged, the payment didn&apos;t finish confirming and Razorpay will refund it. Your transaction ID is{" "}
          <span className="font-mono text-[15px] break-all">{decodeURIComponent(id)}</span>.
        </p>
        <Link href="/priority" className={buttonVariants({ variant: "primary", size: "lg" })}>Try again</Link>
      </div>
    );
  }

  const paidOn = new Date(until.getTime() - 30 * DAY);

  return (
    <div className="container-app grid items-center gap-8 pt-6 pb-20 md:gap-16 md:pt-12 md:pb-24 lg:grid-cols-[1fr_520px] [&>*]:min-w-0">
      <div className="flex flex-col gap-4 md:gap-[18px]">
        <h1 className="font-display text-[40px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">You&apos;re at the front.</h1>
        <p className="max-w-[26em] text-ink-soft md:text-[20px]">
          <span className="md:hidden">Recruiters now see your applications first.</span>
          <span className="max-md:hidden">Priority is on. Recruiters now see your applications first, with a gold mark next to your name.</span>
        </p>
        <div className="flex flex-wrap gap-3.5 max-md:hidden">
          <Link href="/jobs" className={buttonVariants({ variant: "primary", size: "lg" })}>Browse jobs</Link>
          <Link href="/account" className={buttonVariants({ variant: "secondary", size: "lg" })}>My applications</Link>
        </div>
      </div>

      <div className="relative pb-2.5">
        <div className="receipt px-5 pt-5 pb-[30px] md:px-8 md:pt-8 md:pb-11">
          <div className="mb-2 flex items-center gap-2.5 md:mb-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-black.png" alt="JobQ" className="h-6 w-auto md:h-7" />
            <span className="text-[13px] text-ink-muted md:text-[14px]">Receipt</span>
          </div>
          <Row label="Plan" className="max-md:hidden"><b>Priority, 1 month</b></Row>
          <Row label="Amount"><b className="font-display text-[20px] leading-none font-extrabold md:text-[22px]">₹119.00</b></Row>
          <Row label="Transaction ID"><span className="min-w-0 font-mono text-[13px] break-all md:text-[14px]">{decodeURIComponent(id)}</span></Row>
          <Row label="Paid on"><b className="text-right">{fmt(paidOn, true)}</b></Row>
          <Row label="Valid until"><b>{fmt(until)}</b></Row>
          <Row label="Paid by" className="max-md:hidden"><b>{user.name}</b></Row>
        </div>
        <motion.span
          aria-hidden
          variants={reduce ? stamp.reduced : stamp.full}
          initial="lifted"
          animate="landed"
          className="absolute -top-7 right-2 grid size-[84px] place-items-center rounded-full border-[3px] border-hired bg-[rgba(221,241,228,.8)] font-display text-[20px] font-extrabold text-hired md:-top-12 md:-right-5 md:size-[120px] md:border-4 md:text-[28px] md:shadow-[inset_0_0_0_5px_rgba(221,241,228,.75),inset_0_0_0_7px_var(--color-hired)]"
        >
          PAID
        </motion.span>
        <span className="sr-only">Paid</span>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <Link href="/jobs" className={cn(buttonVariants({ variant: "primary" }), "min-h-[54px] w-full")}>Browse jobs</Link>
        <Link href="/account" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>My applications</Link>
      </div>
    </div>
  );
}
