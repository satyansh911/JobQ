import Link from "next/link";
import { LostTicket } from "@/components/jq/illustrations";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container-marketing flex flex-col items-center gap-4 py-16 text-center md:py-24">
      <LostTicket label="" className="w-[260px] md:w-[280px]" />
      <h1 className="t-h1 max-w-[14em]">This ticket isn&apos;t in our queue.</h1>
      <p className="max-w-[26em] text-[17px] text-ink-soft">
        The link might be old, or the job was taken down by the company that posted it.
      </p>
      <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link href="/jobs" className={cn(buttonVariants(), "w-full sm:w-auto")}>
          Browse jobs
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "secondary" }), "w-full sm:w-auto")}>
          Go to home
        </Link>
      </div>
    </div>
  );
}
