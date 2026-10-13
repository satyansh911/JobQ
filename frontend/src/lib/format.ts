/**
 * Formatting shared by every screen: tokens, company initials, and how an
 * API status reads to the person looking at it.
 */
export { formatSalary } from "@/lib/utils";

/** Application id → ticket token. 142 → "Q-0142". */
export function ticketNumber(id: number | string): string {
  return `Q-${String(id).padStart(4, "0")}`;
}

// Words that make every company's initials look the same.
const NOISE = new Set(["private", "pvt", "pvt.", "limited", "ltd", "ltd.", "&", "and", "the"]);

/** "Fernpath Analytics Pvt Ltd" → "FA". */
export function companyInitials(name: string | null | undefined): string {
  const words = (name ?? "")
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w.toLowerCase()));
  const letters = words.slice(0, 2).map((w) => w[0]);
  return (letters.join("") || "?").toUpperCase();
}

/**
 * The six initials fills. Picked by a hash of the name, so a company keeps
 * the same colour on every screen without storing anything.
 */
const FILLS = [
  { bg: "#C03C48", fg: "#FFFFFF" },
  { bg: "#1F4E9E", fg: "#FFFFFF" },
  { bg: "#F4B63F", fg: "#1D1517" },
  { bg: "#DDF1E4", fg: "#17663F" },
  { bg: "#F3EADA", fg: "#1D1517" },
  { bg: "#1D1517", fg: "#FBF5EA" },
] as const;

export function initialsColour(name: string | null | undefined) {
  let h = 0;
  for (const ch of (name ?? "").toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FILLS[h % FILLS.length];
}

export type ApplicationStatus = "Submitted" | "Hired" | "Rejected";

/**
 * Recruiters see the plain word on a chip. Seekers see the counter wording
 * on their ticket and apply card. Red is never a status.
 */
export const STATUS_COPY: Record<
  ApplicationStatus,
  { chip: string; seekerChip: string; headline: string; stamp: string | null }
> = {
  Submitted: { chip: "In the queue", seekerChip: "In the queue", headline: "You're in the queue.", stamp: null },
  Hired: { chip: "Hired", seekerChip: "You're up!", headline: "You're up!", stamp: "You're up!" },
  Rejected: { chip: "Rejected", seekerChip: "Not this time", headline: "Not this time.", stamp: "Not this time" },
};

/** "3 days ago", "today", "2 months ago". */
export function postedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

/** "9 Oct", or "9 Oct 2025" when it isn't this year. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
