"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Application, Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { formatSalary, postedAgo, ticketNumber } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/jq/identity";
import { OfflineState, Skeleton } from "@/components/jq/feedback";
import { LostTicket } from "@/components/jq/illustrations";
import { ApplyBar, ApplyCard, applyState } from "@/components/job-detail/apply-card";
import { ApplicantReview } from "@/components/job-detail/applicant-review";

export default function JobPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <JobDetail />
    </Suspense>
  );
}

function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user, isAuth, loading: authLoading, applications, applyJob, updateResume, btnLoading } = useAppData();

  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "offline">("loading");
  const [moreAtCompany, setMoreAtCompany] = useState(0);
  const [jobApplications, setJobApplications] = useState<Application[] | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${job_service}/api/job/${id}`);
      setJob(data);
      setState("ok");
      // Other open roles at the same company, for the company panel.
      axios
        .get(`${job_service}/api/job/company/${data.company_id}`)
        .then(({ data: c }) => setMoreAtCompany((c.jobs ?? []).filter((j: Job) => j.is_active && j.job_id !== data.job_id).length))
        .catch(() => {});
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setState(status === 404 ? "missing" : "offline");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = !!user && !!job && user.user_id === job.posted_by_recruiter_id;
  const publicView = params.get("view") === "public";

  useEffect(() => {
    if (!isOwner || publicView) return;
    axios
      .get(`${job_service}/api/job/application/${id}`, { headers: { Authorization: `Bearer ${Cookies.get("token")}` } })
      .then(({ data }) => setJobApplications(data))
      .catch(() => setJobApplications([]));
  }, [isOwner, publicView, id]);

  if (state === "loading" || authLoading) return <DetailSkeleton />;
  if (state === "offline") return <div className="container-app py-6"><OfflineState onRetry={load} /></div>;
  if (state === "missing" || !job) return <JobGone />;

  if (isOwner && !publicView) {
    return <ApplicantReview job={job} applications={jobApplications} onUpdated={setJobApplications} />;
  }

  const application = applications?.find((a) => String(a.job_id) === String(job.job_id));
  const current = applyState({ job, user, isAuth, application, isOwner });

  const apply = async () => {
    const app = await applyJob(job.job_id);
    if (!app) return;
    setJustApplied(true);
    toast.success("You're in the queue.", {
      description: `Ticket ${ticketNumber(app.application_id)}.`,
      action: { label: "View", onClick: () => router.push("/account") },
    });
  };

  const cardProps = {
    state: current,
    job,
    user,
    application,
    justApplied,
    busy: btnLoading,
    onApply: apply,
    onResume: (fd: FormData) => void updateResume(fd),
  };

  const facts: [string, string][] = [
    ["Salary", formatSalary(job.salary)],
    ["Location", job.location ?? "—"],
    ["Work mode", job.work_location],
    ["Job type", job.job_type],
    ["Openings", String(Math.round(Number(job.openings)))],
    ["Posted", postedAgo(job.created_at)],
  ];

  return (
    <>
      <div className="container-app flex flex-col gap-6 pt-6 pb-32 md:pb-20">
        <Link href={isOwner ? `/jobs/${job.job_id}` : "/jobs"} className="inline-flex min-h-11 items-center gap-1.5 self-start font-bold">
          <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
          {isOwner ? "Back to applicants" : "Back to roles"}
        </Link>

        <div className="flex flex-wrap items-start gap-10">
          {/* --- the job --- */}
          <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <div className="flex items-center gap-4 md:gap-5">
              <CompanyLogo name={job.company_name} src={job.company_logo} size={64} className="hidden md:grid" />
              <CompanyLogo name={job.company_name} src={job.company_logo} size={52} className="md:hidden" />
              <div className="min-w-0">
                <h1 className="mb-1.5 font-display text-[30px] leading-none font-extrabold tracking-[-0.03em] md:text-[48px]">{job.title}</h1>
                <p className="text-[16px] md:text-[18px]">
                  <Link href={`/company/${job.company_id}`} className="font-bold text-ink">{job.company_name}</Link>
                  {job.location && <span className="text-ink-muted"> · {job.location}</span>}
                </p>
              </div>
            </div>

            <dl className="grid overflow-hidden rounded-[10px] border-2 border-ink bg-card [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
              {facts.map(([dt, dd]) => (
                <div key={dt} className="-mr-[1.5px] -mb-[1.5px] border-r-[1.5px] border-b-[1.5px] border-line px-[18px] py-3.5">
                  <dt className="text-[13px] font-bold text-ink-muted">{dt}</dt>
                  <dd className="mt-0.5 text-[17px] font-bold">{dd}</dd>
                </div>
              ))}
            </dl>

            <Description text={job.description} />
          </article>

          {/* --- apply, nudge, company --- */}
          <aside className="flex w-full flex-[1_1_340px] flex-col gap-5 md:sticky md:top-24 md:max-w-[400px]">
            <div className="hidden md:block">
              <ApplyCard {...cardProps} />
            </div>

            {current === "can-apply" && !(user?.subscription && new Date(user.subscription) > new Date()) && (
              <div className="flex items-center gap-3 rounded-[10px] border-2 border-dashed border-ink bg-gold-tint px-4 py-3.5">
                <span className="size-3.5 flex-none rounded-full border-2 border-ink bg-gold" aria-hidden />
                <span className="flex-1 text-[15px]">
                  Want {job.company_name} to see you first?{" "}
                  <Link href="/subscribe" className="font-bold text-ink">Skip the line</Link>
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-[10px] border-2 border-ink bg-card p-5">
              <div className="flex items-center gap-3.5">
                <CompanyLogo name={job.company_name} src={job.company_logo} />
                <div className="min-w-0">
                  <b className="block text-[18px]">{job.company_name}</b>
                  {job.company_website && (
                    <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[15px]">
                      {job.company_website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      <ExternalLink className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </a>
                  )}
                </div>
              </div>
              {job.company_description && <p className="text-[15px] text-ink-soft">{job.company_description}</p>}
              {moreAtCompany > 0 && (
                <Link href={`/company/${job.company_id}`} className="inline-flex min-h-11 items-center text-[15px] font-bold">
                  See {moreAtCompany} more {moreAtCompany === 1 ? "role" : "roles"} at {job.company_name}
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>

      <ApplyBar {...cardProps} />
    </>
  );
}

/**
 * Recruiters write descriptions in a plain textarea. Blank lines split
 * paragraphs, a line ending in ":" becomes a heading, and lines starting
 * with "-", "*" or "•" become a list.
 */
function Description({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push(<p key={blocks.length} className="mb-3">{para.join(" ")}</p>);
    if (list.length) blocks.push(
      <ul key={blocks.length} className="mb-3 flex list-disc flex-col gap-1.5 pl-[22px]">
        {list.map((li, i) => <li key={i}>{li}</li>)}
      </ul>
    );
    para = [];
    list = [];
  };
  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (bullet) { if (para.length) flush(); list.push(bullet[1]); continue; }
    if (line.endsWith(":") && line.length < 60) {
      flush();
      blocks.push(<h2 key={blocks.length} className="mt-8 mb-2.5 font-display text-[22px] font-extrabold tracking-[-0.02em] md:text-[24px]">{line.slice(0, -1)}</h2>);
      continue;
    }
    if (list.length) flush();
    para.push(line);
  }
  flush();

  return (
    <div className="max-w-[42em] text-[17px] leading-[1.65] text-ink-soft">
      <h2 className="mt-2 mb-2.5 font-display text-[22px] font-extrabold tracking-[-0.02em] md:text-[24px]">About the role</h2>
      {blocks}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-app flex flex-col gap-5 pt-6 pb-20" role="status" aria-label="Loading job">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-[10px]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-2/3 max-w-[480px]" />
          <Skeleton className="h-4 w-1/3 max-w-[240px]" />
        </div>
      </div>
      <Skeleton className="h-[150px] rounded-[10px] md:h-[78px]" />
      <div className="flex max-w-[42em] flex-col gap-2.5">
        {[100, 92, 85, 70].map((w) => <Skeleton key={w} className="h-3.5" style={{ width: `${w}%` }} />)}
      </div>
    </div>
  );
}

function JobGone() {
  return (
    <div className="container-marketing flex flex-col items-center gap-4 py-16 text-center md:py-24">
      <LostTicket label="" className="w-[260px]" />
      <h1 className="t-h1 max-w-[14em]">This ticket isn&apos;t in our queue.</h1>
      <p className="max-w-[26em] text-[17px] text-ink-soft">The job was taken down by the company that posted it, or the link is old.</p>
      <Link href="/jobs" className={cn(buttonVariants())}>Browse jobs</Link>
    </div>
  );
}
