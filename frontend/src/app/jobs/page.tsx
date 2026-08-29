"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { formatSalary, cn } from "@/lib/utils";
import { JobRow, JobRowSkeleton } from "@/components/job-row";

type Facets = {
  work_location: string[];
  job_type: string[];
  location: string[];
  role: string[];
  company: string[];
  openings: string | null;
  posted: string | null;
};

const EMPTY: Facets = {
  work_location: [],
  job_type: [],
  location: [],
  role: [],
  company: [],
  openings: null,
  posted: null,
};

const POSTED_WINDOWS: Record<string, number> = {
  "Past week": 7,
  "Past month": 30,
};

const daysAgo = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

export default function JobsPage() {
  const { isAuth, loading: authLoading, applications } = useAppData();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "salary">("newest");
  const [facets, setFacets] = useState<Facets>(EMPTY);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    if (!isAuth && !authLoading) router.push("/login");
  }, [isAuth, authLoading, router]);

  useEffect(() => {
    if (!isAuth) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${job_service}/api/job/all`, {
          headers: { Authorization: `Bearer ${Cookies.get("token")}` },
        });
        setJobs(data);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuth]);

  const appliedJobIds = useMemo(
    () => new Set((applications || []).map((a) => a.job_id)),
    [applications]
  );

  /* Filtering runs on the client: with this dataset it is instant, and the
     rail needs counts over the whole set anyway. The list swaps without
     animation so the eye keeps its place. */
  const toggle = (key: keyof Omit<Facets, "openings" | "posted">, value: string) =>
    setFacets((f) => {
      const list = f[key];
      return {
        ...f,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });

  const matches = (job: Job, skip?: keyof Facets) => {
    const f = facets;
    if (skip !== "work_location" && f.work_location.length && !f.work_location.includes(job.work_location)) return false;
    if (skip !== "job_type" && f.job_type.length && !f.job_type.includes(job.job_type)) return false;
    if (skip !== "location" && f.location.length && !f.location.includes(job.location || "")) return false;
    if (skip !== "role" && f.role.length && !f.role.includes(job.role)) return false;
    if (skip !== "company" && f.company.length && !f.company.includes(job.company_name)) return false;
    if (skip !== "openings" && f.openings) {
      const min = Number(f.openings.replace("+", ""));
      if (Number(job.openings) < min) return false;
    }
    if (skip !== "posted" && f.posted) {
      if (daysAgo(job.created_at) > POSTED_WINDOWS[f.posted]) return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = `${job.title} ${job.company_name} ${job.role} ${job.location}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const results = useMemo(() => {
    const list = jobs.filter((j) => matches(j));
    return [...list].sort((a, b) =>
      sort === "salary"
        ? Number(b.salary || 0) - Number(a.salary || 0)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, facets, query, sort]);

  /** Count for a facet value, computed as if that facet weren't applied. */
  const countFor = (key: keyof Facets, value: string) =>
    jobs.filter((j) => {
      if (!matches(j, key)) return false;
      if (key === "work_location") return j.work_location === value;
      if (key === "job_type") return j.job_type === value;
      if (key === "location") return j.location === value;
      if (key === "role") return j.role === value;
      if (key === "company") return j.company_name === value;
      return false;
    }).length;

  const uniq = (vals: (string | null)[]) =>
    [...new Set(vals.filter(Boolean) as string[])].sort();

  const activeCount =
    facets.work_location.length +
    facets.job_type.length +
    facets.location.length +
    facets.role.length +
    facets.company.length +
    (facets.openings ? 1 : 0) +
    (facets.posted ? 1 : 0);

  /* When nothing matches, name the filter that is doing the blocking — a
     dead end is a design failure, not a data state. */
  const blockingFilter = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (results.length || (!activeCount && !q)) return null;

    /** Count matches under a given facet set + query. */
    const countUnder = (f: Facets, search: string) =>
      jobs.filter((j) => {
        if (f.work_location.length && !f.work_location.includes(j.work_location)) return false;
        if (f.job_type.length && !f.job_type.includes(j.job_type)) return false;
        if (f.location.length && !f.location.includes(j.location || "")) return false;
        if (f.role.length && !f.role.includes(j.role)) return false;
        if (f.company.length && !f.company.includes(j.company_name)) return false;
        if (f.openings && Number(j.openings) < Number(f.openings.replace("+", ""))) return false;
        if (f.posted && daysAgo(j.created_at) > POSTED_WINDOWS[f.posted]) return false;
        if (search) {
          const hay = `${j.title} ${j.company_name} ${j.role} ${j.location}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      }).length;

    // The search box is a filter too — and usually the real blocker. Test it
    // first so we never tell someone to drop a facet that wouldn't help.
    if (q) {
      const n = countUnder(facets, "");
      if (n > 0) return { key: "search" as const, label: `“${query.trim()}”`, n };
    }

    const keys: (keyof Facets)[] = ["work_location", "job_type", "location", "role", "company", "openings", "posted"];
    for (const key of keys) {
      const relaxed = { ...facets, [key]: Array.isArray(facets[key]) ? [] : null } as Facets;
      const n = countUnder(relaxed, q);
      if (n > 0) {
        const label = Array.isArray(facets[key])
          ? (facets[key] as string[]).join(", ")
          : String(facets[key]);
        return { key, label, n };
      }
    }
    return null;
  }, [results.length, activeCount, facets, jobs, query]);

  if (authLoading || !isAuth) return null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <h1 className="t-h1">Open roles</h1>
        <p className="t-body-sm mt-1">
          Every posting on JobQ, newest first. Filters apply as you set them.
        </p>
      </header>

      {/* search band */}
      <div className="mb-6 flex gap-2 border border-hairline bg-raised p-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company or role"
            aria-label="Search roles"
            className="h-10 w-full border border-line-strong bg-sunken pl-9 pr-3 text-[15px] placeholder:text-ink-4 focus-visible:border-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/40"
          />
        </div>
        <button
          onClick={() => setRailOpen((v) => !v)}
          className="inline-flex items-center gap-2 border border-line-strong px-4 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && <span className="numeric">{activeCount}</span>}
        </button>
      </div>

      <div className="flex gap-6">
        {/* ---------------- filter rail ---------------- */}
        <aside
          className={cn(
            "w-[240px] shrink-0 lg:block",
            railOpen ? "block" : "hidden"
          )}
        >
          <div className="sticky top-24 border border-hairline bg-raised">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="t-overline">Filters</span>
              {activeCount > 0 && (
                <button
                  onClick={() => setFacets(EMPTY)}
                  className="text-[13px] text-steel-700 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
              <FacetGroup label="Work location">
                {["Remote", "Hybrid", "On-site"].map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    count={countFor("work_location", v)}
                    checked={facets.work_location.includes(v)}
                    onChange={() => toggle("work_location", v)}
                  />
                ))}
              </FacetGroup>

              <FacetGroup label="Job type">
                {["Full-time", "Part-time", "Contract", "Internship"].map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    count={countFor("job_type", v)}
                    checked={facets.job_type.includes(v)}
                    onChange={() => toggle("job_type", v)}
                  />
                ))}
              </FacetGroup>

              <FacetGroup label="Location">
                {uniq(jobs.map((j) => j.location)).map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    count={countFor("location", v)}
                    checked={facets.location.includes(v)}
                    onChange={() => toggle("location", v)}
                  />
                ))}
              </FacetGroup>

              <FacetGroup label="Role">
                {uniq(jobs.map((j) => j.role)).map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    count={countFor("role", v)}
                    checked={facets.role.includes(v)}
                    onChange={() => toggle("role", v)}
                  />
                ))}
              </FacetGroup>

              <FacetGroup label="Company">
                {uniq(jobs.map((j) => j.company_name)).map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    count={countFor("company", v)}
                    checked={facets.company.includes(v)}
                    onChange={() => toggle("company", v)}
                  />
                ))}
              </FacetGroup>

              <FacetGroup label="Openings">
                {["2+", "3+"].map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    radio
                    checked={facets.openings === v}
                    onChange={() =>
                      setFacets((f) => ({ ...f, openings: f.openings === v ? null : v }))
                    }
                  />
                ))}
              </FacetGroup>

              <FacetGroup label="Posted" last>
                {Object.keys(POSTED_WINDOWS).map((v) => (
                  <FacetRow
                    key={v}
                    label={v}
                    radio
                    checked={facets.posted === v}
                    onChange={() =>
                      setFacets((f) => ({ ...f, posted: f.posted === v ? null : v }))
                    }
                  />
                ))}
              </FacetGroup>
            </div>
          </div>
        </aside>

        {/* ---------------- results ---------------- */}
        <section className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="t-body-sm">
              {loading ? (
                "Loading roles…"
              ) : (
                <>
                  <span className="numeric font-medium text-ink">{results.length}</span>{" "}
                  {results.length === 1 ? "role" : "roles"}
                  {activeCount > 0 && <> match your filters</>} ·{" "}
                  <span className="numeric">{jobs.length}</span> open in total
                </>
              )}
            </p>

            <label className="ml-auto flex items-center gap-2 text-[13px] text-ink-3">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "newest" | "salary")}
                className="h-8 border border-line-strong bg-sunken px-2 text-[13px] text-ink-2 focus-visible:border-steel focus-visible:outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="salary">Highest salary</option>
              </select>
            </label>
          </div>

          {/* active filter chips */}
          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(["work_location", "job_type", "location", "role", "company"] as const).flatMap(
                (key) =>
                  facets[key].map((v) => (
                    <Chip key={key + v} label={v} onRemove={() => toggle(key, v)} />
                  ))
              )}
              {facets.openings && (
                <Chip
                  label={`${facets.openings} openings`}
                  onRemove={() => setFacets((f) => ({ ...f, openings: null }))}
                />
              )}
              {facets.posted && (
                <Chip
                  label={facets.posted}
                  onRemove={() => setFacets((f) => ({ ...f, posted: null }))}
                />
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <JobRowSkeleton />
              <JobRowSkeleton />
              <JobRowSkeleton />
            </div>
          ) : results.length === 0 ? (
            <div className="border border-hairline bg-raised px-6 py-12 text-center">
              <h2 className="t-h3">
                {jobs.length === 0 ? "No roles are open yet" : "No roles match these filters"}
              </h2>
              <p className="t-body-sm mx-auto mt-2 max-w-md">
                {jobs.length === 0 ? (
                  "JobQ is early — new postings land most weeks."
                ) : blockingFilter ? (
                  <>
                    <span className="numeric">{jobs.length}</span> roles are open right now.
                    Dropping <span className="font-medium text-ink">{blockingFilter.label}</span>{" "}
                    brings back <span className="numeric">{blockingFilter.n}</span> of them.
                  </>
                ) : (
                  <>
                    <span className="numeric">{jobs.length}</span> roles are open right now.
                  </>
                )}
              </p>
              {(activeCount > 0 || query.trim()) && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      setFacets(EMPTY);
                      setQuery("");
                    }}
                    className="border border-primary bg-primary px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white hover:bg-steel-800"
                  >
                    Clear all filters
                  </button>
                  {blockingFilter && (
                    <button
                      onClick={() => {
                        if (blockingFilter.key === "search") {
                          setQuery("");
                          return;
                        }
                        setFacets((f) => ({
                          ...f,
                          [blockingFilter.key]: Array.isArray(
                            f[blockingFilter.key as keyof Facets]
                          )
                            ? []
                            : null,
                        }));
                      }}
                      className="border border-line-strong px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
                    >
                      {blockingFilter.key === "search" ? "Clear search" : `Drop ${blockingFilter.label}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((job) => (
                <JobRow
                  key={job.job_id}
                  job={job}
                  applied={appliedJobIds.has(job.job_id)}
                />
              ))}

              {/* Sparse is the real launch state: rather than leave a grid
                  half-empty, offer the alert. */}
              {results.length <= 2 && jobs.length > 0 && (
                <div className="border border-hairline bg-raised px-6 py-8 text-center">
                  <p className="t-body-sm mx-auto max-w-md">
                    JobQ is early — new postings land most weeks. We&apos;ll email you
                    when another matching role opens.
                  </p>
                  <Link
                    href="/account"
                    className="mt-4 inline-block border border-line-strong px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]"
                  >
                    Alert me
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FacetGroup({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("px-4 py-3", !last && "border-b border-hairline")}>
      <p className="t-overline mb-2">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FacetRow({
  label,
  count,
  checked,
  onChange,
  radio,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  radio?: boolean;
}) {
  const disabled = count === 0 && !checked;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 text-[14px]",
        disabled && "cursor-default opacity-45"
      )}
    >
      <input
        type={radio ? "radio" : "checkbox"}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-3.5 accent-steel-700"
      />
      <span className={cn("flex-1 truncate", checked ? "text-ink" : "text-ink-2")}>
        {label}
      </span>
      {count !== undefined && (
        <span className="numeric text-[12px] text-ink-3">{count}</span>
      )}
    </label>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border border-steel-200 bg-steel-100 py-1 pl-2 pr-1 text-[13px] text-steel-800">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="p-0.5 hover:bg-steel-200"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
