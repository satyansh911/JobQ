"use client";

import React, { useState } from "react";
import axios from "axios";
import { job_service } from "@/context/AppContext";
import { apiError } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDanger,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/auth/auth-shell";
import { authHeaders, plural } from "./shared";

/** Deleting a company takes its jobs and applications with it, so the name has to be typed. */
export function DeleteCompanyDialog({
  company,
  jobs,
  applications,
  onOpenChange,
  onDeleted,
}: {
  company: { company_id: string | number; name: string } | null;
  jobs: number;
  applications: number;
  onOpenChange: (o: boolean) => void;
  onDeleted: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shown, setShown] = useState(company);
  if (company !== shown) {
    setShown(company);
    setTyped("");
    setError(null);
  }

  const matches = !!company && typed.trim().toLowerCase() === company.name.trim().toLowerCase();

  const remove = async () => {
    if (!company || !matches) return;
    setBusy(true);
    setError(null);
    try {
      await axios.delete(`${job_service}/api/job/company/${company.company_id}`, authHeaders());
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      setError(apiError(err, "Couldn't delete the company."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={!!company} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogTitle>Delete {company?.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          {jobs > 0 ? (
            <>
              Its <b className="text-ink">{plural(jobs, "job")}</b>
              {applications > 0 && <> and the <b className="text-ink">{plural(applications, "application")}</b> on them</>} will be deleted too.{" "}
            </>
          ) : null}
          This can&apos;t be undone.
        </AlertDialogDescription>
        <form onSubmit={(e) => { e.preventDefault(); remove(); }} className="flex flex-col gap-1.5">
          <Label htmlFor="del-company">
            Type <span className="font-bold">{company?.name}</span> to confirm
          </Label>
          <Input id="del-company" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" disabled={busy} />
        </form>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep company</AlertDialogCancel>
          <AlertDialogDanger disabled={!matches || busy} onClick={remove}>
            {busy ? "Deleting" : jobs > 0 ? "Delete company and jobs" : "Delete company"}
          </AlertDialogDanger>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
