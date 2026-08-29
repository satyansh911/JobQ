import React from "react";
import Link from "next/link";

const FACTS = [
  ["Frontend", "Next.js 16 App Router, React 19, TypeScript, Tailwind v4"],
  ["Services", "Five Node/Express services — auth, user, job, payment, utils"],
  ["Data", "Postgres, shared across services; Redis for reset tokens"],
  ["Messaging", "Kafka carries one topic, send-mail, consumed by utils"],
  ["AI", "Gemini, for résumé ATS scoring and career guidance"],
  ["Payments", "Razorpay, for the ₹119/month priority placement"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16">
      <p className="t-overline">About</p>
      <h1 className="t-h1 mt-3">Our mission at JobQ</h1>
      <p className="t-body-lg mt-5">
        JobQ exists to make the job search legible from both sides. Seekers
        should be able to narrow a list down to the roles that genuinely fit and
        apply once, with a profile they maintain in one place. Recruiters should
        be able to post a role and work through the applicants without leaving
        the page.
      </p>

      <h2 className="t-h2 mt-12">Built in the open</h2>
      <p className="t-body mt-3">
        JobQ is a working microservices application, not a mockup. Every part of
        it is on GitHub, including the pieces that are still rough.
      </p>

      <dl className="mt-6 border border-hairline bg-raised">
        {FACTS.map(([k, v], i) => (
          <div
            key={k}
            className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[140px_1fr] ${
              i > 0 ? "border-t border-hairline" : ""
            }`}
          >
            <dt className="t-overline pt-0.5">{k}</dt>
            <dd className="text-[15px] text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/jobs" className="btn-primary-sm">
          Browse open roles
        </Link>
        <a
          href="https://github.com/satyansh911/JobQ"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-line-strong px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
        >
          View the source
        </a>
      </div>
    </div>
  );
}
