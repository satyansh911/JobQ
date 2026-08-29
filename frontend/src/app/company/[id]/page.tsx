"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Company, Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { formatSalary } from "@/lib/utils";
import Loading from "@/components/loading";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initials = (n: string) =>
  n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const LOCATIONS = ["Remote", "Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune", "Kolkata", "Chennai"];

export default function CompanyPage() {
  const { id } = useParams();
  const { user } = useAppData();
  const token = Cookies.get("token");

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [confirming, setConfirming] = useState<Job | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [openings, setOpenings] = useState("");
  const [jobType, setJobType] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [isActive, setIsActive] = useState(true);

  const clear = () => {
    setTitle(""); setDescription(""); setRole(""); setSalary("");
    setLocation(""); setOpenings(""); setJobType(""); setWorkLocation("");
    setIsActive(true);
  };

  async function fetchCompany() {
    try {
      const { data } = await axios.get(`${job_service}/api/job/company/${id}`);
      setCompany(data);
    } catch {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = !!user && !!company && user.user_id === company.recruiter_id;
  const jobs = company?.jobs || [];
  const activeCount = jobs.filter((j) => j.is_active).length;

  const valid = title && description && role && salary && location && openings && jobType && workLocation;

  const addJob = async () => {
    if (!valid) return toast.error("Every field is required");
    setBtnLoading(true);
    try {
      await axios.post(
        `${job_service}/api/job/new`,
        {
          title, description, role,
          salary: Number(salary), location,
          openings: Number(openings),
          job_type: jobType, work_location: workLocation,
          company_id: id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Job posted");
      clear();
      setAddOpen(false);
      fetchCompany();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not post the job");
    } finally {
      setBtnLoading(false);
    }
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setTitle(job.title);
    setDescription(job.description);
    setRole(job.role);
    setSalary(String(job.salary || ""));
    setLocation(job.location || "");
    setOpenings(String(Math.round(Number(job.openings))));
    setJobType(job.job_type);
    setWorkLocation(job.work_location);
    setIsActive(job.is_active);
  };

  const updateJob = async () => {
    if (!editing) return;
    setBtnLoading(true);
    try {
      await axios.put(
        `${job_service}/api/job/${editing.job_id}`,
        {
          title, description, role,
          salary: Number(salary), location,
          openings: Number(openings),
          job_type: jobType, work_location: workLocation,
          is_active: isActive,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Job updated");
      setEditing(null);
      clear();
      fetchCompany();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update the job");
    } finally {
      setBtnLoading(false);
    }
  };

  const deleteJob = async (jobId: number) => {
    setBtnLoading(true);
    try {
      await axios.delete(`${job_service}/api/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Posting deleted");
      fetchCompany();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete");
    } finally {
      setBtnLoading(false);
      setConfirming(null);
    }
  };

  if (loading) return <Loading />;

  if (!company) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-20 text-center md:px-6">
        <h1 className="t-h2">Company not found</h1>
        <Link href="/jobs" className="btn-primary-sm mt-6">Browse open roles</Link>
      </div>
    );
  }

  /* One form, shared by the add and edit dialogs. */
  const form = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="j-title" className="t-label">Job title</Label>
        <Input id="j-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="j-desc" className="t-label">Description</Label>
        <textarea
          id="j-desc"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short role summary, then responsibilities, then requirements."
          className="w-full resize-y border border-line-strong bg-sunken px-3 py-2 text-[15px] placeholder:text-ink-4 focus-visible:border-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
        />
        <p className="t-body-sm">
          Candidates read this as prose. A summary, responsibilities and
          requirements — in that order — reads best.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="j-role" className="t-label">Role</Label>
          <Input id="j-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Frontend Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="j-salary" className="t-label">Annual salary (₹)</Label>
          <Input id="j-salary" type="number" inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="3200000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="j-location" className="t-label">Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger id="j-location"><SelectValue placeholder="Select a location" /></SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="j-openings" className="t-label">Openings</Label>
          <Input id="j-openings" type="number" inputMode="numeric" min={1} value={openings} onChange={(e) => setOpenings(e.target.value)} placeholder="2" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="j-type" className="t-label">Job type</Label>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger id="j-type"><SelectValue placeholder="Select a type" /></SelectTrigger>
            <SelectContent>
              {["Full-time", "Part-time", "Contract", "Internship"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="j-work" className="t-label">Work location</Label>
          <Select value={workLocation} onValueChange={setWorkLocation}>
            <SelectTrigger id="j-work"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["On-site", "Remote", "Hybrid"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {editing && (
        <div className="space-y-1.5">
          <Label htmlFor="j-active" className="t-label">Posting status</Label>
          <Select value={isActive ? "active" : "closed"} onValueChange={(v) => setIsActive(v === "active")}>
            <SelectTrigger id="j-active"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active — accepting applications</SelectItem>
              <SelectItem value="closed">Closed — visible but not accepting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
      {/* company header */}
      <section className="border border-hairline bg-raised p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden border border-hairline bg-sunken font-[family-name:var(--font-display)] text-[18px] font-semibold text-ink-3">
            {company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt="" className="size-full object-cover" />
            ) : (
              initials(company.name)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="t-h2">{company.name}</h1>
            <p className="t-body mt-1">{company.description}</p>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[14px]"
              >
                {company.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* postings */}
      <section className="mt-6 border border-hairline bg-raised">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
          <div>
            <h2 className="t-h3">Open roles</h2>
            <p className="t-body-sm mt-0.5">
              <span className="numeric">{activeCount}</span> active ·{" "}
              <span className="numeric">{jobs.length}</span> total
            </p>
          </div>
          {isOwner && (
            <button onClick={() => { clear(); setAddOpen(true); }} className="btn-primary-sm">
              <Plus className="size-4" /> Post a job
            </button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="t-h3">No roles posted yet</h3>
            <p className="t-body-sm mx-auto mt-1 max-w-sm">
              {isOwner
                ? "Post your first role and it appears in the public listing immediately."
                : "This company hasn't posted anything yet."}
            </p>
            {isOwner && (
              <button onClick={() => { clear(); setAddOpen(true); }} className="btn-primary-sm mt-5">
                Post a job
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[color-mix(in_srgb,var(--color-ink)_16%,transparent)]">
            {jobs.map((j) => (
              <li key={j.job_id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${j.job_id}`}
                      className="font-[family-name:var(--font-display)] text-[17px] font-semibold"
                    >
                      {j.title}
                    </Link>
                    <StatusBadge kind={j.is_active ? "ok" : "bad"}>
                      {j.is_active ? "Active" : "Closed"}
                    </StatusBadge>
                  </div>
                  <p className="t-body-sm mt-0.5">
                    {[j.role, j.location, j.location === j.work_location ? null : j.work_location, j.job_type]
                      .filter(Boolean)
                      .join(" · ")}{" · "}
                    <span className="numeric">{Math.round(Number(j.openings))}</span>{" "}
                    {Math.round(Number(j.openings)) === 1 ? "opening" : "openings"}
                  </p>
                </div>

                <span className="numeric font-[family-name:var(--font-display)] text-[16px] font-semibold text-ink">
                  {formatSalary(j.salary)}
                </span>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(j)}
                      aria-label={`Edit ${j.title}`}
                      className="flex size-9 items-center justify-center border border-line-strong text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setConfirming(j)}
                      aria-label={`Delete ${j.title}`}
                      className="flex size-9 items-center justify-center border border-line-strong text-ink-3 hover:bg-bad-tint hover:text-bad-text"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* post a job */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) clear(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Post a job</DialogTitle>
            <DialogDescription className="t-body-sm">
              It goes live in the public listing as soon as you post it.
            </DialogDescription>
          </DialogHeader>
          {form}
          <DialogFooter>
            <button
              onClick={() => setAddOpen(false)}
              className="border border-line-strong px-4 py-2 text-[15px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
            >
              Cancel
            </button>
            <button onClick={addJob} disabled={btnLoading} className="btn-primary-sm disabled:opacity-45">
              {btnLoading ? "Posting…" : "Post job"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit posting */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); clear(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Edit posting</DialogTitle>
            <DialogDescription className="t-body-sm">
              Changes are live immediately. Closing a posting keeps it readable
              but stops new applications.
            </DialogDescription>
          </DialogHeader>
          {form}
          <DialogFooter>
            <button
              onClick={() => { setEditing(null); clear(); }}
              className="border border-line-strong px-4 py-2 text-[15px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
            >
              Cancel
            </button>
            <button onClick={updateJob} disabled={btnLoading} className="btn-primary-sm disabled:opacity-45">
              {btnLoading ? "Saving…" : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm — replaces the native confirm() */}
      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="t-h3">Delete this posting?</DialogTitle>
            <DialogDescription className="t-body-sm">
              &ldquo;{confirming?.title}&rdquo; and every application attached to
              it are removed. This cannot be undone — closing it instead keeps
              the record.
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
              onClick={() => confirming && deleteJob(confirming.job_id)}
              disabled={btnLoading}
              className="border border-destructive bg-destructive px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white hover:bg-[#7a3129] disabled:opacity-45"
            >
              {btnLoading ? "Deleting…" : "Delete posting"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
