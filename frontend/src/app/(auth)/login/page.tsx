"use client";

import React, { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { auth_service, useAppData } from "@/context/AppContext";
import { apiError, safeNext } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeading, AuthShell, FormAlert, PasswordInput } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const { isAuth, user, loading } = useAppData();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"credentials" | string | null>(null);

  // Already signed in: go where they were heading.
  useEffect(() => {
    if (!loading && isAuth) router.replace(next ?? (user?.role === "recruiter" ? "/account" : "/jobs"));
  }, [loading, isAuth, user?.role, next, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data } = await axios.post(`${auth_service}/api/auth/login`, { email: email.trim(), password });
      Cookies.set("token", data.token, { expires: 15, path: "/", sameSite: "lax" });
      // A full load, so every part of the app starts from the signed-in user.
      window.location.assign(next ?? (data.userObject?.role === "recruiter" ? "/account" : "/jobs"));
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 400 ? "credentials" : apiError(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell line={<>Take a number.<br />We&apos;ll call you up.</>}>
      <AuthHeading title="Sign in" sub="Pick up where you left off." />

      {error && (
        <FormAlert>
          {error === "credentials" ? (
            <>That email and password don&apos;t match. Try again, or <Link href="/forgot" className="font-bold">reset your password</Link>.</>
          ) : (
            error
          )}
        </FormAlert>
      )}

      <form onSubmit={submit} className="flex flex-col gap-[18px]" noValidate={false}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot" className="inline-flex min-h-8 items-center text-[15px] font-bold">Forgot password?</Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            invalid={error === "credentials"}
            disabled={busy}
          />
        </div>
        <Button type="submit" size="lg" className="mt-1.5 w-full" loading={busy}>
          {busy ? "Signing in" : "Sign in"}
        </Button>
        {busy && <p className="t-help">If the counter&apos;s asleep this can take a few seconds.</p>}
      </form>

      <p className="border-t-[1.5px] border-line pt-[18px]">
        New to JobQ?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-bold">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
