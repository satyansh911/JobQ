"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, FileText, Mail, Phone } from "lucide-react";
import { job_service, user_service, useAppData } from "@/context/AppContext";
import { Application, Job, User } from "@/type";
import { apiError, cn } from "@/lib/utils";
import { ticketNumber } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/jq/identity";
import { Tag } from "@/components/jq/status";
import { Skeleton } from "@/components/jq/feedback";
import { LostTicket } from "@/components/jq/illustrations";
import { authHeaders } from "@/components/recruiter/shared";
import { priorityUntil } from "@/components/marketing/pricing-ctas";

type Status = "Submitted" | "Hired" | "Rejected";
const LABEL: Record<Status, string> = { Submitted: "In the queue", Hired: "Hired", Rejected: "Rejected" };
const TICKET_TONE: Record<Status, string> = {
  Submitted: "border-queue bg-queue-tint",
  Hired: "border-hired bg-hired-tint",
  Rejected: "border-rejected bg-rejected-tint",
};
const TEXT_TONE: Record<Status, string> = { Submitted: "text-queue", Hired: "text-hired", Rejected: "text-rejected" };

/** The first résumé link that still opens. Our own /uploads files can be checked; others are trusted. */
async function firstWorking(urls: (string | null | undefined)[]) {
  for (const url of urls) {
    if (!url) continue;
    if (!url.startsWith("/")) return url;
    try {
      if ((await fetch(url, { method: "HEAD" })).ok) return url;
    } catch {
      /* try the next one */
    }
  }
  return null;
}

function applied(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  return today ? `Today, ${time}` : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
}

export default function ApplicantProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ApplicantProfile />
    </Suspense>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container-app grid gap-8 pt-8 pb-20 lg:grid-cols-[380px_1fr]" role="status" aria-label="Loading profile">
      <div className="flex flex-col gap-4 rounded-[10px] border-2 border-ink bg-card p-6">
        <div className="flex items-center gap-4"><Skeleton className="size-24 rounded-full" /><Skeleton className="h-7 flex-1" /></div>
        <Skeleton className="h-4" /><Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-[600px] rounded-[10px] max-lg:hidden" />
    </div>
  );
}

/** Mark hired / Mark rejected, or move a decided ticket back to the queue. */
function Decide({ status, busy, onSet, className }: { status: Status; busy: Status | null; onSet: (s: Status) => void; className?: string }) {
  if (status !== "Submitted") {
    return (
      <Button variant="secondary" className={cn("w-full", className)} loading={busy === "Submitted"} disabled={!!busy} onClick={() => onSet("Submitted")}>
        Move back to the queue
      </Button>
    );
  }
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <Button className="border-ink bg-hired text-white hover:bg-hired" loading={busy === "Hired"} disabled={!!busy} onClick={() => onSet("Hired")}>
        Mark hired
      </Button>
      <Button variant="secondary" loading={busy === "Rejected"} disabled={!!busy} onClick={() => onSet("Rejected")}>
        Mark rejected
      </Button>
    </div>
  );
}

function ApplicantProfile() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user: viewer, loading: authLoading, isAuth } = useAppData();
  const jobId = params.get("job");
  const applicationId = params.get("application");

  const [person, setPerson] = useState<User | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Status | null>(null);
  // undefined while checking; null when no file opens
  const [resume, setResume] = useState<{ url: string; current: boolean } | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) router.replace(`/login?next=${encodeURIComponent(`/account/${id}${jobId ? `?job=${jobId}&application=${applicationId}` : ""}`)}`);
    else if (viewer && String(viewer.user_id) === id) router.replace("/account");
  }, [authLoading, isAuth, viewer, id, jobId, applicationId, router]);

  const load = useCallback(async () => {
    let profile: User;
    try {
      profile = (await axios.get<User>(`${user_service}/api/user/${id}`, authHeaders())).data;
      setPerson(profile);
      setError(null);
    } catch (err) {
      setError(apiError(err, "This profile couldn't be loaded."));
      return;
    }
    let sent: Application | null = null;
    if (jobId) {
      try {
        const [j, apps] = await Promise.all([
          axios.get(`${job_service}/api/job/${jobId}`),
          axios.get<Application[]>(`${job_service}/api/job/application/${jobId}`, authHeaders()),
        ]);
        sent = apps.data.find((a) => String(a.application_id) === applicationId || String(a.applicant_id) === id) ?? null;
        setJob(j.data);
        setApplication(sent);
      } catch {
        /* the profile still shows without the ticket */
      }
    }
    // Prefer the résumé sent with this application; fall back to the current one.
    const url = await firstWorking([sent?.resume, profile.resume]);
    setResume(url ? { url, current: !!sent?.resume && url !== sent.resume } : null);
  }, [id, jobId, applicationId]);

  useEffect(() => {
    if (isAuth) load();
  }, [isAuth, load]);

  const setStatus = async (status: Status) => {
    if (!application || !person) return;
    setBusy(status);
    try {
      await axios.put(`${job_service}/api/job/application/update/${application.application_id}`, { status }, authHeaders());
      setApplication({ ...application, status });
      const first = person.name.split(" ")[0];
      toast.success(status === "Submitted" ? `${first} is back in the queue.` : `${first} is marked ${status.toLowerCase()}. We've emailed them.`);
    } catch (err) {
      toast.error(apiError(err, "Couldn't update the status."));
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    return (
      <div className="container-app flex flex-col items-center gap-4 py-16 text-center">
        <LostTicket className="w-[240px]" label="" />
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em]">Can&apos;t show this profile.</h1>
        <p className="max-w-[30em] text-ink-soft">{error}</p>
        <Link href={jobId ? `/jobs/${jobId}` : "/account"} className={buttonVariants({ variant: "primary" })}>Back</Link>
      </div>
    );
  }
  if (!person) return <ProfileSkeleton />;

  const first = person.name.split(" ")[0];
  const priority = !!priorityUntil(person.subscription);
  const status = (application?.status ?? "Submitted") as Status;
  const skills = person.skills?.filter(Boolean) ?? [];

  return (
    <div className={cn("container-app flex flex-col gap-6 pt-6 md:pt-9", application ? "pb-32 lg:pb-20" : "pb-20")}>
      <Link href={job ? `/jobs/${job.job_id}` : "/account"} className="inline-flex items-center gap-1.5 self-start font-bold">
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
        {job ? `Applicants for ${job.title}` : "My companies"}
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr] lg:gap-8 [&>*]:min-w-0">
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-[10px] border-2 border-ink bg-card shadow-hard">
            <div className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-center gap-4">
                <Avatar name={person.name} src={person.profile_pic} size={96} priority={priority} className="max-md:!size-16" />
                <div className="min-w-0">
                  <h1 className="font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] break-words md:text-[32px]">{person.name}</h1>
                  {priority && <span className="mt-2 inline-block rounded-[8px] border-[1.5px] border-ink bg-gold px-2 py-0.5 text-[13px] font-bold md:text-[14px]">Priority applicant</span>}
                </div>
              </div>
              {person.bio ? <p className="text-ink-soft">{person.bio}</p> : <p className="text-ink-muted">{first} hasn&apos;t written a bio yet.</p>}
              {/* phones: contact as buttons */}
              <div className="grid grid-cols-2 gap-3 md:hidden">
                <a href={`mailto:${person.email}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Email</a>
                {person.phone_number && <a href={`tel:${person.phone_number}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>Call</a>}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-t-[1.5px] border-line px-6 py-5 max-md:hidden">
              <h2 className="text-[15px] font-bold text-ink-muted">Contact</h2>
              <a href={`mailto:${person.email}`} className="inline-flex min-h-9 items-center gap-2.5 break-all text-ink"><Mail className="size-[18px] flex-none" strokeWidth={2.25} aria-hidden />{person.email}</a>
              {person.phone_number && (
                <a href={`tel:${person.phone_number}`} className="inline-flex min-h-9 items-center gap-2.5 text-ink"><Phone className="size-[18px] flex-none" strokeWidth={2.25} aria-hidden />{person.phone_number.replace(/(\d{5})(\d{5})/, "$1 $2")}</a>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t-[1.5px] border-line px-5 py-5 md:px-6">
              <h2 className="text-[15px] font-bold text-ink-muted">Skills</h2>
              {skills.length ? (
                <ul className="flex flex-wrap gap-2">{skills.map((s) => <li key={s}><Tag>{s}</Tag></li>)}</ul>
              ) : (
                <p className="text-ink-muted">No skills added yet.</p>
              )}
            </div>
          </section>

          {application && job && (
            <section aria-label="This application" className={cn("flex flex-col gap-3 rounded-[10px] border-2 p-5", TICKET_TONE[status])}>
              <div className="flex items-start justify-between gap-4">
                <b>Ticket {ticketNumber(application.application_id)} · {job.title}</b>
                <span className="flex-none text-[14px] text-ink-soft">{applied(application.applied_at)}</span>
              </div>
              <b className={TEXT_TONE[status]} aria-live="polite">{LABEL[status]}</b>
              <Decide status={status} busy={busy} onSet={setStatus} className="max-lg:hidden" />
              <p className="t-help max-lg:hidden">{first} gets an email either way.</p>
            </section>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] md:text-[32px]">Résumé</h2>
            {resume && (
              <div className="flex gap-2.5 max-md:hidden">
                <a href={resume?.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>Open in new tab</a>
                <a href={resume?.url} download className={buttonVariants({ variant: "secondary", size: "sm" })}>Download PDF</a>
              </div>
            )}
          </div>
          {resume === undefined ? (
            <Skeleton className="h-[560px] rounded-[10px]" />
          ) : !resume ? (
            <p className="rounded-[10px] border-2 border-dashed border-ink bg-paper-deep px-5 py-6 text-ink-soft">
              {application?.resume || person.resume
                ? `${first}'s résumé file can't be opened any more. Ask them to upload it again.`
                : `${first} hasn't uploaded a résumé.`}
            </p>
          ) : (
            <>
              {resume.current && (
                <p className="text-[15px] text-ink-soft">The file sent with this application is no longer available, so this is {first}&apos;s current résumé.</p>
              )}
              <a href={resume.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 rounded-[10px] border-2 border-ink bg-card px-4 py-3.5 text-ink no-underline md:hidden">
                <FileText className="size-6 flex-none" strokeWidth={2.25} aria-hidden />
                <span><b className="block">{first}&apos;s résumé</b><span className="t-help">PDF · tap to open</span></span>
              </a>
              <div className="overflow-hidden rounded-[10px] border-2 border-ink bg-paper-deep p-3 max-md:hidden md:p-6">
                <iframe src={`${resume.url}#view=FitH`} title={`${person.name}'s résumé`} className="h-[min(1000px,calc(100dvh-220px))] min-h-[560px] w-full rounded-[4px] border-[1.5px] border-line bg-white" />
              </div>
            </>
          )}
        </section>
      </div>

      {/* phones and tablets: decide from the bottom bar */}
      {application && job && (
        <div data-apply-bar className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-1.5 border-t-2 border-ink bg-card px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] lg:hidden">
          <Decide status={status} busy={busy} onSet={setStatus} />
          <p className="t-help text-center !text-[13px]">{first} gets an email either way.</p>
        </div>
      )}
    </div>
  );
}
