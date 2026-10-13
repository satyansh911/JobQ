"use client";

import React, { useState } from "react";
import axios from "axios";
import { Minus, Plus } from "lucide-react";
import { job_service } from "@/context/AppContext";
import { Job } from "@/type";
import { apiError, cn, formatSalary } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PanelDialog } from "@/components/ui/panel-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDanger,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldError, FormAlert } from "@/components/auth/auth-shell";
import { authHeaders, CITIES, JOB_TYPES, plural, ROLES, WORK_MODES } from "./shared";

type Errors = Partial<Record<"title" | "role" | "description" | "salary" | "location" | "openings" | "work_location" | "job_type", string>>;

/** Pick one of a few, as a row of joined buttons. */
function Segmented<T extends string>({
  label,
  id,
  value,
  options,
  onChange,
  error,
  disabled,
}: {
  label: string;
  id: string;
  value: T | "";
  options: T[];
  onChange: (v: T) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-[15px] font-bold">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn("grid overflow-hidden rounded-[10px] border-2", error ? "border-red-deep" : "border-ink")}
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            disabled={disabled}
            onClick={() => onChange(o)}
            className={cn(
              "min-h-11 px-1 text-[14px] font-bold sm:text-[15px]",
              i > 0 && "border-l-2 border-ink",
              value === o ? "bg-ink text-paper" : "bg-card text-ink hover:bg-paper-deep",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  );
}

/** Post a job, or edit one when `job` is passed. */
export function JobDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  job,
  applicants = 0,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string | number;
  companyName: string;
  job?: Job | null;
  applicants?: number;
  onSaved: (job: Job, created: boolean) => void;
  onDelete?: (job: Job) => void;
}) {
  const editing = !!job;
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [openings, setOpenings] = useState(1);
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<Job["work_location"] | "">("");
  const [jobType, setJobType] = useState<Job["job_type"] | "">("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fill the form each time the dialog opens (state adjusted during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle(job?.title ?? "");
      setRole(job?.role ?? "");
      setOpenings(job ? Math.max(1, Math.round(Number(job.openings))) : 1);
      setDescription(job?.description ?? "");
      setSalary(job?.salary ? String(Math.round(Number(job.salary))) : "");
      setLocation(job?.location ?? "");
      setWorkMode(job?.work_location ?? "");
      setJobType(job?.job_type ?? "");
      setActive(job ? job.is_active !== false : true);
      setErrors({});
      setFormError(null);
    }
  }

  // Keep a value that isn't in the list (older jobs typed their own) selectable.
  const roles = role && !ROLES.includes(role) ? [role, ...ROLES] : ROLES;
  const cities = location && !CITIES.includes(location) ? [location, ...CITIES] : CITIES;
  const salaryNumber = Number(salary || 0);

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  const save = async () => {
    setFormError(null);
    const found: Errors = {};
    if (!title.trim()) found.title = "Add a job title.";
    if (!role) found.role = "Pick a role.";
    if (!description.trim()) found.description = "Say what the job is and who you're looking for.";
    if (!(salaryNumber > 0)) found.salary = "Add the annual salary in rupees.";
    if (!location) found.location = "Pick a city.";
    if (!workMode) found.work_location = "Pick a work mode.";
    if (!jobType) found.job_type = "Pick a job type.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const body = {
      title: title.trim(),
      role,
      description: description.trim(),
      salary: salaryNumber,
      location,
      openings,
      work_location: workMode,
      job_type: jobType,
      ...(editing ? { is_active: active } : { company_id: companyId }),
    };

    setBusy(true);
    try {
      const { data } = editing
        ? await axios.put(`${job_service}/api/job/${job!.job_id}`, body, authHeaders())
        : await axios.post(`${job_service}/api/job/new`, body, authHeaders());
      onSaved(data.job, !editing);
      onOpenChange(false);
    } catch (err) {
      setFormError(apiError(err, editing ? "Couldn't save the job." : "Couldn't post the job."));
    } finally {
      setBusy(false);
    }
  };

  const inv = (k: keyof Errors) => ({
    "aria-invalid": !!errors[k] || undefined,
    "aria-describedby": errors[k] ? `jb-${k}-err` : undefined,
  });

  return (
    <PanelDialog
      open={open}
      onOpenChange={onOpenChange}
      closable={!busy}
      title={editing ? "Edit job" : "Post a job"}
      description={editing ? `${job!.title} · ${plural(applicants, "applicant")}` : `at ${companyName}`}
      width={640}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            {busy ? "Saving" : editing ? "Save changes" : "Post job"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[18px]">
        <p className="t-help -mt-2" aria-hidden>
          {editing ? `${job!.title} · ${plural(applicants, "applicant")}` : `at ${companyName}`}
        </p>
        {formError && <FormAlert>{formError}</FormAlert>}

        {editing && (
          <label className={cn("flex cursor-pointer items-start gap-4 rounded-[10px] border-2 border-ink px-4 py-3.5", active ? "bg-hired-tint" : "bg-paper-deep")}>
            <Switch checked={active} onCheckedChange={setActive} disabled={busy} aria-describedby="jb-active-help" />
            <span>
              <b className="block">{active ? "Open for applications" : "Closed"}</b>
              <span id="jb-active-help" className="text-[14px] text-ink-soft">
                {active ? "Switch off to close it. It stays on your company page as Closed." : "Nobody new can apply. Switch on to open it again."}
              </span>
            </span>
          </label>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jb-title">Job title</Label>
          <Input
            id="jb-title"
            value={title}
            placeholder="Engineering Intern"
            onChange={(e) => {
              setTitle(e.target.value);
              clear("title");
            }}
            disabled={busy}
            {...inv("title")}
          />
          {errors.title && <FieldError id="jb-title-err">{errors.title}</FieldError>}
        </div>

        <div className="grid gap-x-4 gap-y-[18px] sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jb-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                clear("role");
              }}
              disabled={busy}
            >
              <SelectTrigger id="jb-role" {...inv("role")}>
                <SelectValue placeholder="Pick a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <FieldError id="jb-role-err">{errors.role}</FieldError>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jb-openings">Openings</Label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="shadow-none"
                aria-label="One fewer opening"
                disabled={busy || openings <= 1}
                onClick={() => setOpenings((n) => Math.max(1, n - 1))}
              >
                <Minus strokeWidth={2.75} />
              </Button>
              <Input
                id="jb-openings"
                inputMode="numeric"
                className="w-20 text-center tabular-nums"
                value={openings}
                onChange={(e) => setOpenings(Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 1)))}
                disabled={busy}
              />
              <Button
                variant="secondary"
                size="icon"
                className="shadow-none"
                aria-label="One more opening"
                disabled={busy}
                onClick={() => setOpenings((n) => Math.min(999, n + 1))}
              >
                <Plus strokeWidth={2.75} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="jb-description">Description</Label>
          <Textarea
            id="jb-description"
            rows={6}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clear("description");
            }}
            disabled={busy}
            placeholder={"A short summary, then:\n\nWhat you'll do:\n- …\n\nWho we're looking for:\n- …"}
            {...inv("description")}
          />
          {errors.description ? (
            <FieldError id="jb-description-err">{errors.description}</FieldError>
          ) : (
            <span className="t-help">What the job is, what they&apos;ll do, and who you&apos;re looking for. Lines starting with - become bullets.</span>
          )}
        </div>

        <div className="grid gap-x-4 gap-y-[18px] sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jb-salary">Annual salary</Label>
            <span className="relative block">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-bold" aria-hidden>
                ₹
              </span>
              <Input
                id="jb-salary"
                inputMode="numeric"
                className="pl-8 tabular-nums"
                placeholder="6,00,000"
                value={salary ? salaryNumber.toLocaleString("en-IN") : ""}
                onChange={(e) => {
                  setSalary(e.target.value.replace(/\D/g, "").slice(0, 9));
                  clear("salary");
                }}
                disabled={busy}
                {...inv("salary")}
                aria-describedby={errors.salary ? "jb-salary-err" : "jb-salary-help"}
              />
            </span>
            {errors.salary ? (
              <FieldError id="jb-salary-err">{errors.salary}</FieldError>
            ) : (
              <span id="jb-salary-help" className="t-help">
                {salaryNumber > 0 ? (
                  <>
                    Shows as <b className="text-ink">{formatSalary(salaryNumber)}</b>
                  </>
                ) : (
                  "Per year, in rupees"
                )}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jb-city">City</Label>
            <Select
              value={location}
              onValueChange={(v) => {
                setLocation(v);
                clear("location");
              }}
              disabled={busy}
            >
              <SelectTrigger id="jb-city" {...inv("location")}>
                <SelectValue placeholder="Pick a city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location && <FieldError id="jb-location-err">{errors.location}</FieldError>}
          </div>
        </div>

        <Segmented
          id="jb-mode"
          label="Work mode"
          value={workMode}
          options={WORK_MODES}
          onChange={(v) => {
            setWorkMode(v);
            clear("work_location");
          }}
          error={errors.work_location}
          disabled={busy}
        />
        <Segmented
          id="jb-type"
          label="Job type"
          value={jobType}
          options={JOB_TYPES}
          onChange={(v) => {
            setJobType(v);
            clear("job_type");
          }}
          error={errors.job_type}
          disabled={busy}
        />

        {editing && onDelete && (
          <button type="button" onClick={() => onDelete(job!)} disabled={busy} className="self-start py-2 font-bold text-red-deep underline">
            Delete this job
          </button>
        )}
      </div>
    </PanelDialog>
  );
}

/** Deleting removes the applications too, so offer closing instead. */
export function DeleteJobDialog({
  job,
  applicants,
  onOpenChange,
  onDeleted,
  onClosedInstead,
}: {
  job: Job | null;
  applicants: number;
  onOpenChange: (o: boolean) => void;
  onDeleted: (job: Job) => void;
  onClosedInstead: (job: Job) => void;
}) {
  const [busy, setBusy] = useState<"delete" | "close" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shown, setShown] = useState(job);
  if (job !== shown) {
    setShown(job);
    setError(null);
  }

  const run = async (kind: "delete" | "close") => {
    if (!job) return;
    setBusy(kind);
    setError(null);
    try {
      if (kind === "delete") {
        await axios.delete(`${job_service}/api/job/${job.job_id}`, authHeaders());
        onDeleted(job);
      } else {
        const { data } = await axios.put(`${job_service}/api/job/${job.job_id}`, { is_active: false }, authHeaders());
        onClosedInstead(data.job);
      }
      onOpenChange(false);
    } catch (err) {
      setError(apiError(err, kind === "delete" ? "Couldn't delete the job." : "Couldn't close the job."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <AlertDialog open={!!job} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogTitle>Delete {job?.title}?</AlertDialogTitle>
        <AlertDialogDescription>
          {applicants > 0 ? `The job and its ${plural(applicants, "application")} will be removed.` : "The job will be removed."}
          {job?.is_active !== false ? " If you only want to stop new applications, close the job instead." : " This can't be undone."}
        </AlertDialogDescription>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          {job?.is_active !== false ? (
            <Button variant="secondary" size="sm" loading={busy === "close"} disabled={!!busy} onClick={() => run("close")}>
              {busy === "close" ? "Closing" : "Close job instead"}
            </Button>
          ) : (
            <AlertDialogCancel disabled={!!busy}>Keep job</AlertDialogCancel>
          )}
          <AlertDialogDanger disabled={!!busy} onClick={() => run("delete")}>
            {busy === "delete" ? "Deleting" : "Delete job"}
          </AlertDialogDanger>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
