"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { HeroHeader } from "@/components/ui/hero-section-1";

export const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4";

/**
 * Site-wide shell. Every route gets the same cinematic backdrop — fixed
 * background video, scrim, and the vertical container guide lines — so the
 * inner pages read as the same product as the landing page.
 *
 * The landing page ("/") ships its own navbar and full-bleed treatment, so the
 * global header is suppressed there. Every other route keeps the fixed header
 * plus the top padding that clears it.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  // Auth screens centre themselves in the viewport, so they opt out of the
  // header's top padding and never scroll the page.
  const isAuthPage =
    ["/login", "/register", "/forgot"].includes(pathname) ||
    pathname.startsWith("/reset");

  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      {/* Fixed background video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          src={VIDEO_SRC}
        />
        {/* Scrim — the footage is bright through the middle; without this the
            copy loses contrast against it. Inner pages are denser than the
            landing hero, so they get a heavier scrim. */}
        <div
          className={
            isLanding ? "absolute inset-0 bg-[#0c0c0c]/65" : "absolute inset-0 bg-[#0c0c0c]/85"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/70 via-transparent to-[#0c0c0c]/90" />
      </div>

      {/* Vertical guide lines at the container edges */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {isLanding ? (
        // The landing page brings its own navbar and stacks its own sections.
        children
      ) : isAuthPage ? (
        // Auth screens show no nav at all so the form owns the viewport, but
        // they still need `relative z-10` — without it the content paints
        // *under* the fixed background video/scrim above.
        <div className="relative z-10">{children}</div>
      ) : (
        <>
          <HeroHeader />
          <div className="relative z-10 pt-24">{children}</div>
        </>
      )}
    </div>
  );
}
