"use client";

import React from "react";
import Link from "next/link";
import { Job } from "@/type";
import { formatSalary, cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const postedLabel = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Posted ${months} ${months === 1 ? "month" : "months"} ago`;
};

export function JobRow({ job, applied }: { job: Job; applied?: boolean }) {
  const closed = !job.is_active;

  return (
    <article
      className={cn(
        "border border-hairline bg-raised p-4 md:p-5",
        closed && "opacity-75"
      )}
    >
      <div className="flex gap-4">
        {/* logo tile — square, per the system; avatars are the only circles */}
        <div className="hidden size-11 shrink-0 items-center justify-center overflow-hidden border border-hairline bg-sunken sm:flex">
          {job.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.company_logo}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-3">
              {initials(job.company_name || "?")}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
            <h3 className="t-h3">
              <Link href={`/jobs/${job.job_id}`} className="text-ink hover:text-steel-700">
                {job.title}
              </Link>
            </h3>
            {closed && (
              <span className="status-bad mt-1 px-1.5 py-0.5 text-[12px] font-medium">
                Closed
              </span>
            )}
          </div>

          <p className="t-body-sm mt-0.5">
            <Link href={`/company/${job.company_id}`} className="text-ink-2 hover:text-steel-700">
              {job.company_name}
            </Link>
          </p>

          <ul className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
            {job.location && <li>{job.location}</li>}
            <li aria-hidden>·</li>
            <li>{job.work_location}</li>
            <li aria-hidden>·</li>
            <li>{job.job_type}</li>
            {Number(job.openings) > 0 && (
              <>
                <li aria-hidden>·</li>
                <li>
                  <span className="numeric">{Math.round(Number(job.openings))}</span>{" "}
                  {Math.round(Number(job.openings)) === 1 ? "opening" : "openings"}
                </li>
              </>
            )}
          </ul>

          <p className="t-body-sm mt-2 line-clamp-2 max-w-[62ch] text-ink-2">
            {job.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="numeric font-[family-name:var(--font-display)] text-[17px] font-semibold text-ink">
              {formatSalary(job.salary)}
            </span>
            <span className="t-body-sm">{postedLabel(job.created_at)}</span>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/jobs/${job.job_id}`}
                className="border border-line-strong px-3 py-1.5 font-[family-name:var(--font-display)] text-[14px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
              >
                Details
              </Link>
              {applied ? (
                <span className="status-ok px-3 py-1.5 text-[14px] font-medium">
                  Applied
                </span>
              ) : (
                !closed && (
                  <Link
                    href={`/jobs/${job.job_id}`}
                    className="border border-primary bg-primary px-3 py-1.5 font-[family-name:var(--font-display)] text-[14px] font-semibold text-white hover:bg-steel-800"
                  >
                    Apply
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Same geometry as a real row, so nothing jumps when content arrives. */
export function JobRowSkeleton() {
  return (
    <div className="border border-hairline bg-raised p-4 md:p-5">
      <div className="flex gap-4">
        <div className="skeleton hidden size-11 shrink-0 sm:block" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="skeleton h-5 w-2/5" />
          <div className="skeleton h-3.5 w-1/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-4/5" />
          <div className="flex items-center gap-3 pt-1">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-4 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
