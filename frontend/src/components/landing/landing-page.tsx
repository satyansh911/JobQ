"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight, Clock, MapPin, Search, Star } from "lucide-react";
import { Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { formatSalary, postedAgo } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/jq/identity";
import { Tag } from "@/components/jq/status";
import { Skeleton } from "@/components/jq/feedback";
import { HeroQueue } from "@/components/landing/hero-queue";

const CITIES = ["Bengaluru", "Hyderabad", "Pune", "Delhi", "Mumbai", "Chennai", "Kolkata", "Remote"];

/* ================================================================== *
 * Hero · headline, search, the queue
 * ================================================================== */
function Hero() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city) params.set("city", city);
    const qs = params.toString();
    router.push(`/jobs${qs ? `?${qs}` : ""}`);
  };

  return (
    <section className="container-marketing grid items-center gap-10 pt-12 pb-16 md:gap-14 md:pt-[72px] md:pb-[88px] lg:grid-cols-2 [&>*]:min-w-0">
      <div className="flex flex-col gap-6 md:gap-7">
        <h1 className="font-display text-[clamp(48px,7vw,92px)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance">
          Your next job is in this <span className="text-red">line.</span>
        </h1>
        <p className="max-w-[30em] text-[18px] text-ink-soft md:text-[20px]">
          Roles from companies hiring freshers and early-career engineers across India. Make one
          profile, apply in a tap, and follow every application by its ticket number.
        </p>

        <form
          role="search"
          onSubmit={search}
          className="flex max-w-[600px] flex-wrap overflow-hidden rounded-[10px] border-2 border-ink bg-card shadow-hard"
        >
          <label className="flex min-h-[60px] basis-full items-center gap-2.5 px-4 sm:flex-[2_1_220px]">
            <Search className="size-5 flex-none text-ink-muted" strokeWidth={2.25} aria-hidden />
            <span className="sr-only">Job title, skill or company</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Job title, skill or company"
              className="w-full bg-transparent text-[17px] text-ink placeholder:text-ink-muted"
            />
          </label>
          <label className="flex min-h-[60px] flex-1 items-center gap-2 border-t-2 border-ink px-4 sm:flex-[1_1_150px] sm:border-t-0 sm:border-l-2">
            <MapPin className="size-[18px] flex-none text-ink-muted" strokeWidth={2.25} aria-hidden />
            <span className="sr-only">City</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-[17px] text-ink"
            >
              <option value="">Any city</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="min-h-[60px] flex-none border-t-2 border-l-2 border-ink bg-red px-5 text-[17px] font-bold text-white hover:bg-red-deep sm:border-t-0 sm:px-7"
          >
            Search<span className="hidden sm:inline"> jobs</span>
          </button>
        </form>

        <p className="text-[16px] text-ink-muted">
          Hiring?{" "}
          <Link href="/register?role=recruiter" className="font-bold">
            Post a job for free
          </Link>
        </p>
      </div>

      <figure className="flex justify-center">
        <HeroQueue className="w-full max-w-[560px]" />
      </figure>
    </section>
  );
}

/* ================================================================== *
 * Open this week · real postings as tickets
 * ================================================================== */
function JobTicket({ job }: { job: Job }) {
  const openings = Math.round(Number(job.openings));
  const meta = [job.location, job.location === job.work_location ? null : job.work_location, job.job_type].filter(
    Boolean
  ) as string[];

  return (
    <article
      className="ticket flex flex-col gap-4 rounded-[10px] border-2 border-ink bg-card px-7 py-6 shadow-hard"
      style={{ "--hole": "var(--color-paper-deep)" } as React.CSSProperties}
    >
      <div className="flex items-center gap-3.5">
        <CompanyLogo name={job.company_name} src={job.company_logo} />
        <div className="min-w-0">
          <h3 className="font-sans text-[19px] leading-[1.25] font-bold tracking-normal">
            <Link href={`/jobs/${job.job_id}`} className="text-ink no-underline hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="text-[15px] text-ink-muted">
            {job.company_name}
            {openings > 1 && ` · ${openings} openings`}
            <span className="sm:hidden"> · {meta.slice(0, 2).join(" · ")}</span>
          </p>
        </div>
      </div>
      <div className="hidden flex-wrap gap-2 sm:flex">
        {meta.map((m) => (
          <Tag key={m}>{m}</Tag>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed border-ink pt-4">
        <div>
          <div className="font-display text-[24px] leading-none font-extrabold">{formatSalary(job.salary)}</div>
          <div className="mt-1 text-[14px] text-ink-muted">{postedAgo(job.created_at)}</div>
        </div>
        <Link
          href={`/jobs/${job.job_id}`}
          aria-label={`Apply for ${job.title} at ${job.company_name}`}
          className={cn(buttonVariants({ size: "sm" }), "shadow-none")}
        >
          Apply
        </Link>
      </div>
    </article>
  );
}

function OpenThisWeek() {
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    axios
      .get(`${job_service}/api/job/all`)
      .then(({ data }) =>
        setJobs(
          (data as Job[])
            .filter((j) => j.is_active !== false)
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
            .slice(0, 3)
        )
      )
      .catch(() => setJobs([]));
  }, []);

  // With nothing to show, the band is better left out than shown empty.
  if (jobs && jobs.length === 0) return null;

  return (
    <section className="border-y-2 border-ink bg-paper-deep">
      <div className="container-marketing flex flex-col gap-8 pt-14 pb-16 md:pt-16 md:pb-[72px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">
            Open this week
          </h2>
          <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 font-bold">
            See all roles
            <ArrowRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
        <div className="grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
          {jobs
            ? jobs.map((j, i) => (
                <div key={j.job_id} className={cn("flex flex-col [&>article]:h-full", i === 2 && "hidden md:flex")}>
                  <JobTicket job={j} />
                </div>
              ))
            : [0, 1, 2].map((i) => <Skeleton key={i} className="h-[238px] rounded-[10px]" />)}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * For seekers · what a ticket looks like
 * ================================================================== */
function ExampleTicket({
  token,
  title,
  company,
  children,
  className,
}: {
  token: string;
  title: string;
  company: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ticket flex items-stretch rounded-[10px] border-2 border-ink bg-card shadow-hard", className)}>
      <div className="perforation flex w-[92px] flex-none flex-col justify-center py-[18px] pl-4 sm:w-[108px] sm:pl-[22px]">
        <span className="text-[13px] text-ink-muted">Ticket</span>
        <span className="font-display text-[19px] font-extrabold tracking-[-0.02em] whitespace-nowrap sm:text-[22px]">{token}</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2.5 py-[18px] pr-6 pl-4 sm:gap-3 sm:pr-7 sm:pl-[22px]">
        <div className="min-w-0">
          <div className="font-bold">{title}</div>
          <div className="hidden text-[15px] text-ink-muted sm:block">{company}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

function ForSeekers() {
  return (
    <section className="container-marketing grid items-center gap-12 py-16 md:gap-16 md:py-24 lg:grid-cols-2 [&>*]:min-w-0">
      <div className="flex flex-col gap-7">
        <h2 className="font-display text-[38px] leading-none font-extrabold tracking-[-0.03em] md:text-[52px]">
          Looking for work?
        </h2>
        <p className="text-[17px] text-ink-soft md:hidden">
          Fill your profile once. Every application gets a ticket number, and we email you the
          moment a recruiter decides.
        </p>
        <dl className="hidden flex-col gap-[22px] md:flex">
          {[
            ["Fill your profile once", "Add your résumé, skills and a short bio. Every application uses it, so applying takes one tap."],
            ["Every application gets a ticket", "Your ticket number shows where each one stands. We email you the moment a recruiter decides."],
            ["Filter the way you search", "City, salary, work mode, job type and when it was posted. Remote roles sit right alongside the rest."],
          ].map(([dt, dd]) => (
            <div key={dt}>
              <dt className="text-[19px] font-bold">{dt}</dt>
              <dd className="mt-1 text-[17px] text-ink-soft">{dd}</dd>
            </div>
          ))}
        </dl>
        <div className="hidden md:block">
          <Link href="/jobs" className={cn(buttonVariants({ variant: "ink" }), "min-h-[52px] px-6")}>
            Browse jobs
          </Link>
        </div>
      </div>

      {/* An example of the dashboard, not live data. */}
      <div
        role="img"
        aria-label="Example tickets: one in the queue, one hired, one not this time"
        className="flex flex-col gap-5 p-2"
      >
        <ExampleTicket token="Q-0142" title="Senior Frontend Engineer" company="Northwind Labs" className="hidden -rotate-[1.5deg] md:flex">
          <span className="inline-flex flex-none items-center gap-1.5 rounded-[10px] border-[1.5px] border-queue bg-queue-tint px-3 py-[5px] text-[14px] font-bold text-queue">
            <Clock className="size-3.5" strokeWidth={2.75} aria-hidden />
            In the queue
          </span>
        </ExampleTicket>
        <ExampleTicket token="Q-0098" title="Engineering Intern" company="Fernpath Analytics" className="rotate-1 sm:ml-8">
          <span className="stamp flex-none bg-hired-tint !text-[17px] text-hired sm:!text-[20px]">You&apos;re up!</span>
        </ExampleTicket>
        <ExampleTicket token="Q-0077" title="DevOps Engineer" company="Cobalt Systems" className="hidden -rotate-[0.5deg] md:flex">
          <span className="inline-flex flex-none items-center rounded-[10px] border-[1.5px] border-rejected bg-rejected-tint px-3 py-[5px] text-[14px] font-bold text-rejected">
            Not this time
          </span>
        </ExampleTicket>
        <div className="pt-2 md:hidden">
          <Link href="/jobs" className={cn(buttonVariants({ variant: "ink" }), "min-h-[52px] px-6")}>
            Browse jobs
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * For recruiters · the "Now serving" board
 * ================================================================== */
function ForRecruiters({ isRecruiter }: { isRecruiter: boolean }) {
  const rows = [
    { name: "Ananya Rao", date: "9 Oct", status: "Hired", priority: true },
    { name: "Rohit Menon", date: "10 Oct", status: "In the queue", priority: false },
    { name: "Sana Qureshi", date: "11 Oct", status: "In the queue", priority: false },
  ];
  return (
    <section className="bg-ink text-paper">
      <div className="container-marketing grid items-center gap-12 py-16 md:gap-16 md:py-24 lg:grid-cols-2 [&>*]:min-w-0">
        {/* An example of applicant review, not live data. */}
        <div
          role="img"
          aria-label="Example applicant table: a priority applicant marked hired, two others in the queue"
          className="order-2 hidden overflow-hidden rounded-[10px] border-2 border-paper bg-card text-ink shadow-[6px_6px_0_var(--color-red)] md:block lg:order-1"
        >
          <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-red px-5 py-3.5 text-white">
            <span className="font-bold">Now serving · DevOps Engineer</span>
            <span className="text-[14px]">12 applicants</span>
          </div>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-ink-muted">
                <th className="px-5 py-3 font-bold">Applicant</th>
                <th className="px-2 py-3 font-bold">Applied</th>
                <th className="px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className={cn("border-t-[1.5px] border-line", r.priority && "bg-gold-tint")}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {r.priority ? (
                        <span className="grid size-[22px] flex-none place-items-center rounded-full border-2 border-ink bg-gold">
                          <Star className="size-3 fill-ink" strokeWidth={0} aria-hidden />
                        </span>
                      ) : (
                        <span className="w-[22px] flex-none" />
                      )}
                      <b>{r.name}</b>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-ink-muted">{r.date}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "rounded-[10px] border-[1.5px] px-2.5 py-[3px] text-[13px] font-bold whitespace-nowrap",
                        r.status === "Hired"
                          ? "border-hired bg-hired-tint text-hired"
                          : "border-queue bg-queue-tint text-queue"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="order-1 flex flex-col gap-7 lg:order-2">
          <h2 className="font-display text-[38px] leading-none font-extrabold tracking-[-0.03em] text-paper md:text-[52px]">
            Hiring for a small team?
          </h2>
          <dl className="flex flex-col gap-[22px]">
            {[
              ["Up to three companies, one account", "Add each company with its logo and website, then post roles under it."],
              ["Every applicant in one table", "Open a résumé, mark someone Hired or Rejected, and we email them for you."],
            ].map(([dt, dd]) => (
              <div key={dt}>
                <dt className="text-[19px] font-bold">{dt}</dt>
                <dd className="mt-1 text-[17px] text-[#E6DACB]">{dd}</dd>
              </div>
            ))}
          </dl>
          <div>
            <Link
              href={isRecruiter ? "/account" : "/register?role=recruiter"}
              className="inline-flex min-h-[52px] items-center rounded-[10px] border-2 border-paper bg-red px-6 font-bold text-white no-underline hover:bg-red-deep hover:text-white"
            >
              Post a job
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * AI tools
 * ================================================================== */
function AITools({ toolsHref }: { toolsHref: string }) {
  const secondary = cn(buttonVariants({ variant: "secondary" }), "self-start");
  return (
    <section id="features" className="container-marketing flex scroll-mt-24 flex-col gap-10 py-16 md:py-24">
      <h2 className="max-w-[14em] font-display text-[38px] leading-none font-extrabold tracking-[-0.03em] md:text-[52px]">
        Two free tools for before you apply
      </h2>
      <div className="grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
        <article className="grid items-start gap-7 rounded-[10px] border-2 border-ink bg-card p-6 shadow-hard sm:grid-cols-[auto_1fr] md:p-8">
          <div
            aria-hidden
            className="grid size-[132px] place-items-center rounded-full border-2 border-ink"
            style={{ background: "conic-gradient(var(--color-red) 0 78%, #EADFCC 78% 100%)" }}
          >
            <div className="grid size-24 place-items-center rounded-full border-2 border-ink bg-card text-center leading-none">
              <span>
                <span className="font-display text-[34px] font-extrabold">78</span>
                <br />
                <span className="text-[13px] text-ink-muted">out of 100</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <h3 className="font-display text-[28px] font-extrabold tracking-[-0.02em]">Résumé checker</h3>
            <p className="text-[17px] text-ink-soft">
              Upload your résumé as a PDF. You get an ATS score, a line of feedback on formatting,
              keywords, structure and readability, and fixes sorted by what matters most.
            </p>
            <Link href={toolsHref} className={secondary}>
              Check my résumé
            </Link>
          </div>
        </article>

        <article className="flex flex-col gap-3.5 rounded-[10px] border-2 border-ink bg-card p-6 shadow-hard md:p-8">
          <div className="flex flex-wrap items-center gap-2" aria-hidden>
            {["Python", "SQL", "Excel"].map((s) => (
              <span key={s} className="rounded-[10px] border-[1.5px] border-ink bg-paper-deep px-3 py-1.5 text-[15px]">
                {s}
              </span>
            ))}
            <ArrowRight className="size-6" strokeWidth={2.5} />
            <span className="rounded-[10px] bg-ink px-3 py-1.5 text-[15px] font-bold text-paper">Data Analyst</span>
          </div>
          <h3 className="font-display text-[28px] font-extrabold tracking-[-0.02em]">Career guidance</h3>
          <p className="text-[17px] text-ink-soft">
            Add the skills you have. We suggest roles that fit, explain why, and give you a learning
            plan for the skills you are missing.
          </p>
          <Link href={toolsHref} className={secondary}>
            Get career guidance
          </Link>
        </article>
      </div>
    </section>
  );
}

/* ================================================================== *
 * Priority · the gold ticket
 * ================================================================== */
function Priority() {
  return (
    <section className="container-marketing pb-16 md:pb-24">
      <div
        className="ticket flex -rotate-1 flex-wrap items-stretch rounded-[10px] border-[3px] border-ink bg-gold shadow-hard-xl"
        style={{ "--hole": "var(--color-paper)" } as React.CSSProperties}
      >
        <div className="flex flex-[1_1_520px] flex-col gap-4 px-8 py-10 md:px-14 md:py-12">
          <h2 className="font-display text-[clamp(44px,6vw,72px)] leading-[0.95] font-extrabold tracking-[-0.035em]">
            Skip the line.
          </h2>
          <p className="max-w-[26em] text-[18px] md:text-[20px]">
            Your applications go to the top of every recruiter&apos;s list, with a gold mark next to your name.
          </p>
        </div>
        <div className="flex flex-[1_1_280px] flex-col justify-center gap-4 border-t-[3px] border-dashed border-ink px-8 py-8 md:flex-[0_1_320px] md:border-t-0 md:border-l-[3px] md:px-12 md:py-10">
          <div>
            <span className="font-display text-[56px] leading-none font-extrabold tracking-[-0.03em]">₹119</span>
            <span className="text-[18px] font-bold"> / month</span>
          </div>
          <Link
            href="/priority"
            className="press inline-flex min-h-[52px] items-center justify-center rounded-[10px] border-2 border-ink bg-ink px-6 font-bold text-gold no-underline shadow-[4px_4px_0_var(--color-card)] [--press-shadow:var(--color-card)] hover:text-gold"
          >
            Get Priority
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * Final call to action · signed-out only
 * ================================================================== */
function FinalCTA() {
  return (
    <section className="border-t-2 border-ink bg-red text-white">
      <div className="container-marketing flex flex-wrap items-center justify-between gap-8 py-16 md:py-[88px]">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-none font-extrabold tracking-[-0.035em] text-white">
            Make your profile once.
          </h2>
          <p className="text-[18px] md:text-[20px]">Then apply to as many roles as you like. It&apos;s free.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="press inline-flex min-h-14 items-center rounded-[10px] border-2 border-ink bg-paper px-7 text-[18px] font-bold text-ink no-underline shadow-hard hover:text-ink"
          >
            Create free account
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center font-bold text-white hover:text-white">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * Root
 * ================================================================== */
export default function LandingPage() {
  const { isAuth, user } = useAppData();
  const isRecruiter = user?.role === "recruiter";
  // The AI tools need an account; signed-out visitors sign in first.
  const toolsHref = isAuth ? "/account#ai-tools" : "/login?next=%2Faccount%23ai-tools";

  return (
    <>
      <Hero />
      <OpenThisWeek />
      <ForSeekers />
      <ForRecruiters isRecruiter={isRecruiter} />
      {!isRecruiter && <AITools toolsHref={toolsHref} />}
      {!isRecruiter && <Priority />}
      {!isAuth && <FinalCTA />}
    </>
  );
}
