"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { AccontProps } from "@/type";
import { useAppData } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COMPETITIVE = 5;

const Skills: React.FC<AccontProps> = ({ user, isYourAccount }) => {
  const { addSkill, removeSkill, btnLoading } = useAppData();
  const [skill, setSkill] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  const skills = user.skills || [];

  const submit = () => {
    const value = skill.trim();
    if (!value) {
      toast.error("Enter a skill first");
      return;
    }
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      toast.error(`${value} is already on your profile`);
      return;
    }
    // addSkill clears the field itself once the request resolves
    addSkill(value, setSkill);
  };

  return (
    <section className="mt-6 border border-hairline bg-raised">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline px-6 py-4">
        <h2 className="t-h3">Skills</h2>
        <p className="t-body-sm">
          <span className="numeric">{skills.length}</span> added ·{" "}
          <span className="numeric">{COMPETITIVE}</span> makes a profile
          competitive
        </p>
      </div>

      <div className="p-6">
        {isYourAccount && (
          <div className="mb-4 flex gap-2">
            <Input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g. PostgreSQL"
              aria-label="Add a skill"
              className="max-w-xs"
            />
            <button
              onClick={submit}
              disabled={btnLoading}
              className="btn-primary-sm disabled:opacity-45"
            >
              Add
            </button>
          </div>
        )}

        {skills.length === 0 ? (
          <p className="t-body-sm">
            {isYourAccount
              ? "No skills yet. Recruiters filter by these, so add the ones you would want to be found for."
              : "No skills listed."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <li
                key={s}
                className="inline-flex items-center gap-1 border border-steel-200 bg-steel-100 py-1 pl-2.5 pr-1 text-[13px] text-steel-800"
              >
                {s}
                {isYourAccount && (
                  <button
                    onClick={() => setConfirming(s)}
                    aria-label={`Remove ${s}`}
                    className="p-0.5 hover:bg-steel-200"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Replaces the native confirm() the old build used. */}
      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Remove {confirming}?</DialogTitle>
            <DialogDescription className="t-body-sm">
              It will no longer appear on your profile or in recruiter
              filtering. You can add it back at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirming(null)}
              className="border border-line-strong px-4 py-2 text-[15px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
            >
              Keep it
            </button>
            <button
              onClick={() => {
                if (confirming) removeSkill(confirming);
                setConfirming(null);
              }}
              className="border border-destructive bg-destructive px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white hover:bg-[#7a3129]"
            >
              Remove
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Skills;
