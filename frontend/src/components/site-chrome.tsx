"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { useAppData } from "@/context/AppContext";

/**
 * Site-wide shell.
 *
 * One light theme on a single neutral ground — no background video, no
 * theme class. The landing page brings its own header; auth screens show
 * no nav at all so the form owns the viewport.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { backendOnline, recheckBackend } = useAppData();
  const [rechecking, setRechecking] = React.useState(false);
  const isLanding = pathname === "/";
  const isAuthPage =
    ["/login", "/register", "/forgot"].includes(pathname) ||
    pathname.startsWith("/reset");

  return (
    <div className="relative min-h-screen bg-ground text-ink">
      {/* First tab stop on every page. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:bg-raised focus-visible:px-4 focus-visible:py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel"
      >
        Skip to content
      </a>

      {!backendOnline && (
        // Bottom-fixed so it never fights the fixed header or the full-height
        // auth layouts.
        <div
          role="status"
          className="status-warn fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 flex-wrap items-center justify-between gap-3 border px-4 py-3 text-[14px] shadow-lg"
        >
          <span>JobQ is offline right now, so jobs and sign-in won&apos;t load.</span>
          <button
            onClick={async () => {
              setRechecking(true);
              await recheckBackend();
              setRechecking(false);
            }}
            disabled={rechecking}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50"
          >
            {rechecking ? "Checking…" : "Try again"}
          </button>
        </div>
      )}

      {isLanding || isAuthPage ? (
        <main id="main">{children}</main>
      ) : (
        <>
          <SiteHeader />
          <main id="main" className="pt-16">
            {children}
          </main>
        </>
      )}
    </div>
  );
}
