import React from "react";
import type { Metadata } from "next";
import { Faq, Tick } from "@/components/marketing/faq";
import { FreePlanCta, PostJobCta, PriorityPlanCta } from "@/components/marketing/pricing-ctas";

export const metadata: Metadata = { title: "Pricing · JobQ" };

const FAQ = [
  { q: "How do I pay?", a: "Payments go through Razorpay, which opens in its own window. You'll get a receipt with your transaction ID once it's done." },
  { q: "Does Priority help with jobs I already applied to?", a: "Yes. While Priority is active, all of your open applications show first on each recruiter's list." },
  { q: "Does Priority guarantee an interview?", a: "No. It makes sure you're seen first. The recruiter still decides who to hire." },
];

function Plan({ gold = false, top, children }: { gold?: boolean; top: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className={`flex flex-col overflow-hidden rounded-[10px] border-[3px] border-ink shadow-hard-lg ${gold ? "bg-gold" : "bg-card"}`}>
      <div className="relative flex flex-col gap-2.5 border-b-2 border-dashed border-ink px-6 pt-7 pb-6 md:px-9 md:pt-8 md:pb-7">
        {top}
        {/* the notches sit on the tear line, wherever it ends up */}
        <span aria-hidden className="absolute -bottom-[15px] -left-[15px] size-7 rounded-full border-2 border-ink bg-paper" />
        <span aria-hidden className="absolute -right-[15px] -bottom-[15px] size-7 rounded-full border-2 border-ink bg-paper" />
      </div>
      <div className="flex flex-1 flex-col gap-[22px] px-6 pt-6 pb-7 md:px-9 md:pt-7 md:pb-9">{children}</div>
    </article>
  );
}

export default function PricingPage() {
  return (
    <div className="text-[17px] leading-[1.55]">
      <section className="container-marketing pt-12 pb-10 md:pt-[72px]">
        <div className="flex max-w-[760px] flex-col gap-[18px]">
          <h1 className="font-display text-[clamp(44px,6vw,76px)] leading-[0.96] font-extrabold tracking-[-0.035em] text-balance">
            Free to apply. Priority if you want to go first.
          </h1>
          <p className="text-[18px] text-ink-soft md:text-[20px]">
            Everything you need to find and apply for a job costs nothing. Priority puts your applications at the top of a
            recruiter&apos;s list.
          </p>
        </div>
      </section>

      <section className="container-marketing grid items-stretch gap-8 pb-16 md:pb-[72px] lg:grid-cols-2 [&>*]:min-w-0">
        <Plan
          top={
            <>
              <h2 className="font-display text-[32px] leading-none font-extrabold tracking-[-0.03em]">Free</h2>
              <span className="font-display text-[56px] leading-none font-extrabold tracking-[-0.03em]">₹0</span>
            </>
          }
        >
          <ul className="flex flex-col gap-3">
            <Tick>Browse and filter every open role</Tick>
            <Tick>Apply in one tap with your saved profile and résumé</Tick>
            <Tick>A ticket number and status for every application</Tick>
            <Tick>Résumé checker and career guidance</Tick>
            <Tick>An email when a recruiter decides</Tick>
          </ul>
          <div className="mt-auto pt-2"><FreePlanCta /></div>
        </Plan>

        <Plan
          gold
          top={
            <>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[32px] leading-none font-extrabold tracking-[-0.03em]">Skip the line</h2>
                <span className="rounded-[10px] bg-ink px-2.5 py-[3px] text-[14px] font-bold text-gold">Priority</span>
              </div>
              <div>
                <span className="font-display text-[56px] leading-none font-extrabold tracking-[-0.03em]">₹119</span>
                <span className="font-bold"> / month</span>
              </div>
            </>
          }
        >
          <ul className="flex flex-col gap-3">
            <Tick tone="ink">Everything in Free</Tick>
            <Tick tone="ink"><b>Top of the list.</b> Your applications appear first on every recruiter&apos;s applicant table.</Tick>
            <Tick tone="ink"><b>A gold mark</b> next to your name, so recruiters can spot you.</Tick>
            <Tick tone="ink">Lasts one month from the day you pay</Tick>
          </ul>
          <div className="mt-auto pt-2"><PriorityPlanCta /></div>
        </Plan>
      </section>

      <section className="bg-ink text-paper">
        <div className="container-marketing flex flex-wrap items-center justify-between gap-6 py-12">
          <div>
            <h2 className="mb-2 font-display text-[32px] leading-none font-extrabold tracking-[-0.03em] text-paper md:text-[36px]">Hiring?</h2>
            <p className="text-[#E6DACB]">Posting jobs and reviewing applicants is free. Up to three companies per account.</p>
          </div>
          <PostJobCta />
        </div>
      </section>

      <section className="container-marketing flex flex-col gap-6 pt-16 pb-20 md:pt-20 md:pb-24">
        <h2 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">About paying</h2>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}
