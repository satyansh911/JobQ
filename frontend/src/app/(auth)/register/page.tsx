"use client";

import React, { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { auth_service, useAppData } from "@/context/AppContext";
import { apiError, cn, safeNext } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuthShell, FieldError, FormAlert, PasswordInput } from "@/components/auth/auth-shell";

type Role = "jobseeker" | "recruiter";
type Errors = Partial<Record<"email" | "phone" | "password" | "resume" | "name", React.ReactNode>>;

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <Register />
    </Suspense>
  );
}

function RoleCard({ value, role, setRole, title, body }: { value: Role; role: Role; setRole: (r: Role) => void; title: string; body: string }) {
  const on = role === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={() => setRole(value)}
      className={cn(
        "flex items-start gap-3 rounded-[10px] border-2 border-ink px-4 py-3.5 text-left md:py-3.5",
        on ? "bg-ink text-paper shadow-hard-red" : "bg-card text-ink"
      )}
    >
      <span className={cn("mt-0.5 grid size-[22px] flex-none place-items-center rounded-full border-[2.5px]", on ? "border-paper" : "border-ink")} aria-hidden>
        {on && <Check className="size-3" strokeWidth={4} />}
      </span>
      <span>
        <b className="block text-[17px] md:text-[16px]">{title}</b>
        <span className={cn("text-[15px] md:text-[14px]", on ? "opacity-85" : "text-ink-muted")}>{body}</span>
      </span>
    </button>
  );
}

function Register() {
  const { isAuth, loading } = useAppData();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [role, setRole] = useState<Role>(params.get("role") === "recruiter" ? "recruiter" : "jobseeker");
  const [step, setStep] = useState<1 | 2>(1); // phones only
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && isAuth) router.replace(next ?? "/account");
  }, [loading, isAuth, next, router]);

  const pickResume = (f?: File) => {
    setErrors((e) => ({ ...e, resume: undefined }));
    if (!f) return;
    if (f.type !== "application/pdf") return setErrors((e) => ({ ...e, resume: `${f.name} isn't a PDF. Save it as a PDF and upload again.` }));
    if (f.size > 5 * 1024 * 1024) return setErrors((e) => ({ ...e, resume: `That file is ${(f.size / 1048576).toFixed(1)}MB. Résumés need to be under 5MB.` }));
    setResume(f);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Add your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "That doesn't look like an email address.";
    if (phone.replace(/\D/g, "").length !== 10) e.phone = "Phone numbers need 10 digits.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors((prev) => ({ ...found, resume: prev.resume }));
    if (Object.keys(found).length) return;

    const fd = new FormData();
    fd.append("role", role);
    fd.append("name", name.trim());
    fd.append("email", email.trim());
    fd.append("password", password);
    fd.append("phoneNumber", phone.replace(/\D/g, ""));
    if (role === "jobseeker") {
      fd.append("bio", bio.trim());
      if (resume) fd.append("file", resume);
    }

    setBusy(true);
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/register`, fd);
      Cookies.set("token", data.token, { expires: 15, path: "/", sameSite: "lax" });
      window.location.assign(next ?? (role === "recruiter" ? "/account" : "/jobs"));
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrors((e) => ({
          ...e,
          email: <>There&apos;s already an account with this email. <Link href={`/login?email=${encodeURIComponent(email.trim())}${next ? `&next=${encodeURIComponent(next)}` : ""}`} className="font-bold">Sign in instead</Link></>,
        }));
        setStep(2);
      } else {
        setFormError(apiError(err, "Couldn't create your account. Please try again."));
      }
      setBusy(false);
    }
  };

  const field = (id: string, label: React.ReactNode, input: React.ReactNode, err?: React.ReactNode, help?: string, span = false) => (
    <div className={cn("flex flex-col gap-1.5", span && "sm:col-span-2")}>
      <Label htmlFor={id}>{label}</Label>
      {input}
      {err ? <FieldError id={`${id}-err`}>{err}</FieldError> : help ? <span className="t-help">{help}</span> : null}
    </div>
  );
  const edit = (k: keyof Errors, set: (v: string) => void) => (v: string) => {
    set(v);
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const inv = (k: keyof Errors) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <AuthShell
      art="number"
      wide
      line="Your first ticket is one form away."
      band={
        step === 1 ? (
          <span className="text-[14px] font-bold text-white">Step 1 of 2</span>
        ) : (
          <span className="flex items-center gap-3">
            <button onClick={() => setStep(1)} aria-label="Back to step 1" className="grid size-11 place-items-center rounded-[10px] border-2 border-paper text-paper">
              <ArrowLeft className="size-[18px]" strokeWidth={2.5} />
            </button>
            <span className="text-[14px] font-bold text-white">Step 2 of 2</span>
          </span>
        )
      }
    >
      {/* heading: one line on desktop; per step on phones */}
      <div className={cn("flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", step === 2 && "max-md:hidden")}>
        <h1 className="font-display text-[36px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">
          <span className="md:hidden">Who&apos;s joining?</span>
          <span className="max-md:hidden">Create account</span>
        </h1>
        <span className="text-[15px] text-ink-muted max-md:hidden">
          Have one? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-bold">Sign in</Link>
        </span>
        <p className="w-full text-ink-muted md:hidden">This decides what your account can do.</p>
      </div>

      <div role="radiogroup" aria-label="I am" className={cn("grid gap-3.5 md:grid-cols-2 md:gap-3", step === 2 && "max-md:hidden")}>
        <RoleCard value="jobseeker" role={role} setRole={setRole} title="I'm looking for work" body="Apply to roles and track tickets" />
        <RoleCard value="recruiter" role={role} setRole={setRole} title="I'm hiring" body="Post jobs and review applicants" />
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-3 md:hidden">
          <Button className="min-h-[54px] w-full" onClick={() => setStep(2)}>Continue</Button>
          <p className="text-center">Have an account? <Link href="/login" className="font-bold">Sign in</Link></p>
        </div>
      )}

      <form onSubmit={submit} noValidate className={cn("grid gap-x-4 gap-y-3.5 sm:grid-cols-2", step === 1 && "max-md:hidden")}>
        <h1 className="font-display text-[32px] leading-none font-extrabold tracking-[-0.03em] sm:col-span-2 md:hidden">Your details</h1>
        {formError && <div className="sm:col-span-2"><FormAlert>{formError}</FormAlert></div>}
        {field("name", "Full name", <Input id="name" autoComplete="name" value={name} onChange={(e) => edit("name", setName)(e.target.value)} disabled={busy} {...inv("name")} />, errors.name)}
        {field("phone", "Phone", <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => edit("phone", setPhone)(e.target.value)} disabled={busy} {...inv("phone")} />, errors.phone)}
        {field("email", "Email", <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => edit("email", setEmail)(e.target.value)} disabled={busy} {...inv("email")} />, errors.email)}
        {field("password", "Password", <PasswordInput id="password" value={password} onChange={edit("password", setPassword)} autoComplete="new-password" disabled={busy} invalid={!!errors.password} describedBy={errors.password ? "password-err" : undefined} />, errors.password, "At least 8 characters")}

        {role === "jobseeker" && (
          <>
            {field("bio", "Short bio", <Textarea id="bio" rows={2} maxLength={280} className="min-h-[72px]" placeholder="A line or two about you. Recruiters see this first." value={bio} onChange={(e) => setBio(e.target.value)} disabled={busy} />, undefined, undefined, true)}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[15px] font-bold">Résumé <span className="t-help">optional, you can add it later</span></span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className={cn(
                  "flex min-h-14 items-center gap-3.5 rounded-[10px] border-2 bg-card px-3.5 py-2.5 text-left",
                  errors.resume ? "border-red-deep bg-error-tint" : resume ? "border-ink" : "border-dashed border-ink"
                )}
              >
                {resume ? <Check className="size-[22px] text-hired" strokeWidth={3} aria-hidden /> : <Upload className="size-[22px]" strokeWidth={2.25} aria-hidden />}
                <span className="min-w-0">
                  {errors.resume ? (
                    <span className="text-[14px]">{errors.resume}</span>
                  ) : resume ? (
                    <><b className="break-all">{resume.name}</b> <span className="t-help">· change</span></>
                  ) : (
                    <><b>Upload a PDF</b> <span className="t-help">· up to 5MB</span></>
                  )}
                </span>
              </button>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { pickResume(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </>
        )}

        <Button type="submit" size="lg" className="mt-1.5 w-full sm:col-span-2" loading={busy}>
          {busy ? "Creating your account" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
