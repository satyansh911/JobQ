import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Queue } from "@/components/jq/illustrations";
import { Ticket } from "@/components/jq/ticket";
import { StatusChip } from "@/components/jq/status";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = { title: "About · JobQ" };

const SEEKERS = [
  ["Search the way you think", "Filter by city, salary, work mode, job type, role, company and how recently a job was posted."],
  ["Apply with one profile", "Your résumé, skills and bio go with every application, so applying is one tap."],
  ["Follow each ticket", "My applications lists every ticket as In the queue, You're up or Not this time."],
  ["Two free tools", "Check your résumé for an ATS score and fixes, or get suggested roles and a learning plan from your skills."],
];

const RECRUITERS = [
  ["Up to three companies", "Each company gets its own page with a logo, description and website, and its own list of jobs."],
  ["Post in a couple of minutes", "Title, salary, city, work mode, job type and number of openings. Close a job when you're done."],
  ["One table of applicants", "Open résumés and profiles, mark people Hired or Rejected, and we send them the email."],
  ["Gold marks mean Priority", "Applicants who pay for Priority appear at the top of your list with a gold mark."],
];

const FAQ = [
  { q: "Is JobQ free?", a: "Yes, for job seekers and recruiters. Priority is the only paid extra, at ₹119 a month, and you don't need it to apply." },
  { q: "What does Priority change?", a: "Recruiters see your applications at the top of their list, with a gold mark next to your name." },
  { q: "Do I need a résumé to apply?", a: "Yes. Upload a PDF to your profile once and it's attached to every application." },
  { q: "How will I know if I got the job?", a: "When a recruiter marks you Hired or Rejected, your ticket changes and we send you an email." },
];

function ExampleTicket({ token, title, company, className, children }: { token: string; title: string; company: string; className?: string; children: React.ReactNode }) {
  return (
    <Ticket token={<span className="text-[20px] sm:text-[22px]">{token}</span>} className={className}>
      <span className="min-w-0 flex-1">
        <b className="block">{title}</b>
        <span className="text-[15px] text-ink-muted">{company}</span>
      </span>
      {children}
    </Ticket>
  );
}

function Points({ items }: { items: string[][] }) {
  return (
    <dl className="flex flex-col gap-5">
      {items.map(([t, d]) => (
        <div key={t}>
          <dt className="text-[18px] font-bold md:text-[19px]">{t}</dt>
          <dd className="mt-1 text-ink-soft">{d}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AboutPage() {
  return (
    <div className="text-[17px] leading-[1.55]">
      <section className="container-marketing grid items-center gap-12 pt-12 pb-14 md:pt-20 md:pb-[72px] lg:grid-cols-2 lg:gap-14 [&>*]:min-w-0">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-[clamp(44px,6vw,80px)] leading-[0.96] font-extrabold tracking-[-0.035em] text-balance">
            A job board that tells you where you stand.
          </h1>
          <p className="max-w-[30em] text-[18px] text-ink-soft md:text-[20px]">
            JobQ lists roles from companies hiring students, freshers and early-career engineers across India. Every
            application gets a ticket number, and you can check its status any time.
          </p>
        </div>
        <div className="flex flex-col gap-[18px] py-2" role="img" aria-label="Two example tickets: one in the queue, one stamped You're up">
          <ExampleTicket token="Q-0142" title="Senior Frontend Engineer" company="Northwind Labs" className="-rotate-[1.5deg]">
            <StatusChip kind="queue">In the queue</StatusChip>
          </ExampleTicket>
          <ExampleTicket token="Q-0098" title="Engineering Intern" company="Fernpath Analytics" className="rotate-1 sm:ml-10">
            <span className="stamp flex-none bg-hired-tint !text-[17px] text-hired sm:!text-[20px]">You&apos;re up!</span>
          </ExampleTicket>
        </div>
      </section>

      <section className="border-y-2 border-ink bg-paper-deep">
        <div className="container-marketing grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-12 [&>*]:min-w-0">
          <figure className="rounded-[10px] border-2 border-ink bg-paper p-5">
            <Queue className="w-full" />
          </figure>
          <div className="flex flex-col gap-[18px]">
            <h2 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">Why the name</h2>
            <p className="text-[18px] text-ink-soft md:text-[19px]">
              JobQ is short for job queue. Anyone who has stood in line at a bank or a passport office knows the routine:
              take a token, wait, and keep an eye on the board until your number comes up.
            </p>
            <p className="text-[18px] text-ink-soft md:text-[19px]">
              We kept the token and dropped the guessing. Your ticket shows whether you&apos;re still waiting, hired or
              turned down, and we email you when it changes.
            </p>
          </div>
        </div>
      </section>

      <section className="container-marketing grid gap-14 py-14 md:py-[88px] lg:grid-cols-2 lg:gap-16 [&>*]:min-w-0">
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">If you&apos;re job hunting</h2>
          <Points items={SEEKERS} />
          <div>
            <Link href="/jobs" className="press inline-flex min-h-14 items-center rounded-[10px] border-2 border-ink bg-ink px-7 text-[18px] font-bold text-paper no-underline shadow-hard-red [--press-shadow:var(--color-red)] hover:text-paper">
              Find a job
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">If you&apos;re hiring</h2>
          <Points items={RECRUITERS} />
          <div>
            <Link href="/register?role=recruiter" className="press inline-flex min-h-14 items-center rounded-[10px] border-2 border-ink bg-red px-7 text-[18px] font-bold text-white no-underline shadow-hard hover:text-white">
              Post a job
            </Link>
          </div>
        </div>
      </section>

      <section className="container-marketing flex flex-col gap-6 pb-20 md:pb-24">
        <h2 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">Questions people ask</h2>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}
