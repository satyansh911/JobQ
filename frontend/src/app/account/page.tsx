"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppContext";
import { Skeleton } from "@/components/jq/feedback";
import { SeekerDashboard } from "@/components/dashboard/seeker-dashboard";
import { MyCompanies } from "@/components/recruiter/my-companies";

function DashboardSkeleton() {
  return (
    <div className="container-app flex flex-wrap gap-9 pt-9 pb-20" role="status" aria-label="Loading your dashboard">
      <div className="flex w-full flex-col gap-3 rounded-[10px] border-2 border-ink bg-card p-5 md:max-w-[380px]">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-[72px] rounded-full" />
          <div className="flex flex-1 flex-col gap-2"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-3.5 w-1/2" /></div>
        </div>
        <Skeleton className="h-3.5" /><Skeleton className="h-3.5 w-[85%]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-2/5" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-[10px]" />)}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { isAuth, user, loading } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) router.replace(`/login?next=${encodeURIComponent("/account")}`);
  }, [isAuth, loading, router]);

  if (loading || !user) return <DashboardSkeleton />;

  if (user.role === "jobseeker") {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <SeekerDashboard user={user} />
      </Suspense>
    );
  }

  return <MyCompanies user={user} />;
}
