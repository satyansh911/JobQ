"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Application, Job } from "@/type";
import { job_service } from "@/context/AppContext";
import { apiError, cn } from "@/lib/utils";
import { formatSalary, shortDate } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/jq/identity";
import { JobChip } from "@/components/jq/status";
import { NumberRoll } from "@/components/jq/ticket";
import { TakeANumber } from "@/components/jq/illustrations";

type Status = "Submitted" | "Hired" | "Rejected";
const LABEL: Record<Status, string> = { Submitted: "In the queue", Hired: "Hired", Rejected: "Rejected" };
const TONE: Record<Status, string> = {
  Submitted: "border-queue bg-queue-tint text-queue",
  Hired: "border-hired bg-hired-tint text-hired",
  Rejected: "border-rejected bg-rejected-tint text-rejected",
};
const PAGE = 20;

function GoldLabel() {
  return (
    <span className="inline-flex items-center rounded-[10px] border-[1.5px] border-ink bg-gold px-2 text-[12px] font-bold text-ink">
      Priority
    </span>
  );
}

/** Status control for one applicant. The candidate is emailed on Hired or Rejected. */
function StatusSelect({
  application,
  name,
  onChange,
}: {
  application: Application;
  name: string;
  onChange: (s: Status) => void;
}) {
  const status = application.status as Status;
  return (
    <SelectPrimitive.Root value={status} onValueChange={(v) => v !== status && onChange(v as Status)}>
      <SelectPrimitive.Trigger
        aria-label={`Status for ${name}: ${LABEL[status]}`}
        className={cn(
          "inline-flex min-h-11 min-w-[170px] items-center justify-between gap-2 rounded-[10px] border-2 pr-2.5 pl-3 font-bold",
          TONE[status]
        )}
      >
        <SelectPrimitive.Value />
        <ChevronDown className="size-4" strokeWidth={2.5} aria-hidden />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 w-[230px] rounded-[10px] border-2 border-ink bg-card p-1.5 shadow-hard"
        >
          <SelectPrimitive.Viewport>
            {(["Submitted", "Hired", "Rejected"] as Status[]).map((s) => (
              <SelectPrimitive.Item
                key={s}
                value={s}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[8px] px-3 font-bold outline-none data-[highlighted]:bg-paper-deep",
                  s === "Submitted" ? "text-queue" : s === "Hired" ? "text-hired" : "text-rejected"
                )}
              >
                <span className="w-4">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" strokeWidth={3} />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{LABEL[s]}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <p className="t-help mx-3 mt-1 mb-2 !text-[13px]">
            {name.split(" ")[0]} gets an email when you pick Hired or Rejected.
          </p>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function ApplicantReview({
  job,
  applications,
  onUpdated,
}: {
  job: Job;
  applications: Application[] | null;
  onUpdated: (next: Application[]) => void;
}) {
  const [tab, setTab] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(PAGE);
  const list = applications ?? [];

  const counts = {
    all: list.length,
    Submitted: list.filter((a) => a.status === "Submitted").length,
    Hired: list.filter((a) => a.status === "Hired").length,
    Rejected: list.filter((a) => a.status === "Rejected").length,
  };
  const priorityCount = list.filter((a) => a.subscribed).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((a) => tab === "all" || a.status === tab)
      .filter((a) => !q || `${a.applicant_name ?? ""} ${a.applicant_email}`.toLowerCase().includes(q));
  }, [list, tab, search]);

  const setStatus = async (a: Application, status: Status) => {
    const name = a.applicant_name || a.applicant_email;
    try {
      await axios.put(
        `${job_service}/api/job/application/update/${a.application_id}`,
        { status },
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
      );
      onUpdated(list.map((x) => (x.application_id === a.application_id ? { ...x, status } : x)));
      toast.success(
        status === "Submitted" ? `${name} is back in the queue.` : `${name} marked ${LABEL[status]}.`,
        status === "Submitted" ? undefined : { description: "They've been emailed." }
      );
    } catch (err) {
      toast.error(apiError(err, "That didn't save. Please try again."));
    }
  };

  const meta = [
    job.location,
    job.location === job.work_location ? null : job.work_location,
    job.job_type,
    formatSalary(job.salary),
    `${Math.round(Number(job.openings))} openings`,
    `posted ${shortDate(job.created_at)}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="container-app flex flex-col gap-[22px] pt-6 pb-24">
      <nav aria-label="Breadcrumb" className="text-[15px]">
        <Link href="/account" className="font-bold">My companies</Link> <span className="text-ink-muted">/</span>{" "}
        <Link href={`/company/${job.company_id}`} className="font-bold">{job.company_name}</Link>{" "}
        <span className="text-ink-muted">/ {job.title}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">{job.title}</h1>
            <JobChip active={job.is_active} />
          </div>
          <span className="text-[16px] text-ink-muted">{meta}</span>
        </div>
        <div className="flex gap-2.5">
          <Link href={`/jobs/${job.job_id}?view=public`} className={buttonVariants({ variant: "secondary", size: "sm" })}>View public page</Link>
          <Link href={`/company/${job.company_id}?edit=${job.job_id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Edit job</Link>
        </div>
      </div>

      {/* Now serving */}
      <section aria-label="Queue summary" className="flex flex-wrap items-center gap-x-7 gap-y-3 rounded-[10px] bg-ink px-6 py-[18px] text-paper shadow-hard-red">
        <span className="font-bold text-gold">Now serving</span>
        <div className="flex flex-wrap gap-8">
          {([["Submitted", "in the queue"], ["Hired", "hired"], ["Rejected", "rejected"]] as const).map(([k, l]) => (
            <div key={k}>
              <NumberRoll value={String(counts[k])} className="font-display text-[36px] leading-none font-extrabold" />{" "}
              <span className="text-[#E6DACB]">{l}</span>
            </div>
          ))}
        </div>
        {priorityCount > 0 && (
          <span className="inline-flex items-center gap-2 text-[#E6DACB] md:ml-auto">
            <GoldLabel /> {priorityCount} {priorityCount === 1 ? "applicant paid" : "applicants paid"} to be seen first
          </span>
        )}
      </section>

      {applications === null ? (
        <div className="h-40 rounded-[10px] border-2 border-ink bg-card skeleton" aria-label="Loading applicants" />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-ink bg-card px-6 py-12 text-center">
          <TakeANumber label="" className="w-[220px]" />
          <h2 className="t-h2">Nobody in line yet.</h2>
          <p className="max-w-[28em] text-ink-soft">Applicants show up here the moment they apply, and you&apos;ll see their résumé one click away.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink">
            <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setShown(PAGE); }}>
              <TabsList className="border-b-0" aria-label="Filter applicants">
                <TabsTrigger value="all">All {counts.all}</TabsTrigger>
                <TabsTrigger value="Submitted">In the queue {counts.Submitted}</TabsTrigger>
                <TabsTrigger value="Hired">Hired {counts.Hired}</TabsTrigger>
                <TabsTrigger value="Rejected">Rejected {counts.Rejected}</TabsTrigger>
              </TabsList>
            </Tabs>
            <label className="w-full pb-2 sm:w-[280px]">
              <span className="sr-only">Search applicants</span>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="min-h-11 text-[15px]" />
            </label>
          </div>

          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-[10px] border-2 border-ink bg-card md:block">
            <table className="w-full border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-[13px] text-ink-muted">
                  {["Applicant", "Résumé", "Applied", "Status"].map((h) => (
                    <th key={h} scope="col" className="border-b-2 border-ink px-4 py-2.5 font-bold whitespace-nowrap">{h}</th>
                  ))}
                  <th scope="col" className="border-b-2 border-ink px-4 py-2.5"><span className="sr-only">Profile</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, shown).map((a) => {
                  const name = a.applicant_name || a.applicant_email;
                  return (
                    <tr key={a.application_id} className={cn("border-b-[1.5px] border-line last:border-0", a.subscribed && "bg-gold-tint")}>
                      <td className={cn("px-4 py-2.5", a.subscribed && "shadow-[inset_6px_0_0_var(--color-gold)]")}>
                        <div className="flex items-center gap-3">
                          <Avatar name={name} src={a.applicant_pic} size={40} />
                          <div className="min-w-0">
                            <b>{name}</b> {a.subscribed && <><GoldLabel /><span className="sr-only">Priority applicant</span></>}
                            {a.applicant_name && (
                              <>
                                <br />
                                <span className="text-ink-muted">{a.applicant_email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><a href={a.resume} target="_blank" rel="noopener noreferrer" className="font-bold">View PDF</a></td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-muted">{shortDate(a.applied_at)}</td>
                      <td className="px-4 py-2.5"><StatusSelect application={a} name={name} onChange={(s) => setStatus(a, s)} /></td>
                      <td className="px-4 py-2.5"><Link href={`/account/${a.applicant_id}?job=${job.job_id}&application=${a.application_id}`} className="font-bold">Profile</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-line px-4 py-3">
              <span className="text-ink-muted">
                Showing {Math.min(shown, rows.length)} of {rows.length} · Priority first, then oldest first
              </span>
              {rows.length > shown && (
                <button onClick={() => setShown((s) => s + PAGE)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  Show {Math.min(PAGE, rows.length - shown)} more
                </button>
              )}
            </div>
          </div>

          {/* phone cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.slice(0, shown).map((a) => {
              const name = a.applicant_name || a.applicant_email;
              return (
                <li key={a.application_id} className={cn("flex flex-col gap-3 rounded-[10px] border-2 border-ink p-4", a.subscribed ? "bg-gold-tint shadow-[inset_6px_0_0_var(--color-gold)]" : "bg-card")}>
                  <div className="flex items-center gap-3">
                    <Avatar name={name} src={a.applicant_pic} size={40} />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate">{name}</b>
                      {a.applicant_name && <span className="block truncate text-[14px] text-ink-muted">{a.applicant_email}</span>}
                    </div>
                    {a.subscribed && <GoldLabel />}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusSelect application={a} name={name} onChange={(s) => setStatus(a, s)} />
                    <span className="flex gap-4 text-[15px]">
                      <a href={a.resume} target="_blank" rel="noopener noreferrer" className="font-bold">Résumé</a>
                      <Link href={`/account/${a.applicant_id}?job=${job.job_id}&application=${a.application_id}`} className="font-bold">Profile</Link>
                    </span>
                  </div>
                  <span className="t-help">Applied {shortDate(a.applied_at)}</span>
                </li>
              );
            })}
          </ul>

          {rows.length === 0 && <p className="text-ink-muted">Nobody matches that search.</p>}
        </>
      )}
    </div>
  );
}
