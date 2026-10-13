"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import { X } from "lucide-react";
import { useAppData, utils_service } from "@/context/AppContext";
import { apiError, cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelDialog } from "@/components/ui/panel-dialog";
import { WhichWay } from "@/components/jq/illustrations";
import { ProgressSteps } from "@/components/ai/resume-checker";

type Result = {
  summary: string;
  jobOptions: { title: string; responsibilities: string; why: string }[];
  skillsToLearn: { category: string; skills: { title: string; why: string; how: string }[] }[];
  learningApproach?: { title?: string; points: string[] };
};

/** Skills people commonly list alongside others. Offered, never assumed. */
const COMMON = ["Git", "TypeScript", "SQL", "Python", "Node.js", "Figma", "Docker", "Excel", "Java", "React"];
const STEPS = ["Reading your skills", "Matching them to roles", "Building your learning plan"];

export function CareerGuidance({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAppData();
  const [step, setStep] = useState<"skills" | "thinking" | "done">("skills");
  const [skills, setSkills] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("skills");
    setResult(null);
    setError(null);
    setDraft("");
    setSkills(user?.skills?.length ? [...user.skills] : []);
  }, [open, user?.skills]);

  const add = (s: string) => {
    const v = s.trim();
    if (!v || skills.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setSkills((k) => [...k, v]);
  };

  const go = async () => {
    setError(null);
    setStep("thinking");
    try {
      const { data } = await axios.post(
        `${utils_service}/api/utils/career`,
        { skills: skills.join(", ") },
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
      );
      setResult(data);
      setStep("done");
    } catch (err) {
      setStep("skills");
      setError(apiError(err, "Couldn't get suggestions right now. Please try again."));
    }
  };

  const suggestions = COMMON.filter((c) => !skills.some((s) => s.toLowerCase() === c.toLowerCase())).slice(0, 4);
  const firstRole = result?.jobOptions?.[0]?.title;

  return (
    <PanelDialog
      open={open}
      onOpenChange={onOpenChange}
      closable={step !== "thinking"}
      width={step === "done" ? 760 : 560}
      title={step === "skills" ? "What can you do already?" : step === "thinking" ? "Looking at your options" : "Where your skills can take you"}
      footer={
        step === "skills" ? (
          <>
            <span className="t-help mr-auto self-center">
              {skills.length} {skills.length === 1 ? "skill" : "skills"} added
            </span>
            <Button onClick={go} disabled={skills.length === 0}>Get suggestions</Button>
          </>
        ) : step === "done" ? (
          <div className="flex w-full flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep("skills")}>Change skills</Button>
            {firstRole && (
              <Link href={`/jobs?q=${encodeURIComponent(firstRole)}`} onClick={() => onOpenChange(false)} className={buttonVariants()}>
                Search {firstRole} roles
              </Link>
            )}
          </div>
        ) : undefined
      }
    >
      {step === "skills" && (
        <div className="flex flex-col gap-4">
          <p className="text-ink-soft">Add your skills. We&apos;ll suggest roles that fit and what to learn next.</p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex min-h-[38px] items-center gap-0.5 rounded-[10px] border-[1.5px] border-ink bg-paper-deep pr-0.5 pl-3 text-[15px]">
                  {s}
                  <button onClick={() => setSkills((k) => k.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="grid size-[34px] place-items-center">
                    <X className="size-3.5" strokeWidth={2.75} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); add(draft); setDraft(""); }} className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Add a skill</span>
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a skill, like SQL" />
            </label>
            <Button type="submit" variant="secondary">Add</Button>
          </form>
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="t-help">Often added with these</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => add(s)} className="inline-flex min-h-[38px] items-center rounded-[10px] border-[1.5px] border-dashed border-ink px-3 text-[15px] hover:bg-paper-deep">
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <p role="alert" className="rounded-[10px] border-2 border-red-deep bg-error-tint p-4 font-bold text-red-deep">{error}</p>}
        </div>
      )}

      {step === "thinking" && (
        <div className="flex flex-col gap-4">
          <WhichWay label="" className="w-[200px] self-center" />
          <ProgressSteps steps={STEPS} done={false} />
        </div>
      )}

      {step === "done" && result && (
        <div className="flex flex-col gap-5">
          <p className="text-[17px] text-ink-soft">{result.summary}</p>

          {result.jobOptions?.length > 0 && (
            <div className="flex flex-col gap-3">
              <b className="font-display text-[22px] font-extrabold">Roles to look at</b>
              {result.jobOptions.map((r) => (
                <div key={r.title} className="flex flex-col gap-2 rounded-[10px] border-2 border-ink bg-paper px-[18px] py-4">
                  <b className="text-[18px]">{r.title}</b>
                  <p className="text-[15px]"><b>Why it fits:</b> {r.why}</p>
                  <p className="text-[15px] text-ink-soft">{r.responsibilities}</p>
                  <Link href={`/jobs?q=${encodeURIComponent(r.title)}`} onClick={() => onOpenChange(false)} className="inline-flex min-h-9 items-center self-start text-[15px] font-bold">
                    See {r.title} roles on JobQ
                  </Link>
                </div>
              ))}
            </div>
          )}

          {result.skillsToLearn?.length > 0 && (
            <div>
              <b className="mb-1.5 block font-display text-[22px] font-extrabold">What to learn next</b>
              {result.skillsToLearn.map((g, gi) => (
                <div
                  key={g.category}
                  className={cn(
                    "grid gap-x-4 gap-y-1 border-t-[1.5px] border-line py-3 sm:grid-cols-[150px_1fr]",
                    gi === result.skillsToLearn.length - 1 && "border-b-[1.5px]"
                  )}
                >
                  <b>{g.category}</b>
                  <div className="flex flex-col gap-2">
                    {g.skills.map((s) => (
                      <p key={s.title} className="text-[15px] text-ink-soft">
                        <b className="text-ink">{s.title}.</b> {s.why} {s.how}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.learningApproach?.points?.length ? (
            <div className="rounded-[10px] border-2 border-dashed border-ink bg-gold-tint p-4">
              <b>Tips</b>
              <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-ink-soft">
                {result.learningApproach.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </PanelDialog>
  );
}
