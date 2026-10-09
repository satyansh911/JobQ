"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, Check } from "lucide-react";
import { Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { formatSalary } from "@/lib/utils";
import CareerGuide from "@/components/career-guide";
import ResumeAnalyzer from "@/components/resume-analyser";

/* ================================================================== *
 * Header — signed-out marketing bar
 * ================================================================== */
const NAV = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/subscribe" },
  { label: "About", href: "/about" },
];

const LandingHeader = () => {
  const { isAuth } = useAppData();
  return (
    <header className="border-b border-hairline bg-raised">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 md:px-6">
        <Link href="/" aria-label="JobQ home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="JobQ" className="h-8 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="px-3 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {isAuth ? (
            <Link href="/jobs" className="btn-primary-sm">
              Open roles
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:text-ink"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-primary-sm">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

/* ================================================================== *
 * Hero
 * ================================================================== */
const Hero = () => (
  <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
    <h1 className="t-display max-w-[18ch]">
      Your next job.
      <br />
      In the queue.
    </h1>
    <p className="t-body-lg mt-6">
      Find roles that fit, apply with one profile, and always know where you
      stand. Hiring? Post a job and review every applicant in one place.
    </p>
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white hover:bg-steel-800"
      >
        Browse open roles
        <ArrowRight className="size-4" />
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center border border-line-strong px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
      >
        I&apos;m hiring
      </Link>
    </div>
    <p className="t-body-sm mt-4">
      Free to join. Priority placement is <span className="numeric">₹119</span>/month.
    </p>
  </section>
);

/* ================================================================== *
 * Product preview — the real listing, not an invented dashboard
 * ================================================================== */
const ListingPreview = ({ jobs }: { jobs: Job[] }) => (
  <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="t-h2">Open roles</h2>
      <Link href="/jobs" className="text-[15px] font-medium">
        See all roles →
      </Link>
    </div>

    <div className="border border-hairline bg-raised">
      {jobs.slice(0, 4).map((j) => (
        <Link
          key={j.job_id}
          href={`/jobs/${j.job_id}`}
          className="flex items-center gap-3 border-b border-hairline px-4 py-3 text-ink last:border-0 hover:bg-sunken"
        >
          <span className="flex size-9 shrink-0 items-center justify-center border border-hairline bg-sunken font-[family-name:var(--font-display)] text-[13px] font-semibold text-ink-3">
            {(j.company_name || "?")
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-display)] text-[16px] font-semibold">
              {j.title}
            </p>
            <p className="truncate text-[13px] text-ink-3">
              {j.company_name} · {j.location} · {j.job_type}
            </p>
          </div>
          <span className="numeric shrink-0 text-[14px] font-medium">
            {formatSalary(j.salary)}
          </span>
        </Link>
      ))}
      {jobs.length === 0 && (
        <p className="t-body-sm p-6">No roles are open right now. Check back soon.</p>
      )}
    </div>
  </section>
);

/* ================================================================== *
 * Audience sections
 * ================================================================== */
const Audience = ({
  title,
  lede,
  points,
}: {
  title: string;
  lede: string;
  points: { head: string; body: string }[];
}) => (
  <section className="border-t border-hairline">
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="t-h2">{title}</h2>
      <p className="t-body-lg mt-4">{lede}</p>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {points.map((p) => (
          <li key={p.head} className="border-t border-line-strong pt-4">
            <h3 className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-ink">
              {p.head}
            </h3>
            <p className="t-body-sm mt-1.5">{p.body}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

/* ================================================================== *
 * AI tools — the panels frame the live dialogs
 * ================================================================== */
const SCORE = [
  { label: "Formatting", value: 88 },
  { label: "Keywords", value: 62 },
  { label: "Structure", value: 81 },
  { label: "Readability", value: 80 },
];

const AITools = () => (
  <section id="features" className="border-t border-hairline bg-raised scroll-mt-20">
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="t-h2">Free tools for every account</h2>
      <p className="t-body-lg mt-4">
        Check how your résumé reads to screening software, and get a plan for
        the role you want next.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* --- ATS analyser --- */}
        <div className="border border-hairline bg-ground p-6">
          <h3 className="t-h3">Résumé ATS analyser</h3>
          <p className="t-body-sm mt-2">
            Drop a PDF and get a score out of 100, a breakdown across
            formatting, keywords, structure and readability, your strengths, and
            a prioritised list of what to fix.
          </p>

          <div className="my-6 flex items-center gap-6">
            <div>
              <p className="numeric font-[family-name:var(--font-display)] text-[3rem] font-semibold leading-none text-ink">
                78
              </p>
              <p className="t-body-sm">of 100</p>
            </div>
            <dl className="flex-1 space-y-1.5">
              {SCORE.map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-[13px]">
                  <dt className="w-24 shrink-0 text-ink-3">{s.label}</dt>
                  <dd className="flex flex-1 items-center gap-2">
                    <span className="h-1 flex-1 bg-sunken">
                      <span
                        className="block h-full bg-steel"
                        style={{ width: `${s.value}%` }}
                      />
                    </span>
                    <span className="numeric w-6 text-right text-ink-2">{s.value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <ResumeAnalyzer />
        </div>

        {/* --- Career guidance --- */}
        <div className="border border-hairline bg-ground p-6">
          <h3 className="t-h3">Career guidance</h3>
          <p className="t-body-sm mt-2">
            List what you can do today. Get roles worth aiming at, the
            responsibilities each carries, the skills to close the gap, and an
            order to learn them in.
          </p>

          <div className="my-6">
            <div className="flex flex-wrap gap-1.5">
              {["React", "TypeScript", "Next.js"].map((s) => (
                <span
                  key={s}
                  className="status-accent px-2 py-1 text-[13px]"
                >
                  {s}
                </span>
              ))}
              <span className="border border-dashed border-line-strong px-2 py-1 text-[13px] text-ink-3">
                + add a skill
              </span>
            </div>
            <ol className="mt-4 space-y-2">
              {[
                "Senior Frontend Engineer",
                "Full-stack Product Engineer",
                "Frontend Platform Engineer",
              ].map((r, i) => (
                <li key={r} className="flex gap-2.5 text-[13px] text-ink-2">
                  <span className="numeric shrink-0 text-ink-4">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
          <CareerGuide />
        </div>
      </div>
    </div>
  </section>
);

/* ================================================================== *
 * Final CTA + footer
 * ================================================================== */
const FinalCTA = () => (
  <section className="border-t border-hairline bg-raised">
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="t-h1 max-w-[16ch]">Close the tabs. Join the queue.</h2>
      <p className="t-body-lg mt-4">
        One profile, one résumé, and filters that actually narrow things down.
        Free to join.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white hover:bg-steel-800"
        >
          Browse open roles
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center border border-line-strong px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
        >
          Post a job
        </Link>
      </div>
    </div>
  </section>
);

const FOOTER = [
  {
    head: "Seekers",
    links: [
      ["Browse jobs", "/jobs"],
      ["Résumé analyser", "/#features"],
      ["Career guidance", "/#features"],
    ],
  },
  {
    head: "Recruiters",
    links: [
      ["Post a job", "/register"],
      ["Register a company", "/account"],
      ["Review applicants", "/account"],
    ],
  },
  {
    head: "JobQ",
    links: [
      ["About", "/about"],
      ["Pricing", "/subscribe"],
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-hairline">
    <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-6">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.png" alt="JobQ" className="h-7 w-auto" />
        <p className="t-body-sm mt-3 max-w-[34ch]">
          Jobs and hiring, in one queue.
        </p>
        <p className="t-body-sm mt-4 text-ink-4">© 2026 JobQ</p>
      </div>
      {FOOTER.map((col) => (
        <div key={col.head}>
          <p className="t-overline">{col.head}</p>
          <ul className="mt-3 space-y-1.5">
            {col.links.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-[14px]">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </footer>
);

/* ================================================================== *
 * Root
 * ================================================================== */
export default function LandingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    axios
      .get(`${job_service}/api/job/all`)
      .then(({ data }) => setJobs(data))
      .catch(() => setJobs([]));
  }, []);

  return (
    <>
      <LandingHeader />
      <Hero />
      <ListingPreview jobs={jobs} />
      <Audience
        title="For job seekers"
        lede="Narrow the list down to roles that genuinely fit, then apply with the profile and résumé you already have on file."
        points={[
          {
            head: "Filters that show what's left",
            body: "Every filter shows how many roles match before you click it.",
          },
          {
            head: "One profile, one résumé",
            body: "Bio, skills and a PDF, uploaded once and sent with every application.",
          },
          {
            head: "Status you can actually see",
            body: "See whether you're submitted, hired or rejected, right from your account.",
          },
        ]}
      />
      <Audience
        title="For recruiters"
        lede="Post a role and every applicant lands in one table, résumé one click away. Hire or reject without leaving the page."
        points={[
          {
            head: "Up to three companies",
            body: "Each with its own logo, description, website and posting list.",
          },
          {
            head: "Applicant review in a table",
            body: "Name, email, résumé, date and status, with priority applicants first.",
          },
          {
            head: "Candidates hear back",
            body: "Applicants get an email the moment you update their status.",
          },
        ]}
      />
      <AITools />
      <FinalCTA />
      <Footer />
    </>
  );
}
