"use client";

import React, { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Mail } from "lucide-react";
import { auth_service, useAppData } from "@/context/AppContext";
import { apiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading, AuthShell, FormAlert, StateIcon } from "@/components/auth/auth-shell";

const RESEND_AFTER = 60;

export default function ForgotPage() {
  return (
    <Suspense fallback={null}>
      <Forgot />
    </Suspense>
  );
}

function Forgot() {
  const { isAuth, loading } = useAppData();
  const router = useRouter();
  const [email, setEmail] = useState(useSearchParams().get("email") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!loading && isAuth) router.replace("/account");
  }, [loading, isAuth, router]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await axios.post(`${auth_service}/api/auth/forgot`, { email: email.trim() });
      setSentTo(email.trim());
      setWait(RESEND_AFTER);
    } catch (err) {
      setError(apiError(err, "Couldn't send the link. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell line={<>Lost your ticket?<br />We&apos;ll print a new one.</>}>
        <StateIcon tone="queue"><Mail strokeWidth={2.5} /></StateIcon>
        <AuthHeading
          title="Check your inbox"
          sub={<>If an account uses <b className="break-all text-ink">{sentTo}</b>, a reset link is on its way. It can take a minute or two.</>}
        />
        <p className="t-help">Nothing there? Check spam or promotions.</p>
        {error && <FormAlert>{error}</FormAlert>}
        <Button variant="secondary" size="lg" className="w-full" disabled={wait > 0} loading={busy} onClick={() => send()}>
          {wait > 0 ? `Send again in ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}` : busy ? "Sending" : "Send again"}
        </Button>
        <Link href="/login" className="self-start font-bold">Back to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell line={<>Lost your ticket?<br />We&apos;ll print a new one.</>}>
      <Link href="/login" className="inline-flex min-h-8 items-center gap-1.5 self-start font-bold">
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden /> Back to sign in
      </Link>
      <AuthHeading title="Forgot your password?" sub="Enter the email you signed up with. We'll send you a link to set a new one." />
      {error && <FormAlert>{error}</FormAlert>}
      <form onSubmit={send} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} required />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {busy ? "Sending" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
