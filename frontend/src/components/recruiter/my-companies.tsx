"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { job_service, useAppData } from "@/context/AppContext";
import { User } from "@/type";
import { Button, buttonVariants } from "@/components/ui/button";
import { CompanyLogo } from "@/components/jq/identity";
import { OfflineState, Skeleton } from "@/components/jq/feedback";
import { OpenCounter } from "@/components/jq/illustrations";
import { EditProfile } from "@/components/dashboard/seeker-dashboard";
import { CompanyDialog } from "./company-dialog";
import { authHeaders, CompanyWithCounts, MAX_COMPANIES, plural, siteLabel } from "./shared";

function isOffline(err: unknown) {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return !status || status >= 502;
}

function CompanyCard({ c }: { c: CompanyWithCounts }) {
  return (
    <li className="relative flex flex-col gap-4 rounded-[10px] border-2 border-ink bg-card p-4 shadow-hard md:gap-[18px] md:p-6">
      <div className="flex items-center gap-3.5 md:gap-4">
        <CompanyLogo name={c.name} src={c.logo} size={64} className="max-md:!size-12 max-md:!text-[17px]" />
        <div className="min-w-0">
          <h2 className="font-display text-[19px] leading-[1.1] font-extrabold tracking-[-0.02em] break-words md:text-[26px]">
            <Link href={`/company/${c.company_id}`} className="text-ink no-underline max-md:after:absolute max-md:after:inset-0 md:pointer-events-none">{c.name}</Link>
          </h2>
          <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[14px] max-md:text-ink-muted max-md:no-underline md:text-[15px]">
            {siteLabel(c.website)}
          </a>
        </div>
      </div>
      <p className="line-clamp-3 text-ink-soft max-md:hidden">{c.description}</p>
      {/* phones: one line of counts */}
      <p className="text-[14px] md:hidden">
        {plural(c.open_jobs, "open job")} · <b>{c.in_queue} in the queue</b>
      </p>
      <dl className="grid grid-cols-2 overflow-hidden rounded-[10px] border-[1.5px] border-line bg-paper max-md:hidden">
        <div className="px-4 py-3">
          <dt className="sr-only">Open jobs</dt>
          <dd className="font-display text-[26px] leading-none font-extrabold">{c.open_jobs}</dd>
          <dd className="mt-2 text-[14px] text-ink-soft">
            {c.open_jobs === 1 ? "open job" : "open jobs"}
            {c.closed_jobs > 0 && ` · ${c.closed_jobs} closed`}
          </dd>
        </div>
        <div className="border-l-[1.5px] border-line px-4 py-3">
          <dt className="sr-only">Applicants waiting</dt>
          <dd className="font-display text-[26px] leading-none font-extrabold">{c.in_queue}</dd>
          <dd className="mt-2 text-[14px] text-ink-soft">in the queue</dd>
        </div>
      </dl>
      <div className="mt-auto grid grid-cols-2 gap-3 max-md:hidden">
        <Link href={`/company/${c.company_id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Open company</Link>
        <Link href={`/company/${c.company_id}?post=1`} className={buttonVariants({ variant: "primary", size: "sm" })}>Post a job</Link>
      </div>
    </li>
  );
}

export function MyCompanies({ user }: { user: User }) {
  const router = useRouter();
  const { backendOnline } = useAppData();
  const [companies, setCompanies] = useState<CompanyWithCounts[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${job_service}/api/job/company/all`, authHeaders());
      setCompanies(data);
      setOffline(false);
    } catch (err) {
      if (isOffline(err)) setOffline(true);
      else toast.error("Couldn't load your companies.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const count = companies?.length ?? 0;
  const full = count >= MAX_COMPANIES;

  const heading = (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-[34px] leading-none font-extrabold tracking-[-0.035em] md:text-[56px]">My companies</h1>
          {companies && <span className="font-bold text-ink-muted md:hidden">{count} of {MAX_COMPANIES}</span>}
        </div>
        {companies && count > 0 && (
          <p className="text-ink-soft max-md:hidden">
            {count} of {MAX_COMPANIES} companies. Each one gets its own page and its own jobs.
          </p>
        )}
        {companies && full && (
          <div className="mt-1 flex max-w-[420px] gap-2" aria-hidden>
            {Array.from({ length: MAX_COMPANIES }).map((_, i) => <span key={i} className="h-2.5 flex-1 rounded-full border-2 border-ink bg-red" />)}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 max-md:hidden">
        <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
          <Pencil strokeWidth={2.5} /> Your details
        </Button>
        {companies && count > 0 && (
          <Button onClick={() => setAdding(true)} disabled={full}>
            <Plus strokeWidth={2.75} /> Add company
          </Button>
        )}
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (offline || (!companies && !backendOnline)) {
    body = <OfflineState variant="inline" onRetry={load} detail="Your companies will be back in a minute." />;
  } else if (!companies) {
    body = (
      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading your companies">
        {[0, 1].map((i) => (
          <li key={i} className="flex flex-col gap-4 rounded-[10px] border-2 border-ink bg-card p-6">
            <div className="flex items-center gap-4"><Skeleton className="size-16 rounded-[10px]" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-3.5 w-1/3" /></div></div>
            <Skeleton className="h-3.5" /><Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-[72px] rounded-[10px]" />
            <div className="grid grid-cols-2 gap-3"><Skeleton className="h-11 rounded-[10px]" /><Skeleton className="h-11 rounded-[10px]" /></div>
          </li>
        ))}
      </ul>
    );
  } else if (count === 0) {
    body = (
      <section className="mx-auto flex max-w-[520px] flex-col items-center gap-4 rounded-[10px] border-2 border-ink bg-card px-6 py-10 text-center md:px-10 md:py-12">
        <OpenCounter className="w-[220px]" label="" />
        <h2 className="font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] md:text-[32px]">Open your first counter.</h2>
        <p className="text-ink-soft">Add the company you&apos;re hiring for. You&apos;ll post jobs under it and see everyone who applies.</p>
        <Button onClick={() => setAdding(true)} className="mt-1">Add company</Button>
      </section>
    );
  } else {
    body = (
      <>
        <ul className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {companies.map((c) => <CompanyCard key={c.company_id} c={c} />)}
          {!full && (
            <li className="max-md:hidden">
              <button
                onClick={() => setAdding(true)}
                className="flex size-full min-h-[300px] flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-ink p-6 text-center hover:bg-paper-deep"
              >
                <span className="grid size-[66px] place-items-center rounded-[10px] border-2 border-ink bg-card shadow-hard"><Plus className="size-7" strokeWidth={2.5} aria-hidden /></span>
                <b className="font-display text-[24px] tracking-[-0.03em]">Add a company</b>
                <span className="text-ink-soft">
                  {MAX_COMPANIES - count === 1 ? "You have room for one more." : `You have room for ${MAX_COMPANIES - count} more.`}
                </span>
              </button>
            </li>
          )}
        </ul>
        {full ? (
          <p className="max-w-[560px] rounded-[10px] border-2 border-dashed border-ink bg-paper-deep px-4 py-3 text-[15px]">
            You&apos;ve added {MAX_COMPANIES} companies, the most one account can have. Delete one to make room for another.
          </p>
        ) : (
          <button onClick={() => setAdding(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-ink font-bold md:hidden">
            <Plus className="size-4" strokeWidth={3} aria-hidden /> Add a company
          </button>
        )}
      </>
    );
  }

  return (
    <div className="container-app flex flex-col gap-6 pt-6 pb-20 md:gap-8 md:pt-12 md:pb-24">
      {heading}
      {body}
      <Button variant="ghost" size="sm" className="self-start md:hidden" onClick={() => setEditingProfile(true)}>
        <Pencil strokeWidth={2.5} /> Your details
      </Button>

      <CompanyDialog
        open={adding}
        onOpenChange={setAdding}
        onSaved={(c) => {
          toast.success(`${c.name} is added. Post its first job.`);
          router.push(`/company/${c.company_id}`);
        }}
      />
      <EditProfile user={user} open={editingProfile} onOpenChange={setEditingProfile} />
    </div>
  );
}
