"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-marketing flex flex-col items-center gap-4 py-16 text-center md:py-24">
      <div className="my-6 grid size-[120px] place-items-center rounded-[10px] border-2 border-ink bg-error-tint shadow-hard-lg">
        <TriangleAlert className="size-14 text-red-deep" strokeWidth={2.25} aria-hidden />
      </div>
      <h1 className="t-h1 max-w-[14em]">Something went wrong on our side.</h1>
      <p className="max-w-[26em] text-[17px] text-ink-soft">
        It&apos;s not you. Try again, and if it keeps happening, come back a little later.
      </p>
      <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Button onClick={reset} className="w-full sm:w-auto">
          Try again
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "secondary" }), "w-full sm:w-auto")}>
          Go to home
        </Link>
      </div>
    </div>
  );
}
