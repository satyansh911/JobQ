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
    <p className="t-overline">Two-sided hiring · India</p>
    <h1 className="t-display mt-4 max-w-[18ch]">
      Your next job.
      <br />
      In the queue.
    </h1>
    <p className="t-body-lg mt-6">
      JobQ is a hiring platform for both sides of the table. Seekers filter down
      to the roles that fit and apply with one profile. Recruiters post, review
      and decide in the same place. Two AI tools score your résumé and map a
      path to the role you want.
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
      Free to join. No credit card. Priority placement is{" "}
      <span className="numeric">₹119</span>/month if you want it.
    </p>
  </section>
);

/* ================================================================== *
 * What is actually running — real architecture, no marketing numbers
 * ================================================================== */
const RUNNING = [
  { figure: "6", label: "services — auth, user, job, payment, utils, web" },
  { figure: "2", label: "live AI tools, Gemini-backed" },
  { figure: "1", label: "Postgres, shared across services" },
  { figure: "₹119", label: "per month, priority placement" },
];

const Running = () => (
  <section className="border-y border-hairline bg-raised">
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
      <p className="t-overline">What is actually running</p>
      <dl className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {RUNNING.map((s) => (
          <div key={s.label}>
            <dt className="numeric font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-none text-ink">
              {s.figure}
            </dt>
            <dd className="t-body-sm mt-2">{s.label}</dd>
          </div>
        ))}
      </dl>
      <p className="t-body-sm mt-8 max-w-[72ch]">
        Kafka carries one topic, <code className="font-mono text-[12.5px]">send-mail</code>.
        Redis holds password-reset tokens. Cloudinary stores files, with local
        disk as the fallback. Razorpay takes the payment.
      </p>
    </div>
  </section>
);

/* ================================================================== *
 * Product preview — the real listing, not an invented dashboard
 * ================================================================== */
const ListingPreview = ({ jobs }: { jobs: Job[] }) => (
  <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="t-h2">
        The job listing — {jobs.length > 0 ? <span className="numeric">{jobs.length}</span> : "no"}{" "}
        {jobs.length === 1 ? "role" : "roles"} open today
      </h2>
      <Link href="/jobs" className="text-[15px] font-medium">
        Open /jobs →
      </Link>
    </div>

    <div className="border border-hairline bg-raised">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
        <span className="inline-block size-2.5 border border-line-strong" />
        <span className="ml-auto mr-auto text-[12.5px] font-mono text-ink-3">
          jobq.app/jobs
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
        <div className="hidden border-r border-hairline p-4 md:block">
          <p className="t-overline mb-3">Filters</p>
          {[
            { head: "Work location", items: ["Any", "Remote", "Hybrid"] },
            { head: "Job type", items: ["Full-time", "Internship"] },
          ].map((g) => (
            <div key={g.head} className="mb-4">
              <p className="t-overline mb-1.5">{g.head}</p>
              {g.items.map((i) => (
                <p key={i} className="text-[14px] text-ink-2">
                  {i}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div>
          {jobs.slice(0, 3).map((j) => (
            <div
              key={j.job_id}
              className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0"
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
                <p className="truncate font-[family-name:var(--font-display)] text-[16px] font-semibold text-ink">
                  {j.title}
                </p>
                <p className="truncate text-[13px] text-ink-3">
                  {j.company_name} · {j.location} · {j.job_type}
                </p>
              </div>
              <span className="numeric shrink-0 text-[14px] font-medium text-ink">
                {formatSalary(j.salary)}
              </span>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="t-body-sm p-6">No roles are open right now.</p>
          )}
        </div>
      </div>
    </div>
  </section>
);

/* ================================================================== *
 * Audience sections
 * ================================================================== */
const Audience = ({
  index,
  eyebrow,
  title,
  lede,
  points,
}: {
  index: string;
  eyebrow: string;
  title: string;
  lede: string;
  points: { head: string; body: string }[];
}) => (
  <section className="border-t border-hairline">
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <p className="t-overline">
        {index} · {eyebrow}
      </p>
      <h2 className="t-h2 mt-3">{title}</h2>
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
      <p className="t-overline">03 · Included with every account</p>
      <h2 className="t-h2 mt-3">Two tools, working right here.</h2>
      <p className="t-body-lg mt-4">
        Not a screenshot. Both run against Gemini from the utils service. Sign
        in, paste your skills or drop a PDF, and read what comes back.
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
                "Senior Frontend Engineer — own a design system and the performance budget",
                "Full-stack Product Engineer — add Postgres and a queue to what you already ship",
                "Frontend Platform Engineer — build the tooling the other teams use",
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
 * Honest state — replaces the invented testimonials
 * ================================================================== */
const Honest = ({ jobs }: { jobs: Job[] }) => {
  const companies = new Set(jobs.map((j) => j.company_name)).size;
  const cities = new Set(
    jobs.map((j) => j.location).filter((l) => l && l !== "Remote")
  ).size;
  const salaries = jobs
    .map((j) => Number(j.salary))
    .filter((n) => Number.isFinite(n) && n > 0);
  const range =
    salaries.length > 0
      ? `₹${Math.round(Math.min(...salaries) / 100000)}–${Math.round(
          Math.max(...salaries) / 100000
        )}`
      : "—";

  const facts = [
    { figure: String(jobs.length), label: `roles open across ${companies} companies` },
    { figure: range, label: "LPA range on live postings" },
    { figure: String(cities), label: "cities plus remote" },
    { figure: "Open", label: "source — the whole stack is on GitHub" },
  ];

  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="t-h2">JobQ is new, and says so</h2>
          <p className="t-body-sm">Updated 27 August 2026</p>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="border-t border-line-strong pt-4">
              <dt className="numeric font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-none text-ink">
                {f.figure}
              </dt>
              <dd className="t-body-sm mt-2">{f.label}</dd>
            </div>
          ))}
        </dl>

        <p className="t-body mt-8">
          No testimonials, no logo wall, no invented user counts. Those come
          later, from real people. What we can show now is what the product does
          and what runs behind it.
        </p>
      </div>
    </section>
  );
};

/* ================================================================== *
 * Final CTA + footer
 * ================================================================== */
const FinalCTA = () => (
  <section className="border-t border-hairline bg-raised">
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
      <h2 className="t-h1 max-w-[16ch]">Close the tabs. Join the queue.</h2>
      <p className="t-body-lg mt-4">
        One profile, one résumé, and a filter rail that actually narrows. Free
        to join — priority placement is the only thing that costs anything.
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
      ["Pricing", "/subscribe"],
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
    head: "Project",
    links: [
      ["About", "/about"],
      ["GitHub", "https://github.com/satyansh911/JobQ"],
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
          A two-sided job portal built as a microservices system. Get in the
          queue.
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

  // The honest-state figures are read from the live listing, so they cannot
  // drift away from what the product actually has.
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
      <Running />
      <ListingPreview jobs={jobs} />
      <Audience
        index="01"
        eyebrow="For job seekers"
        title="Narrow first, then apply once."
        lede="Every facet sits in a rail beside the results with a live count, so you can see a filter is a dead end before you spend a click on it. When you find the role, you apply with the profile and résumé already on file."
        points={[
          {
            head: "Nine filter facets with counts",
            body: "Keyword, location, work location, type, salary floor, role, company, openings, posted date.",
          },
          {
            head: "One profile, one résumé",
            body: "Bio, skills and a PDF, uploaded once and sent with every application.",
          },
          {
            head: "Status you can actually see",
            body: "Submitted, Rejected or Hired — on the row, on the detail page, and in your account.",
          },
        ]}
      />
      <Audience
        index="02"
        eyebrow="For recruiters"
        title="Post it, then work the list."
        lede="Register a company, post a role, and every applicant lands in one table with their résumé one click away. Move a candidate from Submitted to Hired or Rejected without leaving the page."
        points={[
          {
            head: "Up to three companies",
            body: "Each with its own logo, description, website and posting list.",
          },
          {
            head: "Applicant review in a table",
            body: "Name, email, résumé, applied date, status — with subscribers surfaced first.",
          },
          {
            head: "Mail without the wait",
            body: "Status changes queue onto Kafka, so the response never blocks on SMTP.",
          },
        ]}
      />
      <AITools />
      <Honest jobs={jobs} />
      <FinalCTA />
      <Footer />
    </>
  );
}
