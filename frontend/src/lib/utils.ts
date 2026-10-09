import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an annual salary the way Indian job boards do: whole rupees with
 * lakh/crore grouping, plus an "LPA" shorthand once it reaches a lakh.
 * Accepts the NUMERIC string Postgres returns (e.g. "3200000.00").
 */
export function formatSalary(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return "Not disclosed";

  if (n >= 100000) {
    const lakhs = n / 100000;
    const trimmed = Number.isInteger(lakhs) ? lakhs.toString() : lakhs.toFixed(1);
    return `₹${trimmed} LPA`;
  }
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;
}

/**
 * Turn a failed API call into a message a person can act on.
 *
 * The backend is stopped between demos to save cost, and while it is, the
 * frontend's proxy answers with a 502/504 whose body carries no `message`.
 * Reading `error.response.data.message` directly would show an empty toast —
 * or throw outright when there is no response at all — so name that case
 * explicitly instead.
 */
export function apiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const err = error as { response?: { status?: number; data?: { message?: unknown } } };
  const status = err?.response?.status;

  if (!err?.response || status === 502 || status === 503 || status === 504) {
    return "JobQ is offline right now. Please try again in a few minutes.";
  }

  const message = err.response.data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}
