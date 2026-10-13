"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Company, Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { cn, formatSalary } from "@/lib/utils";
import { shortDate } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/jq/identity";
import { JobChip } from "@/components/jq/status";
import { OfflineState, Skeleton } from "@/components/jq/feedback";
import { LostTicket, OpenCounter } from "@/components/jq/illustrations";
import { JobRow } from "@/components/job-row";
import { CompanyDialog } from "@/components/recruiter/company-dialog";
import { DeleteJobDialog, JobDialog } from "@/components/recruiter/job-dialog";
import { DeleteCompanyDialog } from "@/components/recruiter/delete-company-dialog";
import { authHeaders, JobStats, plural, siteLabel } from "@/components/recruiter/shared";

export default function CompanyPage() {
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyView />
    </Suspense>
  );
}

function CompanySkeleton() {
  return (
    <div className="container-app flex flex-col gap-8 pt-8 pb-20 md:pt-12" role="status" aria-label="Loading company">
      <div className="flex gap-6 rounded-[10px] border-2 border-ink bg-card p-6 md:p-8">
        <Skeleton className="size-20 rounded-[10px] md:size-[116px]" />
        <div className="flex flex-1 flex-col gap-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-3/4" /></div>
      </div>
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[76px] rounded-[10px]" />)}
    </div>
  );
}

/** "18 in the queue / 3 Priority", "22 applicants / 2 hired · 20 rejected" */
function ApplicantSummary({ job, s }: { job: Job; s?: JobStats }) {
  if (!s) return <span className="text-ink-muted">—</span>;
  if (s.total === 0) return <span className="text-ink-muted">No applicants yet</span>;
  const decided = [s.hired && `${s.hired} hired`, s.rejected && `${s.rejected} rejected`].filter(Boolean).join(" · ");
  return (
    <span className="flex flex-col">
      <Link href={`/jobs/${job.job_id}`} className="font-bold">
        {s.in_queue > 0 && job.is_active !== false ? `${s.in_queue} in the queue` : plural(s.total, "applicant")}
      </Link>
      {s.priority > 0 ? (
        <span className="flex items-center gap-1.5 text-[14px] text-ink-soft">
          <span className="size-3.5 rounded-full border-2 border-ink bg-gold" aria-hidden />
          {s.priority} Priority
        </span>
      ) : decided ? (
        <span className="text-[14px] text-ink-soft">{decided}</span>
      ) : null}
    </span>
  );
}

function CompanyView() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAppData();

  const [company, setCompany] = useState<Company | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "offline">("loading");
  const [stats, setStats] = useState<Record<number, JobStats>>({});

  const [posting, setPosting] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [editingCompany, setEditingCompany] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);

  const isOwner = !!user && !!company && user.user_id === company.recruiter_id;

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${job_service}/api/job/company/${id}`);
      setCompany(data);
      setState("ready");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setState(status === 404 || status === 400 ? "missing" : !status || status >= 502 ? "offline" : "missing");
    }
  }, [id]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get<JobStats[]>(`${job_service}/api/job/company/${id}/stats`, authHeaders());
      setStats(Object.fromEntries(data.map((s) => [s.job_id, s])));
    } catch {
      /* counts are extra; the table still works without them */
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isOwner) loadStats();
  }, [isOwner, loadStats]);

  const jobs = useMemo(
    () =>
      [...(company?.jobs ?? [])].sort(
        (a, b) => Number(b.is_active !== false) - Number(a.is_active !== false) || +new Date(b.created_at) - +new Date(a.created_at)
      ),
    [company]
  );

  // Deep links: ?post=1 from My companies, ?edit=<job> from the applicant review.
  useEffect(() => {
    if (!isOwner) return;
    const edit = params.get("edit");
    const post = params.get("post");
    if (!edit && !post) return;
    if (post) setPosting(true);
    if (edit) {
      const job = jobs.find((j) => String(j.job_id) === edit);
      if (job) setEditingJob(job);
    }
    router.replace(pathname, { scroll: false });
  }, [isOwner, params, jobs, router, pathname]);

  if (state === "loading" || (state === "ready" && authLoading)) return <CompanySkeleton />;
  if (state === "offline") return <div className="container-app py-12"><OfflineState onRetry={load} /></div>;
  if (state === "missing" || !company) {
    return (
      <div className="container-app flex flex-col items-center gap-4 py-16 text-center">
        <LostTicket className="w-[260px]" label="" />
        <h1 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em]">We can&apos;t find that company.</h1>
        <p className="text-ink-soft">It may have been deleted, or the link is wrong.</p>
        <Link href={user?.role === "recruiter" ? "/account" : "/jobs"} className={buttonVariants({ variant: "primary" })}>
          {user?.role === "recruiter" ? "My companies" : "Browse jobs"}
        </Link>
      </div>
    );
  }

  const openJobs = jobs.filter((j) => j.is_active !== false);
  const totalApplications = Object.values(stats).reduce((n, s) => n + s.total, 0);
  const upsert = (job: Job) =>
    setCompany((c) => c && { ...c, jobs: [job, ...(c.jobs ?? []).filter((j) => j.job_id !== job.job_id)] });

  const header = (
    <section className="flex flex-col gap-4 rounded-[10px] border-2 border-ink bg-card p-5 shadow-hard-lg md:flex-row md:gap-7 md:p-7">
      <div className="flex items-center gap-4 md:items-start">
        <CompanyLogo name={company.name} src={company.logo} size={116} className="max-md:!size-16 max-md:!text-[22px]" />
        <div className="min-w-0 md:hidden">
          <h1 className="font-display text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em] break-words">{company.name}</h1>
          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[15px]">{siteLabel(company.website)}</a>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4 max-md:hidden">
          <h1 className="min-w-0 font-display text-[44px] leading-none font-extrabold tracking-[-0.035em] break-words lg:text-[56px]">{company.name}</h1>
          {isOwner && (
            <div className="flex gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setEditingCompany(true)}><Pencil strokeWidth={2.5} /> Edit</Button>
              <Button variant="secondary" size="sm" className="border-red-deep text-red-deep" onClick={() => setDeletingCompany(true)}><Trash2 strokeWidth={2.5} /> Delete</Button>
            </div>
          )}
        </div>
        <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start font-bold max-md:hidden">
          {siteLabel(company.website)} <ExternalLink className="size-4" strokeWidth={2.5} aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <p className="max-w-[46em] text-ink-soft">{company.description}</p>
        {isOwner && (
          <div className="flex gap-2.5 md:hidden">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditingCompany(true)}><Pencil strokeWidth={2.5} /> Edit</Button>
            <Button variant="secondary" size="sm" className="flex-1 border-red-deep text-red-deep" onClick={() => setDeletingCompany(true)}><Trash2 strokeWidth={2.5} /> Delete</Button>
          </div>
        )}
      </div>
    </section>
  );

  /* ---------------- public view ---------------- */
  if (!isOwner) {
    return (
      <div className="container-app flex flex-col gap-8 pt-6 pb-20 md:pt-12">
        {header}
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-[30px] leading-none font-extrabold tracking-[-0.03em] md:text-[40px]">
            Open roles <span className="text-[0.6em] text-ink-muted">{openJobs.length}</span>
          </h2>
          {openJobs.length === 0 ? (
            <p className="rounded-[10px] border-2 border-dashed border-ink bg-paper-deep px-5 py-6 text-ink-soft">
              {company.name} isn&apos;t hiring right now. Check back soon, or <Link href="/jobs" className="font-bold">browse other jobs</Link>.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {openJobs.map((j) => <JobRow key={j.job_id} job={{ ...j, company_name: company.name, company_logo: company.logo }} />)}
            </ul>
          )}
        </section>
      </div>
    );
  }

  /* ---------------- owner view ---------------- */
  return (
    <div className="container-app flex flex-col gap-6 pt-6 pb-20 md:gap-8 md:pt-9">
      <nav aria-label="Breadcrumb" className="text-[15px] text-ink-soft">
        <Link href="/account" className="font-bold">My companies</Link> / <span aria-current="page">{company.name}</span>
      </nav>
      {header}

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[30px] leading-none font-extrabold tracking-[-0.03em] md:text-[40px]">
            Jobs <span className="text-[0.6em] text-ink-muted">{jobs.length}</span>
          </h2>
          {jobs.length > 0 && <Button onClick={() => setPosting(true)}><Plus strokeWidth={2.75} /> Post a job</Button>}
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-dashed border-ink px-6 py-10 text-center">
            <OpenCounter className="w-[200px]" label="" />
            <h3 className="font-display text-[26px] leading-none font-extrabold tracking-[-0.03em]">No jobs posted yet.</h3>
            <p className="text-ink-soft">Post your first role and applicants will queue up here.</p>
            <Button onClick={() => setPosting(true)} className="mt-1 max-md:w-full">Post a job</Button>
          </div>
        ) : (
          <>
            {/* 1024+: table */}
            <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-card max-lg:hidden">
              <table className="w-full text-left">
                <thead className="border-b-2 border-ink text-[14px]">
                  <tr>
                    {["Job", "Where", "Salary", "Applicants", "Posted", "Status"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const closed = j.is_active === false;
                    const openings = Math.round(Number(j.openings));
                    return (
                      <tr key={j.job_id} className={cn("border-t-[1.5px] border-line first:border-t-0", closed && "bg-paper")}>
                        <td className="px-4 py-3.5">
                          <Link href={`/jobs/${j.job_id}`} className={cn("font-bold", closed ? "text-ink-muted" : "text-ink")}>{j.title}</Link>
                          <div className="text-[14px] text-ink-soft">{j.job_type} · {plural(openings, "opening")}</div>
                        </td>
                        <td className={cn("px-4 py-3.5", closed && "text-ink-muted")}>
                          {j.location === j.work_location || j.location === "Remote" ? j.location : `${j.location} · ${j.work_location}`}
                        </td>
                        <td className={cn("px-4 py-3.5 font-bold whitespace-nowrap", closed && "text-ink-muted")}>{formatSalary(j.salary)}</td>
                        <td className="px-4 py-3.5"><ApplicantSummary job={j} s={stats[j.job_id]} /></td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-ink-soft">{shortDate(j.created_at)}</td>
                        <td className="px-4 py-3.5"><JobChip active={!closed} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link href={`/jobs/${j.job_id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shadow-none")}>
                              {closed ? "View applicants" : "Review applicants"}
                            </Link>
                            <Button variant="secondary" size="icon" className="size-11 shadow-none" aria-label={`Edit ${j.title}`} onClick={() => setEditingJob(j)}>
                              <Pencil strokeWidth={2.5} />
                            </Button>
                            <Button variant="secondary" size="icon" className="size-11 shadow-none" aria-label={`Delete ${j.title}`} onClick={() => setDeletingJob(j)}>
                              <Trash2 strokeWidth={2.5} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* below 1024: cards */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {jobs.map((j) => {
                const closed = j.is_active === false;
                return (
                  <li key={j.job_id} className={cn("flex flex-col gap-3 rounded-[10px] border-2 border-ink p-4", closed ? "bg-paper" : "bg-card")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/jobs/${j.job_id}`} className={cn("font-bold", closed ? "text-ink-muted" : "text-ink")}>{j.title}</Link>
                        <div className="text-[14px] text-ink-soft">
                          {[j.location, j.location === j.work_location ? null : j.work_location, formatSalary(j.salary)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <JobChip active={!closed} />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <ApplicantSummary job={j} s={stats[j.job_id]} />
                      <div className="flex gap-2">
                        <Button variant="secondary" size="icon" className="size-11 shadow-none" aria-label={`Edit ${j.title}`} onClick={() => setEditingJob(j)}><Pencil strokeWidth={2.5} /></Button>
                        <Button variant="secondary" size="icon" className="size-11 shadow-none" aria-label={`Delete ${j.title}`} onClick={() => setDeletingJob(j)}><Trash2 strokeWidth={2.5} /></Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <JobDialog
        open={posting || !!editingJob}
        onOpenChange={(o) => { if (!o) { setPosting(false); setEditingJob(null); } }}
        companyId={company.company_id}
        companyName={company.name}
        job={editingJob}
        applicants={editingJob ? stats[editingJob.job_id]?.total ?? 0 : 0}
        onSaved={(job, created) => {
          upsert(job);
          if (created) {
            toast.success(`${job.title} is live. Applicants can start queueing.`, {
              action: { label: "View job", onClick: () => router.push(`/jobs/${job.job_id}`) },
            });
            loadStats();
          } else {
            toast.success("Job saved.");
          }
        }}
        onDelete={(job) => { setEditingJob(null); setDeletingJob(job); }}
      />
      <DeleteJobDialog
        job={deletingJob}
        applicants={deletingJob ? stats[deletingJob.job_id]?.total ?? 0 : 0}
        onOpenChange={(o) => !o && setDeletingJob(null)}
        onDeleted={(job) => {
          setCompany((c) => c && { ...c, jobs: (c.jobs ?? []).filter((x) => x.job_id !== job.job_id) });
          toast.success(`${job.title} is deleted.`);
        }}
        onClosedInstead={(job) => {
          upsert(job);
          toast.success(`${job.title} is closed. Nobody new can apply.`);
        }}
      />
      <CompanyDialog open={editingCompany} onOpenChange={setEditingCompany} company={company} onSaved={(c) => { setCompany((old) => old && { ...old, ...c }); toast.success("Company saved."); }} />
      <DeleteCompanyDialog
        company={deletingCompany ? company : null}
        jobs={jobs.length}
        applications={totalApplications}
        onOpenChange={(o) => !o && setDeletingCompany(false)}
        onDeleted={() => {
          toast.success(`${company.name} is deleted.`);
          router.replace("/account");
        }}
      />
    </div>
  );
}
