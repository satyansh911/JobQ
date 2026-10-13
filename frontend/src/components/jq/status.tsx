import React from "react";
import { Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COPY, type ApplicationStatus } from "@/lib/format";

export type ChipKind = "queue" | "hired" | "rejected" | "open" | "closed";

const KIND: Record<ChipKind, string> = {
  queue: "bg-queue-tint text-queue border-queue",
  hired: "bg-hired-tint text-hired border-hired",
  rejected: "bg-rejected-tint text-rejected border-rejected",
  open: "bg-hired-tint text-hired border-hired",
  closed: "bg-card text-ink border-ink border-dashed",
};

const ICON: Partial<Record<ChipKind, React.ReactNode>> = {
  queue: <Clock className="size-3.5" strokeWidth={2.75} aria-hidden />,
  hired: <Check className="size-3.5" strokeWidth={3} aria-hidden />,
  closed: <Lock className="size-3.5" strokeWidth={2.5} aria-hidden />,
};

/**
 * Status is never colour alone: each kind differs in wording, fill
 * lightness and (for queue, hired, closed) an icon.
 */
export function StatusChip({
  kind,
  children,
  className,
}: {
  kind: ChipKind;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border-[1.5px] px-[11px] py-[3px] text-[14px] font-bold leading-[1.3]",
        KIND[kind],
        className
      )}
    >
      {ICON[kind]}
      {children}
    </span>
  );
}

export function applicationKind(status: string): ChipKind {
  return status === "Hired" ? "hired" : status === "Rejected" ? "rejected" : "queue";
}

/**
 * An application's status chip. Recruiters get the plain word; seekers get
 * the counter wording ("In the queue").
 */
export function ApplicationChip({
  status,
  audience = "recruiter",
  className,
}: {
  status: ApplicationStatus | string;
  audience?: "recruiter" | "seeker";
  className?: string;
}) {
  const copy = STATUS_COPY[status as ApplicationStatus] ?? STATUS_COPY.Submitted;
  return (
    <StatusChip kind={applicationKind(status)} className={className}>
      {audience === "seeker" ? copy.seekerChip : copy.chip}
    </StatusChip>
  );
}

export function JobChip({ active, className }: { active: boolean; className?: string }) {
  return (
    <StatusChip kind={active ? "open" : "closed"} className={className}>
      {active ? "Open" : "Closed"}
    </StatusChip>
  );
}

/** Meta tag: city, work mode, job type. Plain outline, no colour. */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[10px] border-[1.5px] border-ink px-2.5 py-0.5 text-[14px]",
        className
      )}
    >
      {children}
    </span>
  );
}
