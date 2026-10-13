"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, ChevronsRight, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/jq/identity";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NavItem = { label: string; href: string; badge?: string };

export const MARKETING_PATHS = ["/", "/about", "/subscribe"];

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="JobQ home" className={cn("flex shrink-0 items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-black.png" alt="JobQ" className="h-9 w-auto md:h-10" />
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

/**
 * 72px header on a 2px ink rule. The current page gets a bordered tab, not
 * just a colour change. Under 768px it collapses to the logo, the account
 * (or Sign in), and a full-screen menu.
 */
export const SiteHeader = () => {
  const { isAuth, user, loading, logoutUser, applications } = useAppData();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const role = user?.role;
  // Marketing pages sit in the narrower 1240 container; app screens use 1360.
  const marketing = MARKETING_PATHS.includes(pathname);
  const priorityUntil =
    user?.subscription && new Date(user.subscription).getTime() > Date.now()
      ? new Date(user.subscription)
      : null;
  const inQueue = applications?.filter((a) => a.status === "Submitted").length ?? 0;

  const nav: NavItem[] = !isAuth
    ? [
        { label: "Jobs", href: "/jobs" },
        { label: "Pricing", href: "/subscribe" },
        { label: "About", href: "/about" },
      ]
    : role === "recruiter"
      ? [
          { label: "My companies", href: "/account" },
          { label: "Jobs", href: "/jobs" },
        ]
      : [
          { label: "Jobs", href: "/jobs" },
          { label: "My applications", href: "/account", badge: inQueue ? `${inQueue} in queue` : undefined },
          { label: "AI tools", href: "/account#ai-tools" },
        ];

  const avatar = (size: number) => (
    <span className="relative inline-flex">
      <Avatar
        name={user?.name}
        src={user?.profile_pic}
        size={size}
        className={role === "recruiter" ? "!bg-ink !text-paper" : undefined}
      />
      {priorityUntil && (
        <span
          aria-hidden
          className="absolute -right-1 -bottom-1 size-[18px] rounded-full border-2 border-ink bg-gold"
        />
      )}
    </span>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
        <div className={cn(marketing ? "container-marketing" : "container-app", "flex h-[60px] items-center gap-2 md:h-[72px] md:gap-6")}>
          <Logo />

          {/* --- desktop nav --- */}
          <nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-[10px] border-2 px-3.5 py-2 font-bold text-ink no-underline transition-colors",
                    active ? "border-ink bg-card" : "border-transparent hover:bg-paper-deep"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {!loading && !isAuth && (
              <>
                <Link
                  href="/login"
                  className="px-2 py-3 font-bold text-ink no-underline hover:text-red-deep md:px-3.5"
                >
                  Sign in
                </Link>
                <Link href="/register" className={cn(buttonVariants({ size: "md" }), "hidden md:inline-flex")}>
                  Create account
                </Link>
              </>
            )}

            {!loading && isAuth && role === "jobseeker" && (
              <div className="hidden md:block">
                {priorityUntil ? (
                  <span className="inline-flex items-center gap-2 rounded-[10px] border-2 border-dashed border-ink bg-gold-tint px-3 py-1.5 text-[15px] font-bold">
                    <span className="size-3 rounded-full border-2 border-ink bg-gold" aria-hidden />
                    Priority until{" "}
                    {priorityUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                ) : (
                  <Link
                    href="/subscribe"
                    className={cn(buttonVariants({ variant: "gold", size: "sm" }), "shadow-hard-sm")}
                  >
                    <ChevronsRight strokeWidth={2.5} />
                    Skip the line
                  </Link>
                )}
              </div>
            )}

            {!loading && isAuth && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Account menu for ${user?.name ?? "you"}`}
                  className="hidden rounded-full md:inline-flex"
                >
                  {avatar(46)}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={10} className="w-[250px] p-1.5">
                  <div className="px-3 py-2.5">
                    <b className="block truncate">{user?.name}</b>
                    <span className="t-help block truncate">{user?.email}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="text-ink no-underline">
                      <UserIcon strokeWidth={2.25} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirmSignOut(true)}>
                    <LogOut strokeWidth={2.25} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* --- mobile: account + menu button --- */}
            {!loading && isAuth && <span className="md:hidden">{avatar(40)}</span>}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid size-11 place-items-center rounded-[10px] border-2 border-ink bg-card md:hidden"
            >
              <Menu className="size-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* --- mobile full-screen menu --- */}
      <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-paper data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden">
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Site navigation</DialogPrimitive.Description>
            <div className="flex h-[60px] flex-none items-center gap-2 border-b-2 border-ink px-4">
              <span className="flex-1" onClick={() => setMenuOpen(false)}>
                <Logo />
              </span>
              <DialogPrimitive.Close
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-[10px] border-2 border-ink bg-card"
              >
                <X className="size-5" strokeWidth={2.75} />
              </DialogPrimitive.Close>
            </div>

            {isAuth && (
              <div className="flex items-center gap-3 border-b-2 border-ink px-5 py-4">
                {avatar(44)}
                <div className="min-w-0">
                  <b className="block truncate">{user?.name}</b>
                  <span className="t-help block truncate">{user?.email}</span>
                </div>
              </div>
            )}

            <nav aria-label="Main" className="flex flex-col overflow-y-auto px-5 py-2">
              {[...nav, ...(isAuth ? [{ label: "Profile", href: "/account" }] : [])]
                .filter((item, i, all) => all.findIndex((x) => x.label === item.label) === i)
                .map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="flex min-h-[60px] items-center justify-between gap-3 border-b-[1.5px] border-line px-1 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink no-underline"
                  >
                    {item.label}
                    {item.badge ? (
                      <span className="rounded-[10px] border-[1.5px] border-queue bg-queue-tint px-2 font-sans text-[14px] font-bold tracking-normal text-queue">
                        {item.badge}
                      </span>
                    ) : (
                      !isAuth && <ChevronRight className="size-[22px]" strokeWidth={2.5} aria-hidden />
                    )}
                  </Link>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 border-t-2 border-ink bg-paper-deep p-5">
              {!isAuth ? (
                <>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className={cn(buttonVariants(), "min-h-[54px] w-full")}>
                    Create account
                  </Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  {role === "jobseeker" && !priorityUntil && (
                    <Link
                      href="/subscribe"
                      onClick={() => setMenuOpen(false)}
                      className={cn(buttonVariants({ variant: "gold" }), "min-h-[54px] w-full")}
                    >
                      Skip the line · ₹119/month
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmSignOut(true);
                    }}
                    className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* --- sign-out confirmation --- */}
      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent>
          <AlertDialogTitle className="!text-[28px]">Sign out of JobQ?</AlertDialogTitle>
          <AlertDialogDescription>
            Your profile and tickets stay as they are. You&apos;ll need your email and password to sign back in.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className={buttonVariants({ variant: "secondary" })}>Stay signed in</AlertDialogCancel>
            <button
              className={buttonVariants({ variant: "ink" })}
              onClick={async () => {
                setConfirmSignOut(false);
                await logoutUser();
              }}
            >
              Sign out
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
