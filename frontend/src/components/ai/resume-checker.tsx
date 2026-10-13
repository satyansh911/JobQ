"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Check } from "lucide-react";
import { useAppData, utils_service } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Button, Spinner } from "@/components/ui/button";
import { PanelDialog } from "@/components/ui/panel-dialog";
import { ResumeCheck } from "@/components/jq/illustrations";

type Sub = { score: number; feedback: string };
type Result = {
  atsScore: number;
  scoreBreakdown: { formatting: Sub; keywords: Sub; structure: Sub; readability: Sub };
  suggestions: { category: string; issue: string; recommendation: string; priority: "high" | "medium" | "low" }[];
  strengths: string[];
  summary: string;
};

const MAX = 5 * 1024 * 1024;
const STEPS = ["Opening your PDF", "Checking formatting and structure", "Matching the keywords recruiters search for", "Scoring readability"];

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

function headline(score: number) {
  if (score >= 85) return "Strong. Only small polish left.";
  if (score >= 70) return "Solid, with a few easy wins.";
  if (score >= 50) return "Readable, but missing what recruiters look for.";
  return "Needs work before you send it out.";
}

/** Steps tick off on a timer while the request runs; the last waits for the answer. */
export function ProgressSteps({ steps, done }: { steps: string[]; done: boolean }) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setAt((a) => Math.min(a + 1, steps.length - 1)), 1400);
    return () => clearInterval(t);
  }, [done, steps.length]);
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const finished = done || i < at;
        const current = !done && i === at;
        return (
          <div key={s} className={cn("flex min-h-9 items-center gap-3", current && "font-bold", !finished && !current && "text-ink-muted")}>
            {finished ? (
              <Check className="size-[22px] text-hired" strokeWidth={3} aria-hidden />
            ) : current ? (
              <span className="text-red"><Spinner /></span>
            ) : (
              <span className="size-[22px] rounded-full border-2 border-line" aria-hidden />
            )}
            {s}
          </div>
        );
      })}
      <p className="t-help mt-1">This usually takes a few seconds.</p>
    </div>
  );
}

function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  return (
    <div
      role="img"
      aria-label={`Overall score ${score} out of 100`}
      className="grid flex-none place-items-center rounded-full border-2 border-ink"
      style={{ width: size, height: size, background: `conic-gradient(var(--color-red) 0 ${score}%, #EADFCC ${score}% 100%)` }}
    >
      <div className="grid place-items-center rounded-full border-2 border-ink bg-card text-center leading-none" style={{ width: size * 0.72, height: size * 0.72 }}>
        <span>
          <span className="font-display text-[36px] font-extrabold">{score}</span>
          <br />
          <span className="text-[13px] text-ink-muted">out of 100</span>
        </span>
      </div>
    </div>
  );
}

const barColour = (n: number) => (n >= 80 ? "var(--color-hired)" : n >= 65 ? "var(--color-queue)" : "var(--color-red)");
const GROUPS = [
  { key: "high", label: "Fix first", cls: "border-red-deep bg-error-tint text-red-deep" },
  { key: "medium", label: "Then", cls: "border-queue bg-queue-tint text-queue" },
  { key: "low", label: "Nice to have", cls: "border-rejected bg-rejected-tint text-rejected" },
] as const;

export function ResumeChecker({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user, updateResume } = useAppData();
  const [step, setStep] = useState<"pick" | "checking" | "done">("pick");
  const [source, setSource] = useState<"profile" | "file">(user?.resume ? "profile" : "file");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<{ title: string; body: string; offline?: boolean } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [savedToProfile, setSavedToProfile] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Start fresh every time it opens.
  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setError(null);
    setResult(null);
    setTicked(new Set());
    setSavedToProfile(false);
    setFile(null);
    setSource(user?.resume ? "profile" : "file");
  }, [open, user?.resume]);

  const choose = (f: File | undefined) => {
    if (!f) return;
    setError(null);
    if (f.type !== "application/pdf") return setError({ title: "That isn't a PDF.", body: "Export your résumé as a PDF and try again." });
    if (f.size > MAX)
      return setError({ title: `That file is ${(f.size / 1048576).toFixed(1)}MB.`, body: "Résumés need to be under 5MB. Try exporting it again as a PDF." });
    setFile(f);
    setSource("file");
  };

  const check = async () => {
    setError(null);
    setStep("checking");
    try {
      let dataUrl: string;
      if (source === "file" && file) dataUrl = await toDataUrl(file);
      else dataUrl = await toDataUrl(await (await fetch(user!.resume!)).blob());
      const { data } = await axios.post(
        `${utils_service}/api/utils/resume-analyser`,
        { pdfBase64: dataUrl },
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
      );
      setResult(data);
      setStep("done");
    } catch (err) {
      const e = err as { response?: { status?: number } };
      setStep("pick");
      if (!e.response || [502, 503, 504].includes(e.response.status ?? 0))
        setError({ title: "The counter's closed for a moment.", body: "Your file is still selected.", offline: true });
      else
        setError({ title: "We couldn't read any text.", body: "It may be a scanned image. Export it from Word or Google Docs as a PDF and try again." });
    }
  };

  const fixes = result?.suggestions ?? [];
  const label = source === "file" && file ? file.name : "your profile résumé";

  return (
    <PanelDialog
      open={open}
      onOpenChange={onOpenChange}
      closable={step !== "checking"}
      width={step === "done" ? 760 : 560}
      title={step === "pick" ? "Check your résumé" : step === "checking" ? "Reading your résumé" : "Your résumé, checked"}
      footer={
        step === "pick" ? (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={check} disabled={source === "file" && !file}>Check résumé</Button>
          </>
        ) : step === "done" ? (
          <div className="flex w-full flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => { setStep("pick"); setResult(null); setTicked(new Set()); }}>Check another</Button>
            <div className="flex flex-wrap gap-3">
              {source === "file" && file && (
                <Button
                  variant="secondary"
                  disabled={savedToProfile}
                  onClick={async () => {
                    const fd = new FormData();
                    fd.append("file", file);
                    if (await updateResume(fd)) setSavedToProfile(true);
                  }}
                >
                  {savedToProfile ? "Saved to profile" : "Replace résumé on profile"}
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {step === "pick" && (
        <div className="flex flex-col gap-4">
          <p className="text-ink-soft">See how applicant tracking systems read it: a score out of 100 and a list of fixes, most important first.</p>
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files?.[0]); }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-[10px] border-2 border-dashed border-ink px-5 py-7 text-center",
              drag ? "bg-paper-deep" : "bg-paper",
              source === "file" && file && "border-solid"
            )}
          >
            <ResumeCheck label="" className="w-[150px]" />
            <b className="text-[17px]">{file ? file.name : "Drop a PDF here, or choose a file"}</b>
            <span className="t-help">{file ? `${(file.size / 1024).toFixed(0)} KB · choose another` : "PDF only, up to 5MB"}</span>
          </button>
          <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ""; }} />
          {user?.resume && (
            <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 border-ink px-3.5 py-3">
              <input type="radio" name="resume-source" checked={source === "profile"} onChange={() => setSource("profile")} />
              <span>Use the one on my profile</span>
            </label>
          )}
          {error && (
            <div
              role="alert"
              className={cn(
                "rounded-[10px] border-2 p-4",
                error.offline ? "border-dashed border-ink bg-paper-deep" : "border-red-deep bg-error-tint"
              )}
            >
              <b className={error.offline ? "" : "text-red-deep"}>{error.title}</b>
              <br />
              {error.body}
            </div>
          )}
        </div>
      )}

      {step === "checking" && <ProgressSteps steps={STEPS} done={false} />}

      {step === "done" && result && (
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <ScoreRing score={Math.round(result.atsScore)} />
            <div className="flex flex-col gap-1.5">
              <b className="font-display text-[24px] leading-[1.1] font-extrabold tracking-[-0.02em]">{headline(result.atsScore)}</b>
              <p className="text-ink-soft">{result.summary}</p>
              <span className="t-help">Checked {label} just now</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {(["formatting", "keywords", "structure", "readability"] as const).map((k) => {
              const s = result.scoreBreakdown?.[k];
              if (!s) return null;
              return (
                <div key={k} className="grid grid-cols-[110px_1fr_40px] items-center gap-x-3.5 gap-y-1.5 sm:grid-cols-[120px_1fr_44px]">
                  <b className="capitalize">{k}</b>
                  <div className="h-3 overflow-hidden rounded-[10px] border-2 border-ink bg-card">
                    <div className="h-full border-r-2 border-ink" style={{ width: `${s.score}%`, background: barColour(s.score) }} />
                  </div>
                  <b className="tabular-nums">{s.score}</b>
                  <p className="col-span-2 col-start-2 mb-1.5 text-[15px] text-ink-soft">{s.feedback}</p>
                </div>
              );
            })}
          </div>

          {result.strengths?.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-[10px] border-2 border-hired bg-hired-tint p-4">
              <b className="text-hired">What&apos;s working</b>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-soft">
                {result.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}

          {fixes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <b className="font-display text-[22px] font-extrabold">Fixes</b>
              {GROUPS.map((g) => {
                const items = fixes.map((f, i) => ({ f, i })).filter(({ f }) => (f.priority ?? "low").toLowerCase() === g.key);
                if (!items.length) return null;
                return (
                  <React.Fragment key={g.key}>
                    <span className={cn("mt-1.5 self-start rounded-[10px] border-[1.5px] px-2.5 py-0.5 text-[13px] font-bold", g.cls)}>{g.label}</span>
                    {items.map(({ f, i }) => (
                      <label key={i} className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-line bg-paper px-3.5 py-3">
                        <input
                          type="checkbox"
                          className="mt-[3px] flex-none"
                          checked={ticked.has(i)}
                          onChange={() => setTicked((t) => { const n = new Set(t); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                        />
                        <span className={cn(ticked.has(i) && "text-ink-muted line-through")}>
                          <b>{f.issue}</b> {f.recommendation}
                        </span>
                      </label>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PanelDialog>
  );
}
