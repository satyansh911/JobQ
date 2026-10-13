"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MARKETING_PATHS } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { useAppData } from "@/context/AppContext";

/** One ink band for everyone. The last link follows who's signed in. */
export function SiteFooter() {
  const { isAuth, user } = useAppData();
  const marketing = MARKETING_PATHS.includes(usePathname());
  const last = !isAuth
    ? { label: "Sign in", href: "/login" }
    : user?.role === "recruiter"
      ? { label: "My companies", href: "/account" }
      : { label: "My applications", href: "/account" };

  return (
    <footer className="border-t-2 border-ink bg-ink text-[#E6DACB]">
      <div className={cn(marketing ? "container-marketing" : "container-app", "flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between")}>
        <Link href="/" aria-label="JobQ home" className="self-start md:self-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="JobQ" className="h-10 w-auto" />
        </Link>
        <nav aria-label="Footer" className="-mx-3 flex flex-wrap gap-1">
          {[
            { label: "Jobs", href: "/jobs" },
            { label: "Pricing", href: "/subscribe" },
            { label: "About", href: "/about" },
            last,
          ].map((l) => (
            <Link key={l.label} href={l.href} className="px-3 py-2.5 text-paper underline-offset-[3px] hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="text-[15px]">© {new Date().getFullYear()} JobQ</span>
      </div>
    </footer>
  );
}
