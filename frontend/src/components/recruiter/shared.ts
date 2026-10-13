import Cookies from "js-cookie";
import { Company, Job } from "@/type";

export const MAX_COMPANIES = 3;

export const ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-stack Engineer",
  "Mobile Engineer",
  "Data",
  "DevOps",
  "QA",
  "Designer",
  "Analyst",
  "Product",
  "Intern",
];
export const CITIES = ["Delhi", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Chennai", "Kolkata", "Remote"];
export const WORK_MODES: Job["work_location"][] = ["Remote", "Hybrid", "On-site"];
export const JOB_TYPES: Job["job_type"][] = ["Full-time", "Part-time", "Contract", "Internship"];

export const authHeaders = () => ({ headers: { Authorization: `Bearer ${Cookies.get("token")}` } });

/** A company as My companies lists it, with its counts. */
export type CompanyWithCounts = Company & {
  open_jobs: number;
  closed_jobs: number;
  in_queue: number;
  application_count: number;
};

/** Applicant counts for one job, from the owner-only stats endpoint. */
export type JobStats = { job_id: number; in_queue: number; hired: number; rejected: number; priority: number; total: number };

/** "https://www.kitepost.in/" → "kitepost.in" */
export const siteLabel = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

/** Same rule as the server: "kitepost.in" is fine, "kitepost" isn't. */
export function websiteError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Add the company's website.";
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes(".") ? null : "Add the full address, like kitepost.in";
  } catch {
    return "Add the full address, like kitepost.in";
  }
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
