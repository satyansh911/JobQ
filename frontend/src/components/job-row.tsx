"use client";

import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Application, Job } from "@/type";
import { cn } from "@/lib/utils";
import { formatSalary, postedAgo, ticketNumber, STATUS_COPY } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/jq/identity";
import { Skeleton } from "@/components/jq/feedback";

/** Where an application stands, as a dashed token in place of Apply. */
function AppliedToken({ application }: { application: Application }) {
  const tone =
    application.status === "Hired"
      ? "border-hired bg-hired-tint text-hired"
      : application.status === "Rejected"
        ? "border-rejected bg-rejected-tint text-rejected"
        : "border-queue bg-queue-tint text-queue";
  const copy = STATUS_COPY[application.status as keyof typeof STATUS_COPY] ?? STATUS_COPY.Submitted;
  return (
    <Link
      href="/account"
      className={cn(
        "inline-flex min-h-11 flex-none items-center gap-2 rounded-[10px] border-2 border-dashed px-3.5 font-bold no-underline",
        tone
      )}
    >
      {application.status === "Submitted" && <Clock className="size-4" strokeWidth={2.75} aria-hidden />}
      {ticketNumber(application.application_id)} · {copy.seekerChip}
    </Link>
  );
}

/**
 * One posting in the listing. Compact: logo, title (wraps to two lines),
 * company, plain meta, then salary and Apply — or the applied token.
 */
export function JobRow({ job, application }: { job: Job; application?: Application }) {
  const openings = Math.round(Number(job.openings));
  const meta = [
    job.location,
    job.location === job.work_location ? null : job.work_location,
    job.job_type,
    openings > 0 ? `${openings} ${openings === 1 ? "opening" : "openings"}` : null,
  ].filter(Boolean) as string[];

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[10px] border-2 border-ink bg-card px-4 py-4 md:px-5">
      <CompanyLogo name={job.company_name} src={job.company_logo} size={52} />
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
        <Link
          href={`/jobs/${job.job_id}`}
          className="max-w-[26em] text-[18px] leading-[1.3] font-bold text-ink no-underline hover:underline"
        >
          {job.title}
        </Link>
        <span className="text-ink-muted">{job.company_name}</span>
        <span className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[14px] text-ink-soft">
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </span>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 md:w-auto md:flex-nowrap md:justify-end">
        <div className="whitespace-nowrap md:min-w-[110px] md:text-right">
          <span className="font-display text-[20px] font-extrabold">{formatSalary(job.salary)}</span>
          <span className="text-[13px] text-ink-muted md:block">
            <span className="md:hidden"> · </span>
            {postedAgo(job.created_at)}
          </span>
        </div>
        {application ? (
          <AppliedToken application={application} />
        ) : (
          <Link
            href={`/jobs/${job.job_id}`}
            aria-label={`Apply for ${job.title} at ${job.company_name}`}
            className={cn(buttonVariants({ size: "sm" }), "shadow-hard-sm px-[22px]")}
          >
            Apply
          </Link>
        )}
      </div>
    </li>
  );
}

/** Same height as a real row, so nothing jumps when results arrive. */
export function JobRowSkeleton() {
  return (
    <li className="flex items-center gap-4 rounded-[10px] border-2 border-ink bg-card px-5 py-4" aria-hidden>
      <Skeleton className="size-[52px] flex-none rounded-[10px]" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3.5 w-1/4" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="hidden h-5 w-20 md:block" />
      <Skeleton className="h-11 w-24 rounded-[10px]" />
    </li>
  );
}
