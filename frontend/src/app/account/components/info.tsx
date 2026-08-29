"use client";

import React, { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Camera, FileText, Pencil } from "lucide-react";
import { AccontProps } from "@/type";
import { useAppData } from "@/context/AppContext";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Info: React.FC<AccontProps> = ({ user, isYourAccount }) => {
  const picRef = useRef<HTMLInputElement | null>(null);
  const resumeRef = useRef<HTMLInputElement | null>(null);

  const { updateProfilePic, updateResume, btnLoading, updateUser } = useAppData();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");

  const openEdit = () => {
    setName(user.name);
    setPhoneNumber(user.phone_number);
    setBio(user.bio || "");
    setOpen(true);
  };

  const changePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    updateProfilePic(fd);
  };

  const changeResume = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Résumé must be a PDF");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    updateResume(fd);
  };

  const isSubscribed =
    !!user.subscription && new Date(user.subscription).getTime() > Date.now();

  /* Completeness is computed, not stored — it always reflects the profile. */
  const checks = [
    { done: !!user.bio, label: "Add a short bio" },
    { done: !!user.resume, label: "Upload a résumé" },
    { done: !!user.profile_pic, label: "Add a profile photo" },
    {
      done: (user.skills?.length || 0) >= 3,
      label: `Add ${Math.max(0, 3 - (user.skills?.length || 0))} more skills`,
    },
  ];
  const complete = Math.round(
    (checks.filter((c) => c.done).length / checks.length) * 100
  );

  return (
    <section className="border border-hairline bg-raised">
      <div className="flex flex-wrap items-start gap-5 p-6">
        {/* avatar — the only circle in the system */}
        <div className="relative shrink-0">
          <span className="block size-20 overflow-hidden rounded-full border border-hairline bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.profile_pic || "/user.png"}
              alt=""
              className="size-full object-cover"
            />
          </span>
          {isYourAccount && (
            <>
              <button
                onClick={() => picRef.current?.click()}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center border border-hairline bg-raised text-ink-2 hover:bg-sunken"
              >
                <Camera className="size-3.5" />
              </button>
              <input
                ref={picRef}
                type="file"
                accept="image/*"
                onChange={changePic}
                className="hidden"
              />
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="t-h2">{user.name}</h1>
            {isYourAccount && (
              <button
                onClick={openEdit}
                aria-label="Edit profile"
                className="flex size-7 items-center justify-center border border-line-strong text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
          <p className="t-body-sm mt-0.5">
            {user.role === "jobseeker" ? "Job seeker" : "Recruiter"}
          </p>
          {user.bio && <p className="t-body mt-3">{user.bio}</p>}
        </div>

        {isYourAccount && (
          <div className="w-full shrink-0 border border-hairline bg-ground p-4 sm:w-56">
            <div className="flex items-baseline justify-between">
              <p className="t-overline">Profile</p>
              <span className="numeric font-[family-name:var(--font-display)] text-[17px] font-semibold text-ink">
                {complete}%
              </span>
            </div>
            <div className="mt-2 h-1 bg-sunken">
              <div className="h-full bg-steel" style={{ width: `${complete}%` }} />
            </div>
            <ul className="mt-3 space-y-1">
              {checks
                .filter((c) => !c.done)
                .map((c) => (
                  <li key={c.label} className="text-[13px] text-ink-3">
                    {c.label}
                  </li>
                ))}
              {complete === 100 && (
                <li className="text-[13px] text-ok-text">Profile complete</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* contact + résumé + subscription */}
      <dl className="grid gap-px border-t border-hairline bg-hairline sm:grid-cols-3">
        <div className="bg-raised px-6 py-4">
          <dt className="t-overline">Email</dt>
          <dd className="mt-1 truncate text-[15px] text-ink">{user.email}</dd>
        </div>
        <div className="bg-raised px-6 py-4">
          <dt className="t-overline">Phone</dt>
          <dd className="numeric mt-1 text-[15px] text-ink">
            {user.phone_number || "—"}
          </dd>
        </div>
        <div className="bg-raised px-6 py-4">
          <dt className="t-overline">Résumé</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-3 text-[15px]">
            {user.resume ? (
              <a
                href={user.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <FileText className="size-3.5" /> Open PDF
              </a>
            ) : (
              <StatusBadge kind="warn">No résumé on file</StatusBadge>
            )}
            {isYourAccount && (
              <>
                <button
                  onClick={() => resumeRef.current?.click()}
                  className="text-[14px] text-steel-700 hover:underline"
                >
                  {user.resume ? "Replace" : "Upload"}
                </button>
                <input
                  ref={resumeRef}
                  type="file"
                  accept="application/pdf"
                  onChange={changeResume}
                  className="hidden"
                />
              </>
            )}
          </dd>
        </div>
      </dl>

      {isYourAccount && user.role === "jobseeker" && (
        <div className="flex flex-wrap items-center gap-4 border-t border-hairline px-6 py-4">
          <div className="min-w-0 flex-1">
            <p className="t-overline">Subscription</p>
            <p className="t-body-sm mt-1">
              {isSubscribed
                ? `Priority active until ${new Date(user.subscription!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : "Priority places your application at the top of a recruiter's list. ₹119 a month, cancel any time."}
            </p>
          </div>
          {isSubscribed ? (
            <StatusBadge kind="ok">Priority active</StatusBadge>
          ) : (
            <Link href="/subscribe" className="btn-primary-sm shrink-0">
              Go priority
            </Link>
          )}
        </div>
      )}

      {/* edit profile dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Edit profile</DialogTitle>
            <DialogDescription className="t-body-sm">
              Your name and bio are visible to recruiters reviewing your
              applications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name" className="t-label">Full name</Label>
              <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-phone" className="t-label">Phone number</Label>
              <Input
                id="acc-phone"
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-bio" className="t-label">Bio</Label>
              <textarea
                id="acc-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A sentence or two about what you build."
                className="w-full resize-y border border-line-strong bg-sunken px-3 py-2 text-[15px] placeholder:text-ink-4 focus-visible:border-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="border border-line-strong px-4 py-2 text-[15px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                updateUser(name, phoneNumber, bio);
                setOpen(false);
              }}
              disabled={btnLoading}
              className="btn-primary-sm disabled:opacity-45"
            >
              {btnLoading ? "Saving…" : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Info;
