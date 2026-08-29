"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

/**
 * Site-wide shell.
 *
 * One light theme on a single neutral ground — no background video, no
 * theme class. The landing page brings its own header; auth screens show
 * no nav at all so the form owns the viewport.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
