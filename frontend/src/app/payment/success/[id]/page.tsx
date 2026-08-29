"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";

const PaymentVerification = () => {
  const { id } = useParams();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center px-4 text-center">
      <span className="flex size-12 items-center justify-center bg-ok-tint text-ok-text">
        <Check className="size-6" />
      </span>

      <h1 className="t-h1 mt-6">Priority is active</h1>
      <p className="t-body mt-3">
        Your applications now sit at the top of a recruiter&apos;s list for the
        next 30 days.
      </p>

      <dl className="mt-8 w-full border border-hairline bg-raised text-left">
        <div className="flex items-baseline justify-between gap-4 px-5 py-3">
          <dt className="t-overline">Transaction</dt>
          <dd className="numeric truncate font-mono text-[12.5px] text-ink-2">{id}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-hairline px-5 py-3">
          <dt className="t-overline">Amount</dt>
          <dd className="numeric text-[15px] text-ink">₹119</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/jobs" className="btn-primary-sm">
          Browse open roles
        </Link>
        <Link
          href="/account"
          className="border border-line-strong px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
        >
          Go to your account
        </Link>
      </div>
    </div>
  );
};

export default PaymentVerification;
