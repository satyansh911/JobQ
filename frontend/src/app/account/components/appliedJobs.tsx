"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Application } from "@/type";
import { formatSalary, cn } from "@/lib/utils";
import { StatusBadge, statusKind } from "@/components/status-badge";

const TABS = ["All", "Submitted", "Hired", "Rejected"] as const;

const AppliedJobs = ({ applications }: { applications: Application[] }) => {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const list = applications || [];
  const filtered = tab === "All" ? list : list.filter((a) => a.status === tab);
  const countFor = (t: string) =>
    t === "All" ? list.length : list.filter((a) => a.status === t).length;

  return (
    <section className="mt-6 border border-hairline bg-raised">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
        <h2 className="t-h3">Applications</h2>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={cn(
                "border px-2.5 py-1 text-[13px]",
                tab === t
                  ? "border-primary bg-primary text-white"
                  : "border-line-strong text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
              )}
            >
              {t} <span className="numeric">{countFor(t)}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="t-body-sm">
            {list.length === 0
              ? "You haven't applied to anything yet."
              : `No ${tab.toLowerCase()} applications.`}
          </p>
          {list.length === 0 && (
            <Link href="/jobs" className="btn-primary-sm mt-4">
              Browse open roles
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Role", "Salary", "Applied", "Status", ""].map((h) => (
                    <th key={h} className="t-overline px-6 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.application_id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-3">
                      <p className="font-[family-name:var(--font-display)] text-[16px] font-semibold text-ink">
                        {a.job_title}
                      </p>
                      <p className="t-body-sm">{a.job_location}</p>
                    </td>
                    <td className="numeric px-6 py-3 text-[15px] text-ink">
                      {formatSalary(a.job_salary)}
                    </td>
                    <td className="numeric px-6 py-3 text-[14px] text-ink-3">
                      {new Date(a.applied_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge kind={statusKind(a.status)}>{a.status}</StatusBadge>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/jobs/${a.job_id}`} className="text-[14px]">
                        View job
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {list.length <= 2 && (
            <p className="t-body-sm border-t border-hairline px-6 py-4">
              Nothing here changes until a recruiter moves you.{" "}
              <Link href="/jobs">Browse open roles</Link>.
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default AppliedJobs;
