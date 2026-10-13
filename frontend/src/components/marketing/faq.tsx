import React from "react";
import { Check, Minus, Plus } from "lucide-react";

/** Questions as native disclosure rows: ink rules between, plus/minus on the right. */
export function Faq({ items, firstOpen = true }: { items: { q: string; a: React.ReactNode }[]; firstOpen?: boolean }) {
  return (
    <div>
      {items.map(({ q, a }, i) => (
        <details key={q} open={firstOpen && i === 0} className="group border-t-2 border-ink py-1 last:border-b-2">
          <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-bold md:text-[19px] [&::-webkit-details-marker]:hidden">
            {q}
            <Plus className="size-[22px] flex-none group-open:hidden" strokeWidth={2.5} aria-hidden />
            <Minus className="hidden size-[22px] flex-none group-open:block" strokeWidth={2.5} aria-hidden />
          </summary>
          <p className="mb-[18px] max-w-[46em] text-ink-soft">{a}</p>
        </details>
      ))}
    </div>
  );
}

/** A ticked list item. */
export function Tick({ children, tone = "hired" }: { children: React.ReactNode; tone?: "hired" | "ink" }) {
  return (
    <li className="flex items-start gap-3">
      <Check className={tone === "hired" ? "mt-[3px] size-5 flex-none text-hired" : "mt-[3px] size-5 flex-none text-ink"} strokeWidth={3} aria-hidden />
      <span>{children}</span>
    </li>
  );
}
