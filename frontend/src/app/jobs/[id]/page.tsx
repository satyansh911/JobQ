"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ExternalLink, FileText } from "lucide-react";
import { job_service, useAppData } from "@/context/AppContext";
import { Application, Job } from "@/type";
import { formatSalary, cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initials = (n: string) =>
  n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const daysAgo = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

const postedLabel = (iso: string) => {
  const d = daysAgo(iso);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
};

export default function JobPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuth, applyJob, applications, btnLoading } = useAppData();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobApplications, setJobApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [pending, setPending] = useState<Record<number, string>>({});

  const token = Cookies.get("token");

  const myApplication = (applications || []).find(
    (a) => String(a.job_id) === String(id)
  );
  const applied = !!myApplication;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${job_service}/api/job/${id}`);
        setJob(data);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isOwner = !!user && !!job && user.user_id === job.posted_by_recruiter_id;

  async function fetchJobApplications() {
    try {
      const { data } = await axios.get(
        `${job_service}/api/job/application/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobApplications(data);
    } catch {
      /* the owner check below already gates this */
    }
  }

  useEffect(() => {
    if (isOwner) fetchJobApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const updateApplication = async (applicationId: number) => {
    const status = pending[applicationId];
    if (!status) return toast.error("Choose a status first");
    try {
      const { data } = await axios.put(
        `${job_service}/api/job/application/update/${applicationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      fetchJobApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        <div className="skeleton h-4 w-64" />
        <div className="skeleton mt-6 h-10 w-2/3" />
        <div className="skeleton mt-8 h-64 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20 text-center md:px-6">
        <h1 className="t-h2">This role is no longer available</h1>
        <p className="t-body-sm mt-2">
          It may have been removed by the company.
        </p>
        <Link href="/jobs" className="btn-primary-sm mt-6">
          Browse open roles
        </Link>
      </div>
    );
  }

  const closed = !job.is_active;
  const filtered =
    filterStatus === "All"
      ? jobApplications
      : jobApplications.filter((a) => a.status === filterStatus);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="t-body-sm mb-5">
        <Link href="/jobs">All roles</Link>
        <span className="mx-2 text-ink-4">/</span>
        <Link href={`/company/${job.company_id}`}>{job.company_name}</Link>
        <span className="mx-2 text-ink-4">/</span>
        <span className="text-ink-2">{job.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge kind={closed ? "bad" : "ok"}>
          {closed ? "Closed" : "Active"}
        </StatusBadge>
        <p className="t-body-sm">
          Posted {postedLabel(job.created_at)}
          {isOwner && jobApplications.length > 0 && (
            <>
              {" · "}
              <span className="numeric">{jobApplications.length}</span>{" "}
              {jobApplications.length === 1 ? "applicant" : "applicants"} so far
            </>
          )}
        </p>
      </div>

      <h1 className="t-h1 mt-3">{job.title}</h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-hairline bg-sunken font-[family-name:var(--font-display)] text-[14px] font-semibold text-ink-3">
          {job.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company_logo} alt="" className="size-full object-cover" />
          ) : (
            initials(job.company_name || "?")
          )}
        </span>
        <div className="min-w-0">
          <Link
            href={`/company/${job.company_id}`}
            className="font-[family-name:var(--font-display)] text-[17px] font-semibold"
          >
            {job.company_name}
          </Link>
          {job.company_website && (
            <p className="t-body-sm truncate">{job.company_website}</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ---------------- main column ---------------- */}
        <div className="min-w-0">
          <h2 className="t-h2">About the role</h2>
          <p className="t-body-lg mt-3 whitespace-pre-line">{job.description}</p>

          <h2 className="t-h2 mt-10">At a glance</h2>
          <dl className="mt-4 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
            {[
              ["Work location", job.work_location],
              ["Type", job.job_type],
              ["Openings", String(Math.round(Number(job.openings)))],
              ["Posted", postedLabel(job.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="bg-raised px-4 py-3">
                <dt className="t-overline">{k}</dt>
                <dd className="mt-1 font-[family-name:var(--font-display)] text-[17px] font-semibold text-ink">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          {/* ---------------- recruiter: applicant review ---------------- */}
          {isOwner && (
            <section className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="t-h2">Applicants</h2>
                <div className="flex gap-1">
                  {["All", "Submitted", "Hired", "Rejected"].map((s) => {
                    const n =
                      s === "All"
                        ? jobApplications.length
                        : jobApplications.filter((a) => a.status === s).length;
                    return (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={cn(
                          "border px-2.5 py-1 text-[13px]",
                          filterStatus === s
                            ? "border-primary bg-primary text-white"
                            : "border-line-strong text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
                        )}
                      >
                        {s} <span className="numeric">{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="t-body-sm mt-4 border border-hairline bg-raised px-4 py-8 text-center">
                  {jobApplications.length === 0
                    ? "No one has applied yet."
                    : `No ${filterStatus.toLowerCase()} applications.`}
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto border border-hairline bg-raised">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="border-b border-hairline">
                        {["Applicant", "Applied", "Résumé", "Status", ""].map((h) => (
                          <th key={h} className="t-overline px-4 py-2.5 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => (
                        <tr key={a.application_id} className="border-b border-hairline last:border-0">
                          <td className="px-4 py-3">
                            <p className="text-[15px] text-ink">{a.applicant_email}</p>
                            {a.subscribed && (
                              <span className="status-accent mt-1 inline-block px-1.5 py-0.5 text-[11px]">
                                Priority
                              </span>
                            )}
                          </td>
                          <td className="numeric px-4 py-3 text-[14px] text-ink-3">
                            {new Date(a.applied_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            {a.resume ? (
                              <a
                                href={a.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[14px]"
                              >
                                <FileText className="size-3.5" /> Open
                              </a>
                            ) : (
                              <span className="text-[14px] text-ink-4">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              kind={
                                a.status === "Hired"
                                  ? "ok"
                                  : a.status === "Rejected"
                                    ? "bad"
                                    : "neutral"
                              }
                            >
                              {a.status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Select
                                value={pending[a.application_id] || ""}
                                onValueChange={(v) =>
                                  setPending((p) => ({ ...p, [a.application_id]: v }))
                                }
                              >
                                <SelectTrigger
                                  aria-label={`Set status for ${a.applicant_email}`}
                                  className="h-8 w-[130px]"
                                >
                                  <SelectValue placeholder="Change to…" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Submitted">Submitted</SelectItem>
                                  <SelectItem value="Hired">Hired</SelectItem>
                                  <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => updateApplication(a.application_id)}
                                disabled={!pending[a.application_id]}
                                className="border border-line-strong px-2.5 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] disabled:opacity-45"
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ---------------- apply card ---------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-hairline bg-raised p-5">
            <p className="t-overline">Annual salary</p>
            <p className="numeric mt-1 font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-none text-ink">
              {formatSalary(job.salary)}
            </p>

            <div className="mt-5 border-t border-hairline pt-5">
              {!isAuth ? (
                <>
                  <Link href="/login" className="btn-primary-sm w-full justify-center">
                    Sign in to apply
                  </Link>
                  <p className="t-body-sm mt-2">
                    Applying sends your profile and résumé.
                  </p>
                </>
              ) : isOwner ? (
                <p className="t-body-sm">
                  This is your posting. Applicants appear below the description.
                </p>
              ) : closed ? (
                <>
                  <p className="text-[15px] font-medium text-ink">
                    No longer accepting applications
                  </p>
                  <p className="t-body-sm mt-1">
                    Closed {postedLabel(job.created_at)}. The posting stays
                    readable so you can still see the terms.
                  </p>
                  <Link
                    href="/jobs"
                    className="mt-4 inline-block border border-line-strong px-4 py-2 text-[14px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
                  >
                    See open roles
                  </Link>
                </>
              ) : applied ? (
                <>
                  <p className="text-[15px] font-medium text-ink">
                    Application submitted
                  </p>
                  <p className="t-body-sm mt-1">
                    Sent {postedLabel(myApplication!.applied_at)} · status{" "}
                    {myApplication!.status}
                  </p>
                  <Link
                    href="/account"
                    className="mt-4 inline-block border border-line-strong px-4 py-2 text-[14px] font-medium text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
                  >
                    Track in My applications
                  </Link>
                </>
              ) : !user?.resume ? (
                <>
                  <p className="text-[15px] font-medium text-ink">
                    Add a résumé to apply
                  </p>
                  <p className="t-body-sm mt-1">
                    Every application sends a PDF. Upload one on your profile
                    first.
                  </p>
                  <Link href="/account" className="btn-primary-sm mt-4 w-full justify-center">
                    Upload a résumé
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => applyJob(job.job_id)}
                    disabled={btnLoading}
                    className="btn-primary-sm w-full justify-center disabled:opacity-45"
                  >
                    {btnLoading ? "Applying…" : "Apply with your JobQ profile"}
                  </button>
                  <p className="t-body-sm mt-2">
                    Sends your profile and the résumé on file.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* company aside */}
          <div className="mt-4 border border-hairline bg-raised p-5">
            <p className="t-overline">About {job.company_name}</p>
            <Link
              href={`/company/${job.company_id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[14px]"
            >
              View company <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
