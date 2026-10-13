"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { FileText, Upload } from "lucide-react";
import { Application, Job, User } from "@/type";
import { cn } from "@/lib/utils";
import { formatSalary, shortDate, ticketNumber } from "@/lib/format";
import { tearMessage } from "@/lib/motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApplicationChip, JobChip } from "@/components/jq/status";
import { Stamp } from "@/components/jq/ticket";

export type ApplyState =
  | "signed-out"
  | "recruiter"
  | "owner"
  | "closed"
  | "no-resume"
  | "can-apply"
  | "queue"
  | "hired"
  | "rejected";

export function applyState({
  job,
  user,
  isAuth,
  application,
  isOwner,
}: {
  job: Job;
  user: User | null;
  isAuth: boolean;
  application?: Application;
  isOwner: boolean;
}): ApplyState {
  if (isOwner) return "owner";
  if (!isAuth) return "signed-out";
  if (user?.role === "recruiter") return "recruiter";
  if (application) {
    return application.status === "Hired" ? "hired" : application.status === "Rejected" ? "rejected" : "queue";
  }
  if (!job.is_active) return "closed";
  if (!user?.resume) return "no-resume";
  return "can-apply";
}


/** The ticket strip that appears once someone has applied. */
function TicketStrip({ application, children, className }: { application: Application; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex overflow-hidden rounded-[10px] border-2 border-ink bg-paper", className)}>
      <div className="perforation flex-none px-3.5 py-3">
        <span className="text-[12px] text-ink-muted">Ticket</span>
        <br />
        <span className="font-display text-[22px] font-extrabold tracking-[-0.02em] whitespace-nowrap">
          {ticketNumber(application.application_id)}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-end px-3.5 py-3">{children}</div>
    </div>
  );
}

/** A hidden PDF input behind a visible trigger. Checks type and size first. */
export function ResumePicker({
  onPick,
  children,
}: {
  onPick: (data: FormData) => void;
  children: (open: () => void) => React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      {children(() => ref.current?.click())}
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.type !== "application/pdf") return void toast.error("Résumés need to be a PDF.");
          if (file.size > 5 * 1024 * 1024)
            return void toast.error(`That file is ${(file.size / 1048576).toFixed(1)}MB. Résumés need to be under 5MB.`);
          const fd = new FormData();
          fd.append("file", file);
          onPick(fd);
        }}
      />
    </>
  );
}

type CardProps = {
  state: ApplyState;
  job: Job;
  user: User | null;
  application?: Application;
  justApplied: boolean;
  busy: boolean;
  onApply: () => void;
  onResume: (data: FormData) => void;
};

/** Sticky in the right column on desktop. */
export function ApplyCard({ state, job, user, application, justApplied, busy, onApply, onResume }: CardProps) {
  const reduce = useReducedMotion();
  const company = job.company_name;
  const salary = <span className="font-display text-[32px] leading-none font-extrabold md:text-[36px]">{formatSalary(job.salary)}</span>;
  const head = (
    <div className="flex items-baseline justify-between gap-3">
      {state === "closed" ? <span className="font-display text-[32px] font-extrabold text-ink-muted">{formatSalary(job.salary)}</span> : salary}
      {!["hired", "rejected"].includes(state) && <JobChip active={job.is_active} />}
    </div>
  );
  const similar = `/jobs?q=${encodeURIComponent(job.role)}`;
  const enter = justApplied && !reduce ? { initial: { opacity: 0, y: -10, rotate: -3 }, animate: { opacity: 1, y: 0, rotate: 0 }, transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] as const } } : {};

  const card = (cls: string, children: React.ReactNode) => (
    <div className={cn("flex flex-col gap-4 rounded-[10px] border-2 border-ink p-6", cls)}>{children}</div>
  );

  switch (state) {
    case "owner":
      return card("bg-card shadow-hard", <>
        {head}
        <p className="text-ink-soft">This is how seekers see your posting. They apply from here.</p>
        <Link href={`/jobs/${job.job_id}`} className={buttonVariants({ variant: "secondary" })}>Back to applicants</Link>
      </>);

    case "signed-out":
      return card("bg-card shadow-hard", <>
        {head}
        <b className="text-[17px]">Sign in to apply</b>
        <p className="text-[15px] text-ink-soft">
          Make a free profile once, then apply to this and any other role in a tap. We&apos;ll bring you back here.
        </p>
        <Link href={`/login?next=${encodeURIComponent(`/jobs/${job.job_id}`)}`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>Sign in to apply</Link>
        <Link href="/register" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>Create free account</Link>
      </>);

    case "recruiter":
      return card("bg-card", <>
        {head}
        <p className="text-[15px] text-ink-soft">Recruiter accounts post and review roles. To apply for jobs, use a job seeker account.</p>
      </>);

    case "closed":
      return card("border-dashed bg-card", <>
        {head}
        <b className="font-display text-[24px] font-extrabold">This job is closed.</b>
        <p className="text-[15px] text-ink-soft">{company} isn&apos;t taking new applications for it.</p>
        <Button disabled className="w-full">Apply now</Button>
        <Link href={similar} className={cn(buttonVariants(), "w-full")}>See similar open roles</Link>
      </>);

    case "no-resume":
      return card("bg-card shadow-hard", <>
        {head}
        <b className="text-[17px]">Add a résumé to apply</b>
        <p className="text-[15px] text-ink-soft">It&apos;s saved to your profile, so you only do this once.</p>
        <ResumePicker onPick={onResume}>
          {(open) => (
            <button
              onClick={open}
              disabled={busy}
              className="flex flex-col items-start gap-1 rounded-[10px] border-2 border-dashed border-ink bg-paper p-3.5 text-left hover:bg-paper-deep"
            >
              <Upload className="size-6" strokeWidth={2.25} aria-hidden />
              <b>{busy ? "Uploading…" : "Upload PDF"}</b>
              <span className="t-help">Up to 5MB</span>
            </button>
          )}
        </ResumePicker>
        <Button disabled className="w-full">Apply now</Button>
      </>);

    case "can-apply":
      return card("bg-card shadow-hard", <>
        {head}
        <p className="text-ink-soft">You&apos;ll apply with your JobQ profile. Recruiters see your bio, skills and résumé.</p>
        <div className={cn("flex items-center gap-3 rounded-[10px] border-[1.5px] border-line bg-paper p-3", busy && "opacity-60")}>
          <FileText className="size-7 flex-none" strokeWidth={2} aria-hidden />
          <div className="min-w-0 flex-1">
            <b className="block truncate">Your résumé</b>
            <a href={user?.resume ?? "#"} target="_blank" rel="noopener noreferrer" className="text-[14px]">Open PDF</a>
          </div>
          <ResumePicker onPick={onResume}>
            {(open) => (
              <button onClick={open} className="min-h-11 px-1 text-[15px] font-bold text-red-deep underline">Replace</button>
            )}
          </ResumePicker>
        </div>
        <Button size="lg" className="w-full" onClick={onApply} loading={busy}>
          {busy ? "Taking your number" : "Apply now"}
        </Button>
        <p className="t-help text-center">You&apos;ll get a ticket number straight away.</p>
      </>);

    case "queue":
      return card("bg-card shadow-hard", <>
        {head}
        <motion.b className="font-display text-[24px] font-extrabold" variants={reduce ? tearMessage.reduced : tearMessage.full} initial={justApplied ? "hidden" : false} animate="shown">
          You&apos;re in the queue.
        </motion.b>
        <motion.div {...enter}>
          <TicketStrip application={application!}>
            <ApplicationChip status="Submitted" audience="seeker" />
          </TicketStrip>
        </motion.div>
        <p className="t-help">Applied {shortDate(application!.applied_at)}. We&apos;ll email you when {company} decides.</p>
        <Link href="/account" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>View my applications</Link>
      </>);

    case "hired":
      return card("bg-hired-tint shadow-hard", <>
        {salary}
        <b className="font-display text-[24px] font-extrabold">You&apos;re up!</b>
        <p className="text-[15px] text-ink-soft">
          {company} wants you on the team. We&apos;ve sent the news to {user?.email}.
        </p>
        <TicketStrip application={application!} className="bg-card">
          <Stamp status="Hired" text="Hired" applicationId={application!.application_id} className="!text-[22px]" />
        </TicketStrip>
        <Link href="/account" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>View my applications</Link>
      </>);

    case "rejected":
      return card("bg-card shadow-hard", <>
        {salary}
        <b className="font-display text-[24px] font-extrabold">Not this time.</b>
        <p className="text-[15px] text-ink-soft">{company} went with someone else for this role. Plenty more counters are open.</p>
        <TicketStrip application={application!}>
          <ApplicationChip status="Rejected" />
        </TicketStrip>
        <Link href={similar} className={cn(buttonVariants(), "w-full")}>Find similar roles</Link>
      </>);
  }
}

/** The same states, as a bar stuck to the bottom on phones. */
export function ApplyBar({ state, job, application, busy, onApply, onResume }: CardProps) {
  if (state === "owner" || state === "recruiter") return null;
  const priceBlock = (sub: string) => (
    <div className="min-w-0 flex-1">
      <span className="font-display text-[22px] font-extrabold">{formatSalary(job.salary)}</span>
      <br />
      <span className="text-[13px] text-ink-muted">{sub}</span>
    </div>
  );

  let content: React.ReactNode;
  if (application) {
    content = (
      <div className="flex items-stretch">
        <div className="perforation px-4 pt-3.5 pb-5">
          <span className="text-[12px] text-ink-muted">Ticket</span>
          <br />
          <span className="font-display text-[24px] font-extrabold whitespace-nowrap">{ticketNumber(application.application_id)}</span>
        </div>
        <div className="flex flex-1 items-center justify-between gap-2 px-4 pt-3.5 pb-5">
          <ApplicationChip status={application.status} audience="seeker" />
          <Link href="/account" className="inline-flex min-h-11 items-center font-bold">View</Link>
        </div>
      </div>
    );
  } else {
    let action: React.ReactNode = null;
    let sub = "";
    if (state === "signed-out") {
      sub = "Free account needed";
      action = <Link href={`/login?next=${encodeURIComponent(`/jobs/${job.job_id}`)}`} className={cn(buttonVariants(), "min-h-[52px]")}>Sign in to apply</Link>;
    } else if (state === "closed") {
      sub = "This job is closed";
      action = <Link href={`/jobs?q=${encodeURIComponent(job.role)}`} className={cn(buttonVariants({ variant: "secondary" }), "min-h-[52px]")}>See similar</Link>;
    } else if (state === "no-resume") {
      sub = "Add a résumé to apply";
      action = (
        <ResumePicker onPick={onResume}>
          {(open) => <Button className="min-h-[52px]" onClick={open} loading={busy}>{busy ? "Uploading" : "Upload PDF"}</Button>}
        </ResumePicker>
      );
    } else {
      sub = "Résumé attached";
      action = <Button className="min-h-[52px]" onClick={onApply} loading={busy}>{busy ? "Applying" : "Apply now"}</Button>;
    }
    content = (
      <div className="flex items-center gap-3.5 px-4 pt-3 pb-5">
        {priceBlock(sub)}
        {action}
      </div>
    );
  }

  return <div data-apply-bar className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-card md:hidden">{content}</div>;
}
