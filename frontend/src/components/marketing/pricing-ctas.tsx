"use client";

import React from "react";
import Link from "next/link";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function priorityUntil(subscription?: string | null): Date | null {
  return subscription && new Date(subscription).getTime() > Date.now() ? new Date(subscription) : null;
}

const fullWidth = "min-h-14 w-full px-7 text-[18px]";

/** The Free plan's button: sign up when signed out, otherwise back to the jobs. */
export function FreePlanCta() {
  const { isAuth, user } = useAppData();
  if (!isAuth) return <Link href="/register" className={cn(buttonVariants({ variant: "secondary" }), fullWidth)}>Create free account</Link>;
  return (
    <Link href={user?.role === "recruiter" ? "/account" : "/jobs"} className={cn(buttonVariants({ variant: "secondary" }), fullWidth)}>
      {user?.role === "recruiter" ? "My companies" : "Browse jobs"}
    </Link>
  );
}

/** The Priority plan's button: buy, or say it's already on, or explain it's a seeker thing. */
export function PriorityPlanCta() {
  const { user } = useAppData();
  const until = priorityUntil(user?.subscription);

  if (user?.role === "recruiter") {
    return <p className="rounded-[10px] border-2 border-dashed border-ink bg-gold-tint px-4 py-3 font-bold">Priority is for job seekers. Your applicants with it show up first.</p>;
  }
  if (until) {
    return (
      <p className="rounded-[10px] border-2 border-dashed border-ink bg-gold-tint px-4 py-3 font-bold">
        Priority is on until {until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
      </p>
    );
  }
  return (
    <Link
      href="/priority"
      className="press inline-flex min-h-14 w-full items-center justify-center rounded-[10px] border-2 border-ink bg-ink px-7 text-[18px] font-bold text-gold no-underline shadow-[4px_4px_0_var(--color-card)] [--press-shadow:var(--color-card)] hover:text-gold"
    >
      Get Priority
    </Link>
  );
}

/** "Post a job" in the hiring band. */
export function PostJobCta() {
  const { user } = useAppData();
  return (
    <Link
      href={user?.role === "recruiter" ? "/account" : "/register?role=recruiter"}
      className="press inline-flex min-h-14 items-center rounded-[10px] border-2 border-paper bg-red px-7 text-[18px] font-bold text-white no-underline shadow-hard hover:text-white"
    >
      Post a job
    </Link>
  );
}
