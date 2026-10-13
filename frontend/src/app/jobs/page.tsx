"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Job } from "@/type";
import { job_service, useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { JobRow, JobRowSkeleton } from "@/components/job-row";
import { OfflineState, Skeleton } from "@/components/jq/feedback";
import { TooNarrow } from "@/components/jq/illustrations";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/* ------------------------------------------------------------------ *
 * Filter model
 * ------------------------------------------------------------------ */
type Posted = "day" | "week" | "month" | null;

type Facets = {
  work_location: string[];
  job_type: string[];
  location: string[];
  role: string | null;
  company: string | null;
  minSalary: number | null;
  multiOpening: boolean;
  posted: Posted;
};

const EMPTY: Facets = {
  work_location: [],
  job_type: [],
  location: [],
  role: null,
  company: null,
  minSalary: null,
  multiOpening: false,
  posted: null,
};

const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const SALARY_FLOORS = [300000, 600000, 1200000, 2000000];
const POSTED: { key: Exclude<Posted, null>; label: string; days: number }[] = [
  { key: "day", label: "Last 24 hours", days: 1 },
  { key: "week", label: "This week", days: 7 },
  { key: "month", label: "This month", days: 30 },
];
const PAGE = 20;

const lpa = (n: number) => `₹${n / 100000} LPA and up`;
const ageDays = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

type FacetKey = keyof Facets;

/** Does a job pass every filter (and the search), optionally ignoring one? */
function passes(job: Job, f: Facets, query: string, skip?: FacetKey | "query") {
  if (skip !== "work_location" && f.work_location.length && !f.work_location.includes(job.work_location)) return false;
  if (skip !== "job_type" && f.job_type.length && !f.job_type.includes(job.job_type)) return false;
  if (skip !== "location" && f.location.length && !f.location.includes(job.location ?? "")) return false;
  if (skip !== "role" && f.role && job.role !== f.role) return false;
  if (skip !== "company" && f.company && job.company_name !== f.company) return false;
  if (skip !== "minSalary" && f.minSalary && Number(job.salary || 0) < f.minSalary) return false;
  if (skip !== "multiOpening" && f.multiOpening && Number(job.openings) < 2) return false;
  if (skip !== "posted" && f.posted) {
    const w = POSTED.find((p) => p.key === f.posted)!;
    if (ageDays(job.created_at) > w.days) return false;
  }
  const q = query.trim().toLowerCase();
  if (skip !== "query" && q) {
    const hay = `${job.title} ${job.company_name} ${job.role} ${job.location} ${job.description ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** Every active filter as a removable chip, with what removing it does. */
function activeFilters(f: Facets, setF: React.Dispatch<React.SetStateAction<Facets>>) {
  const out: { id: string; label: string; key: FacetKey; remove: () => void; relax: Facets }[] = [];
  const add = (id: string, label: string, key: FacetKey, relax: Facets) =>
    out.push({ id, label, key, relax, remove: () => setF(relax) });
  for (const key of ["work_location", "job_type", "location"] as const)
    for (const v of f[key]) add(`${key}:${v}`, v, key, { ...f, [key]: f[key].filter((x) => x !== v) });
  if (f.role) add("role", f.role, "role", { ...f, role: null });
  if (f.company) add("company", f.company, "company", { ...f, company: null });
  if (f.minSalary) add("minSalary", lpa(f.minSalary), "minSalary", { ...f, minSalary: null });
  if (f.multiOpening) add("multiOpening", "2 or more openings", "multiOpening", { ...f, multiOpening: false });
  if (f.posted) add("posted", POSTED.find((p) => p.key === f.posted)!.label, "posted", { ...f, posted: null });
  return out;
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function JobsPage() {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <Listing />
    </Suspense>
  );
}

function Listing() {
  const { isAuth, loading: authLoading, applications } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Browsing needs an account; come back here, search intact, after signing in.
  useEffect(() => {
    if (!isAuth && !authLoading) {
      const here = pathname + (params.toString() ? `?${params}` : "");
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [isAuth, authLoading, router, pathname, params]);

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const [facets, setFacets] = useState<Facets>(() => ({
    ...EMPTY,
    location: params.get("city") ? [params.get("city")!] : [],
  }));
  const [sort, setSort] = useState<"newest" | "high" | "low">("newest");
  const [shown, setShown] = useState(PAGE);
  const [moreCities, setMoreCities] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${job_service}/api/job/all`);
      setJobs(data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuth) void load();
  }, [isAuth, load]);

  // A new filter set starts from the top of the list again.
  useEffect(() => setShown(PAGE), [facets, query, sort]);

  const applicationFor = useMemo(() => {
    const m = new Map<number, NonNullable<typeof applications>[number]>();
    for (const a of applications ?? []) m.set(a.job_id, a);
    return m;
  }, [applications]);

  const all = jobs ?? [];
  const results = useMemo(() => {
    const list = all.filter((j) => passes(j, facets, query));
    return list.sort((a, b) =>
      sort === "high"
        ? Number(b.salary || 0) - Number(a.salary || 0)
        : sort === "low"
          ? Number(a.salary || 0) - Number(b.salary || 0)
          : +new Date(b.created_at) - +new Date(a.created_at)
    );
  }, [all, facets, query, sort]);

  /** How many roles a value would show, given every other filter. */
  const count = (key: FacetKey, test: (j: Job) => boolean) =>
    all.filter((j) => passes(j, facets, query, key) && test(j)).length;

  const uniq = (vals: (string | null | undefined)[]) =>
    [...new Set(vals.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
  const cities = uniq(all.map((j) => j.location)).sort(
    (a, b) => count("location", (j) => j.location === b) - count("location", (j) => j.location === a)
  );
  const roles = uniq(all.map((j) => j.role));
  const companies = uniq(all.map((j) => j.company_name));

  const chips = activeFilters(facets, setFacets);
  const q = query.trim();
  const clearAll = () => {
    setFacets(EMPTY);
    setQuery("");
    setDraft("");
  };

  const toggle = (key: "work_location" | "job_type" | "location", v: string) =>
    setFacets((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));

  if (authLoading || !isAuth) return <ListingSkeleton />;

  const loading = jobs === null && !failed;
  const offline = failed;

  /* ---------------- filter controls, shared by rail and sheet ---------------- */
  const rail = (mode: "rail" | "sheet") => {
    const Opt = mode === "rail" ? RailOption : ChipOption;
    const groupCls = mode === "rail" ? "flex flex-col" : "flex flex-wrap gap-2";
    const n = (k: FacetKey, t: (j: Job) => boolean) => (offline ? undefined : count(k, t));
    const visibleCities = mode === "sheet" || moreCities ? cities : cities.slice(0, 4);
    return (
      <>
        <FilterGroup title="Work mode" mode={mode}>
          <div className={groupCls}>
            {WORK_MODES.map((v) => (
              <Opt key={v} label={v} count={n("work_location", (j) => j.work_location === v)}
                checked={facets.work_location.includes(v)} onChange={() => toggle("work_location", v)} />
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Job type" mode={mode}>
          <div className={groupCls}>
            {JOB_TYPES.map((v) => (
              <Opt key={v} label={v} count={n("job_type", (j) => j.job_type === v)}
                checked={facets.job_type.includes(v)} onChange={() => toggle("job_type", v)} />
            ))}
          </div>
        </FilterGroup>
        {cities.length > 0 && (
          <FilterGroup title="City" mode={mode}>
            <div className={groupCls}>
              {visibleCities.map((v) => (
                <Opt key={v} label={v} count={n("location", (j) => j.location === v)}
                  checked={facets.location.includes(v)} onChange={() => toggle("location", v)} />
              ))}
              {mode === "rail" && cities.length > 4 && (
                <button onClick={() => setMoreCities((m) => !m)}
                  className="min-h-10 self-start font-bold text-red-deep hover:underline">
                  {moreCities ? "Show fewer" : `Show ${cities.length - 4} more`}
                </button>
              )}
            </div>
          </FilterGroup>
        )}
        <div className={cn("flex flex-col gap-3", mode === "rail" ? "border-b-[1.5px] border-line px-[18px] py-3.5" : "px-4 py-3")}>
          {mode === "rail" && (
            <>
              <SelectField label="Role" value={facets.role ?? ""} onChange={(v) => setFacets((f) => ({ ...f, role: v || null }))}
                options={[["", "Any role"], ...roles.map((r) => [r, r] as [string, string])]} />
              <SelectField label="Company" value={facets.company ?? ""} onChange={(v) => setFacets((f) => ({ ...f, company: v || null }))}
                options={[["", "Any company"], ...companies.map((c) => [c, c] as [string, string])]} />
            </>
          )}
          <SelectField label="Minimum salary" value={String(facets.minSalary ?? "")} active={!!facets.minSalary}
            onChange={(v) => setFacets((f) => ({ ...f, minSalary: v ? Number(v) : null }))}
            options={[["", "Any"], ...SALARY_FLOORS.map((s) => [String(s), lpa(s)] as [string, string])]} />
          {mode === "rail" && (
            <RailOption label="2 or more openings" count={n("multiOpening", (j) => Number(j.openings) >= 2)}
              checked={facets.multiOpening} onChange={() => setFacets((f) => ({ ...f, multiOpening: !f.multiOpening }))} />
          )}
        </div>
        <FilterGroup title="Date posted" mode={mode} last>
          <div className={groupCls}>
            {POSTED.map((p) => (
              <Opt key={p.key} radio label={p.label} count={n("posted", (j) => ageDays(j.created_at) <= p.days)}
                checked={facets.posted === p.key} onChange={() => setFacets((f) => ({ ...f, posted: p.key }))} />
            ))}
            <Opt radio label="Any time" count={n("posted", () => true)}
              checked={!facets.posted} onChange={() => setFacets((f) => ({ ...f, posted: null }))} />
          </div>
        </FilterGroup>
      </>
    );
  };

  return (
    <>
      {/* ---------------- search band ---------------- */}
      <section className="border-b-2 border-ink bg-paper-deep">
        <div className="container-app flex flex-col gap-3 py-4 md:py-7">
          <h1 className="sr-only">Find jobs</h1>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(draft);
            }}
            className="flex flex-wrap overflow-hidden rounded-[10px] border-2 border-ink bg-card md:shadow-hard"
          >
            <label className="flex min-h-[52px] basis-full items-center gap-2.5 px-4 md:min-h-14 md:flex-[3_1_320px] md:px-[18px]">
              <Search className="size-5 flex-none text-ink-muted" strokeWidth={2.25} aria-hidden />
              <span className="sr-only">Search jobs</span>
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (!e.target.value) setQuery("");
                }}
                placeholder="Job title, skill or company"
                className="w-full bg-transparent text-[17px] text-ink placeholder:text-ink-muted"
              />
            </label>
            <label className="hidden min-h-14 flex-[1_1_200px] items-center gap-2 border-l-2 border-ink px-[18px] md:flex">
              <MapPin className="size-[18px] flex-none text-ink-muted" strokeWidth={2.25} aria-hidden />
              <span className="sr-only">City</span>
              <select
                value={facets.location.length === 1 ? facets.location[0] : ""}
                onChange={(e) => setFacets((f) => ({ ...f, location: e.target.value ? [e.target.value] : [] }))}
                className="w-full bg-transparent text-[17px] text-ink"
              >
                <option value="">Any city</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="hidden min-h-14 border-l-2 border-ink bg-red px-8 text-[17px] font-bold text-white hover:bg-red-deep md:block">
              Search
            </button>
          </form>

          {/* phones: filters button and sort share a row under the search */}
          <div className="flex gap-3 md:hidden">
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] border-2 border-ink bg-ink font-bold text-paper"
            >
              <SlidersHorizontal className="size-[18px]" strokeWidth={2.5} aria-hidden />
              Filters
              {chips.length > 0 && (
                <span className="grid size-[22px] place-items-center rounded-full bg-gold text-[13px] text-ink">{chips.length}</span>
              )}
            </button>
            <SortSelect value={sort} onChange={setSort} className="flex-1" />
          </div>
        </div>
      </section>

      <div className="container-app flex items-start gap-8 pt-5 pb-16 md:pt-7">
        {/* ---------------- filter rail (desktop) ---------------- */}
        <aside aria-label="Filters" className="hidden w-[300px] flex-none overflow-hidden rounded-[10px] border-2 border-ink bg-card lg:block">
          <div className="flex items-center justify-between border-b-2 border-ink px-[18px] py-3.5">
            <h2 className="font-display text-[20px] font-extrabold">Filters</h2>
            {chips.length > 0 && (
              <button onClick={() => setFacets(EMPTY)} className="min-h-11 px-1 font-bold text-red-deep underline">
                Clear all
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex flex-col gap-3 p-[18px]" aria-hidden>
              {[60, 80, 70, 75, 0, 55, 85, 65].map((w, i) =>
                w ? <Skeleton key={i} className="h-3.5" style={{ width: `${w}%` }} /> : <div key={i} className="h-3" />
              )}
            </div>
          ) : (
            <>
              {rail("rail")}
              {offline && <p className="t-help px-[18px] pb-4">Counts come back when we reconnect.</p>}
            </>
          )}
        </aside>

        {/* ---------------- results ---------------- */}
        <section aria-label="Results" className="flex min-w-0 flex-1 flex-col gap-4">
          {loading ? (
            <>
              <Skeleton className="h-7 w-48" />
              <ul className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => <JobRowSkeleton key={i} />)}
              </ul>
            </>
          ) : offline ? (
            <div className="rounded-[10px] border-2 border-ink bg-paper-deep">
              <OfflineState onRetry={load} variant="full" className="!py-10" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[17px]" aria-live="polite">
                  <b className="font-display text-[24px] font-extrabold">
                    {results.length} {results.length === 1 ? "role" : "roles"}
                  </b>
                  {q && <> for “{q}”</>}
                </p>
                <label className="hidden items-center gap-2.5 font-bold md:flex">
                  Sort by
                  <SortSelect value={sort} onChange={setSort} />
                </label>
              </div>

              {(chips.length > 0 || q) && (
                <div className="flex flex-wrap items-center gap-2">
                  {q && <FilterChip label={`“${q}”`} onRemove={() => { setQuery(""); setDraft(""); }} />}
                  {chips.map((c) => <FilterChip key={c.id} label={c.label} onRemove={c.remove} />)}
                  <button onClick={clearAll} className="min-h-9 font-bold text-red-deep underline">
                    Clear all
                  </button>
                </div>
              )}

              {results.length === 0 ? (
                all.length === 0 ? (
                  <NothingOpen />
                ) : (
                  <NoMatches
                    options={[
                      ...(q ? [{ id: "q", label: `“${q}”`, n: all.filter((j) => passes(j, facets, query, "query")).length, remove: () => { setQuery(""); setDraft(""); } }] : []),
                      ...chips.map((c) => ({ id: c.id, label: c.label, n: all.filter((j) => passes(j, c.relax, query)).length, remove: c.remove })),
                    ]}
                    onClearAll={clearAll}
                  />
                )
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {results.slice(0, shown).map((job) => (
                      <JobRow key={job.job_id} job={job} application={applicationFor.get(job.job_id)} />
                    ))}
                  </ul>
                  {results.length > shown && (
                    <div className="flex justify-center pt-3">
                      <Button variant="secondary" className="shadow-hard-sm" onClick={() => setShown((s) => s + PAGE)}>
                        Show {Math.min(PAGE, results.length - shown)} more roles
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* ---------------- filters sheet (phones) ---------------- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          title="Filters"
          className="lg:hidden"
          headerAction={
            chips.length > 0 && (
              <button onClick={() => setFacets(EMPTY)} className="min-h-11 px-2 font-bold text-red-deep underline">
                Clear all
              </button>
            )
          }
        >
          <div className="border-t-2 border-ink pb-4">{!loading && rail("sheet")}</div>
          <div className="sticky bottom-0 border-t-2 border-ink bg-paper p-4">
            <Button className="min-h-[54px] w-full" onClick={() => setSheetOpen(false)}>
              Apply filters · {results.length} {results.length === 1 ? "role" : "roles"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */
function ListingSkeleton() {
  return (
    <div className="container-app flex flex-col gap-3 py-8" aria-label="Loading roles" role="status">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[96px] rounded-[10px]" />)}
    </div>
  );
}

function FilterGroup({ title, mode, last, children }: { title: string; mode: "rail" | "sheet"; last?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className={cn(mode === "rail" ? "px-[18px] py-3.5" : "px-4 py-3", mode === "rail" && !last && "border-b-[1.5px] border-line")}>
      <legend className="float-left mb-1 w-full font-bold">{title}</legend>
      <div className="clear-both pt-1">{children}</div>
    </fieldset>
  );
}

type OptionProps = { label: string; count?: number; checked: boolean; onChange: () => void; radio?: boolean };

/** Rail row: checkbox or radio, label, live count. Zero-count options dim but stay usable when on. */
function RailOption({ label, count, checked, onChange, radio }: OptionProps) {
  const dead = count === 0 && !checked;
  return (
    <label className={cn("flex min-h-10 cursor-pointer items-center gap-2.5", dead && "cursor-default opacity-50")}>
      <input type={radio ? "radio" : "checkbox"} checked={checked} onChange={onChange} disabled={dead} />
      <span className="flex-1">{label}</span>
      <span className="text-ink-muted tabular-nums">{count === undefined ? "·" : count}</span>
    </label>
  );
}

/** Sheet option: a toggle chip with its count. */
function ChipOption({ label, count, checked, onChange }: OptionProps) {
  const dead = count === 0 && !checked;
  return (
    <button
      type="button"
      role={undefined}
      aria-pressed={checked}
      onClick={onChange}
      disabled={dead}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border-2 border-ink px-3.5 font-bold",
        checked ? "bg-ink text-paper" : "bg-card text-ink",
        dead && "opacity-50"
      )}
    >
      {label}
      {count !== undefined && <span className={cn("font-normal tabular-nums", checked ? "text-paper/80" : "text-ink-muted")}>{count}</span>}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  active,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  active?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 font-bold">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("min-h-11 rounded-[10px] border-2 bg-card px-3 font-normal text-ink", active ? "border-red" : "border-ink")}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortSelect({
  value,
  onChange,
  className,
}: {
  value: "newest" | "high" | "low";
  onChange: (v: "newest" | "high" | "low") => void;
  className?: string;
}) {
  return (
    <select
      aria-label="Sort by"
      value={value}
      onChange={(e) => onChange(e.target.value as "newest" | "high" | "low")}
      className={cn("min-h-11 rounded-[10px] border-2 border-ink bg-card px-3 font-bold text-ink md:min-w-[180px] md:font-normal", className)}
    >
      <option value="newest">Newest</option>
      <option value="high">Salary: high to low</option>
      <option value="low">Salary: low to high</option>
    </select>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="inline-flex min-h-9 items-center gap-2 rounded-[10px] bg-ink pr-2 pl-3 font-bold text-paper"
    >
      {label}
      <X className="size-4" strokeWidth={2.75} aria-hidden />
    </button>
  );
}

/** Names each filter to loosen, with the number of roles it would bring back. */
function NoMatches({
  options,
  onClearAll,
}: {
  options: { id: string; label: string; n: number; remove: () => void }[];
  onClearAll: () => void;
}) {
  const useful = options.filter((o) => o.n > 0).sort((a, b) => b.n - a.n);
  const many = options.length;
  return (
    <div className="grid items-center gap-6 rounded-[10px] border-2 border-ink bg-card p-6 md:grid-cols-[minmax(0,240px)_1fr] md:gap-10 md:p-10">
      <TooNarrow label="" className="mx-auto w-[200px] md:w-full" />
      <div className="flex flex-col gap-3">
        <h2 className="t-h2">
          {many === 1 ? "No roles match this filter." : many === 2 ? "No roles match both filters." : many === 3 ? "No roles match all three filters." : "No roles match these filters."}
        </h2>
        {useful.length > 0 ? (
          <>
            <p className="text-ink-soft">Loosen one of these to see more:</p>
            <ul className="flex max-w-[460px] flex-col gap-2">
              {useful.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={o.remove}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[10px] border-2 border-ink bg-card px-4 text-left hover:bg-paper-deep"
                  >
                    <span>
                      Remove <b>{o.label}</b>
                    </span>
                    <span className="font-bold whitespace-nowrap text-red-deep">
                      Show {o.n} {o.n === 1 ? "role" : "roles"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-ink-soft">No single change brings anything back. Clearing them all will.</p>
        )}
        <button onClick={onClearAll} className="mt-1 min-h-11 self-start font-bold underline">
          Clear all filters
        </button>
      </div>
    </div>
  );
}

function NothingOpen() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-ink bg-card px-6 py-12 text-center">
      <h2 className="t-h2">Nobody&apos;s hiring just this minute.</h2>
      <p className="max-w-[30em] text-ink-soft">New roles go up most weeks. Check back soon.</p>
    </div>
  );
}
