"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { Lock } from "lucide-react";
import useRazorpay from "@/components/scriptLoader";
import { payment_service, useAppData } from "@/context/AppContext";
import { apiError, cn } from "@/lib/utils";
import { Button, buttonVariants, Spinner } from "@/components/ui/button";
import { GoldTicket } from "@/components/jq/illustrations";
import { Skeleton } from "@/components/jq/feedback";
import { Tick } from "@/components/marketing/faq";
import { FormAlert } from "@/components/auth/auth-shell";
import { priorityUntil } from "@/components/marketing/pricing-ctas";

const DAY = 24 * 60 * 60 * 1000;
const PRICE = 119;
const day = (d: Date, year = false) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(year && { year: "numeric" }) });

type Phase = "idle" | "opening" | "waiting" | "verifying";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

export default function PriorityCheckout() {
  const { isAuth, user, loading, applications, setUser } = useAppData();
  const router = useRouter();
  const scriptReady = useRazorpay();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const rzp = useRef<{ open: () => void; close: () => void; on: (e: string, cb: (r: unknown) => void) => void } | null>(null);

  useEffect(() => {
    if (!loading && !isAuth) router.replace(`/login?next=${encodeURIComponent("/priority")}`);
  }, [loading, isAuth, router]);

  if (loading || !user) {
    return (
      <div className="container-app grid gap-10 pt-10 pb-20 lg:grid-cols-[1.2fr_1fr]" role="status" aria-label="Loading checkout">
        <div className="flex flex-col gap-4"><Skeleton className="h-40 w-72" /><Skeleton className="h-14 w-3/5" /><Skeleton className="h-5 w-4/5" /></div>
        <Skeleton className="h-[360px] rounded-[10px]" />
      </div>
    );
  }

  const until = priorityUntil(user.subscription);
  if (user.role === "recruiter" || until) {
    return (
      <div className="container-app flex flex-col items-start gap-5 pt-12 pb-24 md:pt-16">
        <h1 className="font-display text-[44px] leading-none font-extrabold tracking-[-0.03em] md:text-[56px]">
          {until ? "You're already at the front." : "Priority is for job seekers."}
        </h1>
        <p className="max-w-[34em] text-[18px] text-ink-soft">
          {until
            ? `Priority is on until ${day(until, true)}. Recruiters see your applications first, with a gold mark next to your name.`
            : "Seekers who buy it show up first in your applicant tables, with a gold mark, so you'll spot them straight away."}
        </p>
        <Link href={until ? "/jobs" : "/account"} className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
          {until ? "Browse jobs" : "My companies"}
        </Link>
      </div>
    );
  }

  const now = new Date();
  const ends = new Date(now.getTime() + 30 * DAY);
  const open = applications.filter((a) => a.status === "Submitted").length;
  const busy = phase !== "idle";

  const pay = async () => {
    setError(null);
    if (!scriptReady || !window.Razorpay) {
      setError("Razorpay is still loading. Give it a second and try again.");
      return;
    }
    setPhase("opening");
    const headers = { Authorization: `Bearer ${Cookies.get("token")}` };
    try {
      const { data } = await axios.post(`${payment_service}/api/payment/checkout`, {}, { headers });
      const instance = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "JobQ",
        description: "Priority, 1 month",
        order_id: data.order.id,
        prefill: { name: user.name, email: user.email, contact: user.phone_number },
        theme: { color: "#C03C48" },
        handler: async (r: RazorpayResponse) => {
          setPhase("verifying");
          try {
            const { data: done } = await axios.post(`${payment_service}/api/payment/verify`, r, { headers });
            setUser((u) => (u ? { ...u, subscription: done.subscription } : u));
            router.push(`/payment/success/${encodeURIComponent(r.razorpay_payment_id)}`);
          } catch (err) {
            setError(apiError(err, "We couldn't confirm that payment. If you were charged, it will be refunded."));
            setPhase("idle");
          }
        },
        modal: { ondismiss: () => setPhase((p) => (p === "verifying" ? p : "idle")) },
      });
      instance.on("payment.failed", () => setError("Payment didn't go through. Try again, or pick another method in Razorpay."));
      rzp.current = instance;
      instance.open();
      setPhase("waiting");
    } catch (err) {
      setError(apiError(err, "Couldn't start the payment. Please try again."));
      setPhase("idle");
    }
  };

  const cancel = () => {
    rzp.current?.close();
    setPhase("idle");
  };

  const payLabel =
    phase === "opening" ? "Opening Razorpay" : phase === "waiting" ? "Waiting for Razorpay" : phase === "verifying" ? "Confirming payment" : `Pay ₹${PRICE}`;

  return (
    <>
      {/* phones: while Razorpay is open, this screen says what's going on */}
      {(phase === "waiting" || phase === "verifying") && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-paper px-6 text-center md:hidden">
          <Spinner className="size-14 text-red" strokeWidth={2.5} />
          <h2 className="font-display text-[32px] leading-none font-extrabold tracking-[-0.03em]">
            {phase === "verifying" ? "Confirming your payment" : "Finish paying in Razorpay"}
          </h2>
          <p className="text-ink-soft">Once it&apos;s done, you&apos;ll land back here with your receipt.</p>
          {phase === "waiting" && <Button variant="secondary" className="mt-3 w-full" onClick={cancel}>Cancel payment</Button>}
        </div>
      )}

      <div className="container-app grid items-start gap-8 pt-6 pb-32 md:gap-14 md:pt-12 md:pb-20 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <div className="flex flex-col gap-4 md:gap-[22px]">
          <GoldTicket className="hidden w-[300px] md:block" label="" />
          <h1 className="font-display text-[44px] leading-none font-extrabold tracking-[-0.035em] md:text-[64px]">Skip the line.</h1>
          <p className="max-w-[28em] text-ink-soft md:text-[20px]">Your applications go to the top of every recruiter&apos;s list.</p>
          <ul className="hidden flex-col gap-3 text-[17px] md:flex">
            <Tick>
              {open > 0
                ? `Your ${open} open application${open === 1 ? "" : "s"} move${open === 1 ? "s" : ""} up straight away, and new ones start at the top.`
                : "Every application you send starts at the top of the list."}
            </Tick>
            <Tick>A gold mark next to your name in every applicant table.</Tick>
            <Tick>Lasts one month, until {day(ends, true)}.</Tick>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[10px] border-[3px] border-ink bg-gold shadow-hard-lg">
            <div className="border-b-2 border-dashed border-ink px-5 py-4 md:px-[26px] md:py-[22px]">
              <span className="font-bold">Priority · 1 month</span>
              <div className="mt-1.5 font-display text-[44px] leading-none font-extrabold tracking-[-0.03em] md:text-[56px]">₹{PRICE}</div>
            </div>
            {/* phones: the benefits live in the card */}
            <div className="flex flex-col gap-2.5 bg-card px-5 py-4 text-[15px] md:hidden">
              <span>{open > 0 ? `Your ${open} open application${open === 1 ? "" : "s"} move${open === 1 ? "s" : ""} up straight away.` : "New applications start at the top."}</span>
              <span>Gold mark next to your name.</span>
              <span>Valid until {day(ends, true)}.</span>
            </div>
            <div className="hidden flex-col gap-3.5 bg-card px-[26px] py-[22px] md:flex">
              <div className="flex justify-between gap-4">
                <span>Priority, {day(now)} to {day(ends)}</span>
                <b>₹{PRICE}.00</b>
              </div>
              <div className="flex items-baseline justify-between border-t-[1.5px] border-line pt-3">
                <b>Total</b>
                <b className="font-display text-[24px] leading-none font-extrabold">₹{PRICE}</b>
              </div>
              <Button variant="gold" size="lg" className="w-full" loading={busy} onClick={pay}>{payLabel}</Button>
              {phase === "waiting" && (
                <button onClick={cancel} className="self-center text-[15px] font-bold text-red-deep underline">Cancel payment</button>
              )}
              <p className="flex items-start gap-2 text-[14px] text-ink-muted">
                <Lock className="mt-[3px] size-4 flex-none" strokeWidth={2.25} aria-hidden />
                Payment is handled by Razorpay in its own window. Keep this tab open until it finishes.
              </p>
            </div>
          </div>
          {error && <FormAlert>{error}</FormAlert>}
          <p className="text-[14px] text-ink-muted md:hidden">Payment opens in Razorpay. Keep this screen open until it finishes.</p>
        </div>
      </div>

      {/* phones: pay bar */}
      <div data-apply-bar className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-card px-4 pt-3 pb-[max(22px,env(safe-area-inset-bottom))] md:hidden">
        <Button variant="gold" className="min-h-[54px] w-full text-[18px]" loading={busy} onClick={pay}>{payLabel}</Button>
      </div>
    </>
  );
}
