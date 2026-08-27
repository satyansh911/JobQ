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
