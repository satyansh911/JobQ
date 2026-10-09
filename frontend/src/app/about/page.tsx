import React from "react";
import Link from "next/link";

const FOR_SEEKERS = [
  "Filters that show how many roles match before you click",
  "One profile and résumé, sent with every application",
  "A clear status on everything you have applied to",
  "Free résumé checks and career guidance",
];

const FOR_RECRUITERS = [
  "Post a role in a couple of minutes",
  "Every applicant in one table, résumé one click away",
  "Update a status and the candidate is emailed",
  "Up to three companies per account",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16">
      <h1 className="t-h1">About JobQ</h1>
      <p className="t-body-lg mt-5">
        Job hunting means a lot of waiting in line. JobQ tries to make the line
        shorter and easier to see, for both sides. Seekers narrow the list to
        roles that genuinely fit and apply once. Recruiters post a role and work
        through applicants without leaving the page.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="t-h3">If you&apos;re looking</h2>
          <ul className="mt-3 space-y-2">
            {FOR_SEEKERS.map((item) => (
              <li key={item} className="t-body">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="t-h3">If you&apos;re hiring</h2>
          <ul className="mt-3 space-y-2">
            {FOR_RECRUITERS.map((item) => (
              <li key={item} className="t-body">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/jobs" className="btn-primary-sm">
          Browse open roles
        </Link>
        <Link
          href="/register"
          className="border border-line-strong px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
        >
          Post a job
        </Link>
      </div>
    </div>
  );
}
