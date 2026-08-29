"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Sparkles, User as UserIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";

/**
 * Role-aware product header. A signed-out visitor sees the marketing nav;
 * each signed-in role sees only the destinations that exist for it.
 */
export const SiteHeader = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { isAuth, user, loading, logoutUser, applications } = useAppData();
  const pathname = usePathname();

  const role = user?.role;

  const nav: { label: string; href: string; count?: number }[] = !isAuth
    ? [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/subscribe" },
        { label: "About", href: "/about" },
      ]
    : role === "recruiter"
      ? [
          { label: "My companies", href: "/account" },
          { label: "Jobs", href: "/jobs" },
          { label: "About", href: "/about" },
        ]
      : [
          { label: "Jobs", href: "/jobs" },
          { label: "My applications", href: "/account", count: applications?.length },
          { label: "AI tools", href: "/#features" },
        ];

  const isSubscribed =
    !!user?.subscription && new Date(user.subscription).getTime() > Date.now();

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-hairline bg-raised">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-6 px-4 md:px-6">
        <Link href="/" aria-label="JobQ home" className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt="JobQ" className="h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active =
              item.href === pathname ||
              (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/account");
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-[family-name:var(--font-display)] font-semibold text-[15px] px-3 py-2 transition-colors",
                  active
                    ? "text-steel-700"
                    : "text-ink-2 hover:text-ink"
                )}
              >
                {item.label}
                {item.count ? (
                  <span className="numeric ml-1.5 inline-block bg-sunken px-1.5 text-[12px] text-ink-3">
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {!loading && isAuth && role === "jobseeker" && !isSubscribed && (
            <Link
              href="/subscribe"
              className="hidden sm:inline-flex items-center gap-1.5 border border-steel-200 bg-steel-100 px-3 py-1.5 text-[13px] font-medium text-steel-800 hover:bg-steel-200 transition-colors"
            >
              <Sparkles className="size-3.5" />
              Go priority · <span className="numeric">₹119</span>/mo
            </Link>
          )}

          {!loading &&
            (isAuth ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Account menu"
                    className="transition-opacity hover:opacity-80"
                  >
                    <Avatar className="size-8 rounded-full">
                      <AvatarImage src={(user?.profile_pic as string) || ""} alt="" />
                      <AvatarFallback className="bg-steel-100 text-[13px] font-semibold text-steel-800">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="end">
                  <div className="border-b border-hairline px-4 py-3">
                    <p className="truncate text-[15px] font-medium text-ink">{user?.name}</p>
                    <p className="truncate text-[13px] text-ink-3">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-3 py-2 text-[15px] text-ink-2 hover:bg-sunken"
                    >
                      <UserIcon className="size-4" /> Profile
                    </Link>
                    <button
                      onClick={logoutUser}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[15px] text-ink-2 hover:bg-sunken"
                    >
                      <LogOut className="size-4" /> Log out
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                href="/login"
                className="border border-primary bg-primary px-4 py-2 font-[family-name:var(--font-display)] text-[15px] font-semibold text-white transition-colors hover:bg-steel-800"
              >
                Sign in
              </Link>
            ))}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden p-1.5 text-ink-2"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-b border-hairline bg-raised px-4 pb-4">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-hairline py-3 font-[family-name:var(--font-display)] text-[15px] font-semibold text-ink-2 last:border-0"
            >
              {item.label}
              {item.count ? (
                <span className="numeric ml-1.5 bg-sunken px-1.5 text-[12px]">
                  {item.count}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
