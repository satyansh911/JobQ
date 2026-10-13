"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/jq/feedback";
import { useAppData } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

/**
 * Site-wide shell: header, footer and toasts on every page. Auth screens
 * own the whole viewport, so they skip the header and footer.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { backendOnline, recheckBackend } = useAppData();
  const [rechecking, setRechecking] = React.useState(false);
  const isAuthPage =
    ["/login", "/register", "/forgot"].includes(pathname) || pathname.startsWith("/reset");

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-[10px] focus-visible:border-2 focus-visible:border-ink focus-visible:bg-card focus-visible:px-4 focus-visible:py-2"
      >
        Skip to content
      </a>

      {!isAuthPage && <SiteHeader />}
      <main id="main" className="flex-1">
        {children}
      </main>
      {!isAuthPage && <SiteFooter />}

      {!backendOnline && (
        // Pinned above the toasts so the two never overlap.
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 flex-wrap items-center gap-3 rounded-[10px] border-2 border-dashed border-ink bg-paper-deep px-4 py-3 text-[15px] shadow-hard"
        >
          <span className="min-w-[12rem] flex-1">
            <b>The counter&apos;s closed for a moment.</b> Jobs and sign-in will be back soon.
          </span>
          <Button
            variant="secondary"
            size="sm"
            loading={rechecking}
            onClick={async () => {
              setRechecking(true);
              await recheckBackend();
              setRechecking(false);
            }}
          >
            {rechecking ? "Checking" : "Try again"}
          </Button>
        </div>
      )}

      <Toaster />
    </div>
  );
}
