"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Camera, ChevronRight, FileText, Mail, Pencil, Phone, X } from "lucide-react";
import { Application, User } from "@/type";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { shortDate, ticketNumber } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PanelDialog } from "@/components/ui/panel-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDanger,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar } from "@/components/jq/identity";
import { ProfileMeter } from "@/components/jq/feedback";
import { ApplicationChip } from "@/components/jq/status";
import { Stamp } from "@/components/jq/ticket";
import { TakeANumber } from "@/components/jq/illustrations";
import { ResumePicker } from "@/components/job-detail/apply-card";
import { ResumeChecker } from "@/components/ai/resume-checker";
import { CareerGuidance } from "@/components/ai/career-guidance";

const BIO_MAX = 280;

/* ------------------------------------------------------------------ *
 * Profile completeness, computed from the profile itself
 * ------------------------------------------------------------------ */
type Next = "photo" | "bio" | "phone" | "resume" | "skills";
function completeness(user: User) {
  const checks: { key: Next; done: boolean; next: string }[] = [
    { key: "resume", done: !!user.resume, next: "upload your résumé" },
    { key: "skills", done: (user.skills?.length ?? 0) >= 3, next: "add at least 3 skills" },
    { key: "bio", done: !!user.bio?.trim(), next: "write a short bio" },
    { key: "photo", done: !!user.profile_pic, next: "add a photo" },
    { key: "phone", done: !!user.phone_number, next: "add a phone number" },
  ];
  const done = checks.filter((c) => c.done).length;
  return { done, total: checks.length, percent: Math.round((done / checks.length) * 100), next: checks.find((c) => !c.done) };
}

/* ------------------------------------------------------------------ *
 * Edit profile
 * ------------------------------------------------------------------ */
function EditProfile({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { updateUser, updateProfilePic, btnLoading } = useAppData();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone_number ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [phoneError, setPhoneError] = useState("");
  const photo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(user.name);
    setPhone(user.phone_number ?? "");
    setBio(user.bio ?? "");
    setPhoneError("");
  }, [open, user]);

  const save = async () => {
    const digits = phone.replace(/\D/g, "");
    if (phone && digits.length !== 10) return setPhoneError("Phone numbers need 10 digits.");
    await updateUser(name.trim(), digits, bio.trim());
    onOpenChange(false);
  };

  return (
    <PanelDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      width={620}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} loading={btnLoading} disabled={!name.trim()}>{btnLoading ? "Saving" : "Save changes"}</Button>
        </>
      }
    >
      <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <Avatar name={user.name} src={user.profile_pic} size={64} />
          <Button variant="secondary" size="sm" onClick={() => photo.current?.click()}>
            {user.profile_pic ? "Change photo" : "Upload photo"}
          </Button>
          <span className="t-help">JPG or PNG, square works best</span>
          <input
            ref={photo}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (!f.type.startsWith("image/")) return void toast.error("Choose a JPG or PNG image.");
              const fd = new FormData();
              fd.append("file", f);
              await updateProfilePic(fd);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ep-name">Full name</Label>
          <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ep-phone">Phone</Label>
          <Input
            id="ep-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            aria-invalid={!!phoneError}
            aria-describedby={phoneError ? "ep-phone-err" : undefined}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
            autoComplete="tel"
          />
          {phoneError && <span id="ep-phone-err" className="text-[14px] text-red-deep">{phoneError}</span>}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="ep-bio">Short bio</Label>
          <Textarea id="ep-bio" value={bio} maxLength={BIO_MAX} onChange={(e) => setBio(e.target.value)} placeholder="A sentence or two about what you build and the role you want." />
          <span className="t-help self-end tabular-nums">{bio.length} / {BIO_MAX}</span>
        </div>
      </div>
    </PanelDialog>
  );
}

/* ------------------------------------------------------------------ *
 * Profile card
 * ------------------------------------------------------------------ */
function ProfileCard({ user, onEdit, onCheckResume }: { user: User; onEdit: () => void; onCheckResume: () => void }) {
  const { addSkill, removeSkill, updateResume, btnLoading } = useAppData();
  const [skill, setSkill] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [section, setSection] = useState<"resume" | "skills" | "contact" | null>(null);
  const skillInput = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<(() => void) | null>(null);
  const meter = completeness(user);
  const skills = user.skills ?? [];

  const goNext = () => {
    switch (meter.next?.key) {
      case "skills":
        setSection("skills");
        setTimeout(() => skillInput.current?.focus(), 50);
        break;
      case "resume":
        setSection("resume");
        resumeRef.current?.();
        break;
      default:
        onEdit();
    }
  };

  const nextLink = meter.next ? (
    <button onClick={goNext} className="inline-flex min-h-8 items-center gap-1.5 text-[15px] font-bold text-red-deep">
      Next: {meter.next.next}
      <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  ) : (
    <span className="font-bold text-hired">Your profile is complete.</span>
  );

  // On phones each section opens from a button row; from 768px all show.
  const sec = (key: "resume" | "skills" | "contact") => cn("flex-col gap-2.5 border-t-[1.5px] border-line px-5 py-[18px]", section === key ? "flex" : "hidden md:flex");

  return (
    <div className="rounded-[10px] border-2 border-ink bg-card md:shadow-hard">
      <div className="flex flex-col gap-3.5 px-5 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-none">
            <Avatar name={user.name} src={user.profile_pic} size={88} className="hidden md:grid" />
            <Avatar name={user.name} src={user.profile_pic} size={64} className="md:hidden" />
            <button
              onClick={onEdit}
              aria-label="Change photo"
              className="absolute -right-1.5 -bottom-1.5 hidden size-9 place-items-center rounded-full border-2 border-ink bg-card md:grid"
            >
              <Camera className="size-4" strokeWidth={2.5} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-1 font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] md:text-[30px]">{user.name}</h1>
            <span className="text-[15px] text-ink-muted">Job seeker</span>
          </div>
          <button onClick={onEdit} aria-label="Edit profile" className="grid size-11 flex-none place-items-center rounded-[10px] border-2 border-ink bg-card md:hidden">
            <Pencil className="size-[18px]" strokeWidth={2.25} />
          </button>
        </div>
        {user.bio && <p className="hidden text-ink-soft md:block">{user.bio}</p>}
        <Button variant="secondary" size="sm" className="hidden w-full md:inline-flex" onClick={onEdit}>Edit profile</Button>
      </div>

      <div className="flex flex-col gap-2.5 border-t-[1.5px] border-line bg-paper px-5 py-[18px]">
        <ProfileMeter percent={meter.percent} done={meter.done} total={meter.total} next={nextLink} />
      </div>

      {/* phones: section switches */}
      <div className="flex gap-2.5 border-t-[1.5px] border-line px-5 py-3 md:hidden">
        {([["resume", "Résumé"], ["skills", `Skills · ${skills.length}`], ["contact", "Contact"]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSection((s) => (s === k ? null : k))}
            aria-expanded={section === k}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1 px-2", section === k && "bg-ink text-paper hover:bg-ink")}
          >
            {l}
          </button>
        ))}
      </div>

      <div className={sec("contact")}>
        <h3 className="font-sans text-[15px] font-bold tracking-normal text-ink-muted">Contact</h3>
        <div className="flex min-w-0 items-center gap-2.5"><Mail className="size-[18px] flex-none" strokeWidth={2.25} aria-hidden /><span className="truncate">{user.email}</span></div>
        <div className="flex items-center gap-2.5"><Phone className="size-[18px] flex-none" strokeWidth={2.25} aria-hidden />{user.phone_number || <button onClick={onEdit} className="font-bold text-red-deep">Add a phone number</button>}</div>
      </div>

      <div className={sec("resume")} id="resume">
        <h3 className="font-sans text-[15px] font-bold tracking-normal text-ink-muted">Résumé</h3>
        <ResumePicker onPick={(fd) => void updateResume(fd)}>
          {(open) => {
            resumeRef.current = open;
            return user.resume ? (
              <>
                <div className="flex items-center gap-3">
                  <FileText className="size-7 flex-none" strokeWidth={2} aria-hidden />
                  <div className="min-w-0 flex-1"><b className="block">Your résumé</b><span className="t-help">PDF on file</span></div>
                </div>
                <div className="flex gap-2.5">
                  <a href={user.resume} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1")}>View</a>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={open} loading={btnLoading}>{btnLoading ? "Uploading" : "Replace"}</Button>
                </div>
                <button onClick={onCheckResume} className="inline-flex min-h-8 items-center self-start text-[15px] font-bold text-red-deep">Check it with the résumé checker</button>
              </>
            ) : (
              <button onClick={open} className="flex flex-col items-start gap-1 rounded-[10px] border-2 border-dashed border-ink bg-paper p-3.5 text-left">
                <b>{btnLoading ? "Uploading…" : "Upload résumé"}</b>
                <span className="t-help">PDF, up to 5MB. Every application uses it.</span>
              </button>
            );
          }}
        </ResumePicker>
      </div>

      <div className={sec("skills")} id="skills">
        <h3 className="font-sans text-[15px] font-bold tracking-normal text-ink-muted">Skills</h3>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="inline-flex min-h-9 items-center gap-0.5 rounded-[10px] border-[1.5px] border-ink bg-paper-deep pr-0.5 pl-3 text-[15px]">
                {s}
                <button onClick={() => setRemoving(s)} aria-label={`Remove ${s}`} className="grid size-8 place-items-center">
                  <X className="size-3.5" strokeWidth={2.75} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="t-help">Recruiters filter by skills. Add the ones you want to be found for.</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = skill.trim();
            if (!v) return;
            if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) return void toast.error(`${v} is already on your profile.`);
            void addSkill(v, setSkill);
          }}
          className="flex gap-2"
        >
          <label className="flex-1">
            <span className="sr-only">Add a skill</span>
            <Input ref={skillInput} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Add a skill, like SQL" className="min-h-11" />
          </label>
          <Button type="submit" variant="secondary" size="sm">Add</Button>
        </form>
      </div>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove {removing} from your skills?</AlertDialogTitle>
          <AlertDialogDescription>Recruiters won&apos;t see it on your profile any more. You can add it back any time.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogDanger onClick={() => { if (removing) void removeSkill(removing); setRemoving(null); }}>Remove skill</AlertDialogDanger>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Priority · upsell or the active gold card
 * ------------------------------------------------------------------ */
function PriorityCard({ user, openCount }: { user: User; openCount: number }) {
  const until = user.subscription ? new Date(user.subscription) : null;
  const active = !!until && until.getTime() > Date.now();

  if (active) {
    const days = Math.max(0, Math.ceil((until!.getTime() - Date.now()) / 86_400_000));
    return (
      <div className="flex flex-col gap-2.5 rounded-[10px] border-2 border-ink bg-gold p-5 shadow-hard">
        <div className="flex items-center justify-between">
          <b className="font-display text-[26px] font-extrabold">Priority</b>
          <span className="rounded-[10px] bg-ink px-2.5 py-0.5 text-[14px] font-bold text-gold">Active</span>
        </div>
        <p>Your applications show first on every recruiter&apos;s list, with a gold mark.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-[10px] border-2 border-dashed border-ink bg-gold-tint p-3 text-[15px]">
          <dt className="font-bold">Valid until</dt>
          <dd>{until!.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd>
          <dt className="font-bold">Days left</dt>
          <dd className="tabular-nums">{days}</dd>
        </dl>
      </div>
    );
  }

  return (
    <>
      <div className="hidden flex-col gap-2.5 rounded-[10px] border-2 border-ink bg-gold p-5 shadow-hard md:flex">
        <b className="font-display text-[26px] font-extrabold">Skip the line</b>
        <p>
          {openCount > 0
            ? `Your ${openCount} open ${openCount === 1 ? "application" : "applications"} would move to the top of each recruiter's list, with a gold mark.`
            : "Your applications go to the top of each recruiter's list, with a gold mark."}
        </p>
        <Link
          href="/subscribe"
          className="press inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border-2 border-ink bg-ink px-5 font-bold text-gold no-underline shadow-[4px_4px_0_var(--color-card)] [--press-shadow:var(--color-card)] hover:text-gold"
        >
          Get Priority · ₹119/month
        </Link>
      </div>
      <Link
        href="/subscribe"
        className="flex items-center justify-between rounded-[10px] border-2 border-ink bg-gold px-3.5 py-3 font-bold text-ink no-underline shadow-hard-sm md:hidden"
      >
        Skip the line · ₹119/month
        <ChevronRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
      </Link>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Tickets
 * ------------------------------------------------------------------ */
function TicketItem({ a }: { a: Application }) {
  const closed = a.job_active === false && a.status === "Submitted";
  const meta = [a.company_name, a.job_location, `applied ${shortDate(a.applied_at)}`].filter(Boolean).join(" · ");
  return (
    <li
      className={cn(
        "ticket flex items-stretch rounded-[10px] border-2 border-ink",
        a.status === "Hired" ? "bg-hired-tint" : closed ? "bg-paper" : "bg-card"
      )}
      style={{ "--hole": "var(--color-paper)" } as React.CSSProperties}
    >
      <div className="perforation flex w-[92px] flex-none flex-col justify-center py-4 pl-4 md:w-[118px] md:pl-6">
        <span className="text-[12px] text-ink-muted">Ticket</span>
        <span className={cn("font-display text-[17px] font-extrabold whitespace-nowrap md:text-[22px]", closed && "text-ink-muted")}>
          {ticketNumber(a.application_id)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 py-3.5 pr-7 pl-4 md:flex-row md:items-center md:gap-4 md:pr-[34px] md:pl-5">
        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${a.job_id}`} className={cn("text-[15px] leading-[1.3] font-bold no-underline hover:underline md:text-[17px]", closed ? "text-ink-muted" : "text-ink")}>
            {a.job_title}
          </Link>
          <div className="text-[13px] text-ink-muted md:text-[15px]">
            {meta}
            {closed && (
              <> · <span className="rounded-[10px] border-[1.5px] border-dashed border-ink px-2 text-ink">Job closed</span></>
            )}
          </div>
        </div>
        {a.status === "Submitted" ? (
          <ApplicationChip status="Submitted" audience="seeker" />
        ) : (
          <Stamp status={a.status as "Hired" | "Rejected"} applicationId={a.application_id} className={a.status === "Rejected" ? "!text-[16px]" : "!text-[19px]"} />
        )}
      </div>
    </li>
  );
}

const EMPTY_TAB: Record<string, string> = {
  Submitted: "Applications you send show up here while recruiters decide.",
  Hired: "When a recruiter marks you Hired, that ticket moves here and gets a stamp.",
  Rejected: "Nothing here, which is good news.",
};

function Applications({ applications }: { applications: Application[] }) {
  const [tab, setTab] = useState("all");
  const count = (s: string) => applications.filter((a) => a.status === s).length;
  const rows = tab === "all" ? applications : applications.filter((a) => a.status === tab);

  return (
    <section aria-labelledby="apps-h" className="flex min-w-0 flex-col gap-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="apps-h" className="font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">My applications</h2>
        <Link href="/jobs" className="inline-flex min-h-11 items-center font-bold">Find more jobs</Link>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-ink bg-card px-6 py-10 text-center">
          <TakeANumber label="" className="w-[200px]" />
          <h3 className="t-h2">No tickets yet.</h3>
          <p className="text-ink-soft">Find a role and take your first number.</p>
          <Link href="/jobs" className={buttonVariants()}>Browse jobs</Link>
        </div>
      ) : (
        <>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label="Filter applications" className="-mx-4 px-4 md:mx-0 md:px-0">
              <TabsTrigger value="all">All <span className="opacity-80">{applications.length}</span></TabsTrigger>
              <TabsTrigger value="Submitted">In the queue <span className="text-ink-muted group-data-[state=active]:text-paper/80">{count("Submitted")}</span></TabsTrigger>
              <TabsTrigger value="Hired">Hired <span className="opacity-80">{count("Hired")}</span></TabsTrigger>
              <TabsTrigger value="Rejected">Rejected <span className="opacity-80">{count("Rejected")}</span></TabsTrigger>
            </TabsList>
          </Tabs>
          {rows.length === 0 ? (
            <div className="flex flex-col items-start gap-2.5 rounded-[10px] border-2 border-ink bg-card p-5">
              <b className="text-[18px]">Nothing here yet.</b>
              <p className="text-ink-soft">{EMPTY_TAB[tab]}</p>
              <Button variant="secondary" size="sm" onClick={() => setTab("all")}>Show all tickets</Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3.5 pt-1">
              {rows.map((a) => <TicketItem key={a.application_id} a={a} />)}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The page
 * ------------------------------------------------------------------ */
export function SeekerDashboard({ user }: { user: User }) {
  const { applications } = useAppData();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);
  const [tool, setTool] = useState<"resume" | "career" | null>(null);

  // Deep links: /account?tool=resume and /account#ai-tools
  useEffect(() => {
    const t = params.get("tool");
    if (t === "resume" || t === "career") setTool(t);
    if (window.location.hash === "#ai-tools") document.getElementById("ai-tools")?.scrollIntoView({ block: "center" });
  }, [params]);

  const closeTool = (open: boolean) => {
    if (open) return;
    setTool(null);
    if (params.get("tool")) router.replace(pathname, { scroll: false });
  };

  const apps = applications ?? [];
  const open = apps.filter((a) => a.status === "Submitted").length;

  return (
    <div className="container-app flex flex-wrap items-start gap-6 pt-5 pb-20 md:gap-9 md:pt-9">
      <aside className="flex w-full flex-col gap-4 md:max-w-[380px] md:flex-[1_1_340px] md:gap-5">
        <ProfileCard user={user} onEdit={() => setEditing(true)} onCheckResume={() => setTool("resume")} />
        <PriorityCard user={user} openCount={open} />
        <div id="ai-tools" className="flex scroll-mt-28 flex-col gap-3 rounded-[10px] border-2 border-ink bg-card p-5">
          <b className="font-display text-[22px] font-extrabold">Free AI tools</b>
          <p className="text-[15px] text-ink-soft">Check how your résumé reads to screening software, or get a plan for the role you want next.</p>
          <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col">
            <Button variant="secondary" className="flex-1" onClick={() => setTool("resume")}>Check my résumé</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setTool("career")}>Get career guidance</Button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-[999_1_560px]">
        <Applications applications={apps} />
      </div>

      <EditProfile user={user} open={editing} onOpenChange={setEditing} />
      <ResumeChecker open={tool === "resume"} onOpenChange={closeTool} />
      <CareerGuidance open={tool === "career"} onOpenChange={closeTool} />
    </div>
  );
}
