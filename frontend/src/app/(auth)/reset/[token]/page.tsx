"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Check, Clock } from "lucide-react";
import { auth_service, useAppData } from "@/context/AppContext";
import { apiError, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading, AuthShell, FieldError, FormAlert, PasswordInput, StateIcon } from "@/components/auth/auth-shell";

/** Read the email and expiry out of the link. Only to prefill and to skip a doomed form; the server still checks it. */
function readToken(token: string): { email: string; expired: boolean } {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const body = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "=")));
    return { email: typeof body.email === "string" ? body.email : "", expired: typeof body.exp === "number" && body.exp * 1000 < Date.now() };
  } catch {
    return { email: "", expired: true };
  }
}

const LINE = <>Lost your ticket?<br />We&apos;ll print a new one.</>;

export default function ResetPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuth, loading } = useAppData();
  const router = useRouter();
  const info = useMemo(() => readToken(decodeURIComponent(token)), [token]);

  const [state, setState] = useState<"form" | "done" | "expired" | "sent">(info.expired ? "expired" : "form");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [email, setEmail] = useState(info.email);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuth) router.replace("/account");
  }, [loading, isAuth, router]);

  const longEnough = password.length >= 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setError(null);
    if (!longEnough || confirm !== password) return;
    setBusy(true);
    try {
      await axios.post(`${auth_service}/api/auth/reset/${encodeURIComponent(token)}`, { password });
      setState("done");
    } catch (err) {
      const msg = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      if (msg?.status === 400 && /expired|used/i.test(msg.data?.message ?? "")) setState("expired");
      else setError(apiError(err, "Couldn't save your password. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const resend = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await axios.post(`${auth_service}/api/auth/forgot`, { email: email.trim() });
      setState("sent");
    } catch (err) {
      setError(apiError(err, "Couldn't send the link. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (state === "done") {
    return (
      <AuthShell line={LINE}>
        <StateIcon tone="hired"><Check strokeWidth={3} /></StateIcon>
        <AuthHeading title="Password updated" sub="You can sign in with your new password now." />
        <Button asChild size="lg" className="w-full"><Link href="/login">Sign in</Link></Button>
      </AuthShell>
    );
  }

  if (state === "sent") {
    return (
      <AuthShell line={LINE}>
        <AuthHeading
          title="Check your inbox"
          sub={<>If an account uses <b className="break-all text-ink">{email.trim()}</b>, a new reset link is on its way. Use it within 15 minutes.</>}
        />
        <Link href="/login" className="self-start font-bold">Back to sign in</Link>
      </AuthShell>
    );
  }

  if (state === "expired") {
    return (
      <AuthShell line={LINE}>
        <StateIcon tone="plain"><Clock strokeWidth={2.5} /></StateIcon>
        <AuthHeading title="This link has expired" sub="Reset links work once and only for a short while. Ask for a fresh one and use it soon." />
        {error && <FormAlert>{error}</FormAlert>}
        <form onSubmit={resend} className="flex flex-col gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} required />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>{busy ? "Sending" : "Send a new link"}</Button>
        </form>
        <Link href="/login" className="self-start font-bold">Back to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell line={LINE}>
      <AuthHeading title="Set a new password" sub={info.email ? <>For <b className="break-all text-ink">{info.email}</b></> : undefined} />
      {error && <FormAlert>{error}</FormAlert>}
      <form onSubmit={save} noValidate className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={busy}
            invalid={tried && !longEnough}
            describedBy="password-rule"
          />
          <span id="password-rule" className={cn("flex items-center gap-1.5 text-[14px]", longEnough ? "text-hired" : tried ? "text-red-deep" : "text-ink-muted")}>
            {longEnough && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
            At least 8 characters
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            disabled={busy}
            invalid={mismatch || (tried && !confirm)}
            describedBy={mismatch || (tried && !confirm) ? "confirm-err" : undefined}
          />
          {mismatch ? (
            <FieldError id="confirm-err">These don&apos;t match yet.</FieldError>
          ) : tried && !confirm ? (
            <FieldError id="confirm-err">Type the new password again.</FieldError>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>{busy ? "Saving" : "Save password"}</Button>
      </form>
    </AuthShell>
  );
}
