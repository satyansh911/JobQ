"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Archive,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Menu,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Logo, LogoMark, PrimaryButton, SectionEyebrow, gradientStyle } from "./primitives";
import CareerGuide from "@/components/career-guide";
import ResumeAnalyzer from "@/components/resume-analyser";

/* ================================================================== *
 * 1 — Navbar
 * ================================================================== */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/subscribe" },
  { label: "About", href: "/about" },
];

const Navbar = () => (
  <motion.nav
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="relative z-20 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"
  >
    <Link href="/" aria-label="JobQ home" className="text-white">
      <Logo />
    </Link>

    <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex gap-8">
      {NAV_LINKS.map(({ label, href }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
        >
          <Link
            href={href}
            className="text-white/70 text-sm font-medium hover:text-white transition-colors"
          >
            {label}
          </Link>
        </motion.div>
      ))}
    </div>

    <div className="hidden md:block">
      <PrimaryButton />
    </div>

    <button
      aria-label="Open menu"
      className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white"
    >
      <Menu className="w-4 h-4" />
    </button>
  </motion.nav>
);

/* ================================================================== *
 * 2 — Hero
 * ================================================================== */
const Hero = () => (
  <section className="relative z-10 pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
    >
      <span className="block text-white">Your next job.</span>
      <span className="block animate-shiny" style={gradientStyle}>
        In the queue.
      </span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
    >
      JobQ is the hiring platform for both sides of the table. It reads every
      posting and every résumé, then surfaces the matches that actually fit —
      so you spend your time interviewing, not scrolling.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 flex flex-col items-center gap-3"
    >
      <PrimaryButton />
      <span className="text-xs text-white/40">
        Free to join · No credit card required
      </span>
    </motion.div>
  </section>
);

/* ================================================================== *
 * 3 — App menu bar strip
 * ================================================================== */
const MENU_ITEMS = ["Jobs", "Applications", "Companies", "Saved", "Alerts", "Help"];

const MenuBar = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6, delay: 0.9 }}
    className="relative z-10 h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
  >
    <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <LogoMark className="w-3.5 h-3.5" />
        <span className="font-bold text-white">JobQ</span>
        {MENU_ITEMS.map((item, i) => (
          <span
            key={item}
            className={`text-white/60 ${i > 2 ? "hidden sm:inline" : ""} ${
              i > 3 ? "hidden md:inline" : ""
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-white/60">
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Wed May 6 1:09 PM</span>
      </div>
    </div>
  </motion.div>
);

/* ================================================================== *
 * 4 — Dashboard mockup
 * ================================================================== */
const SIDEBAR_NAV = [
  { icon: Briefcase, label: "All Jobs", count: 128, active: true },
  { icon: Bookmark, label: "Saved", count: 7 },
  { icon: Send, label: "Applied", count: 12 },
  { icon: CalendarDays, label: "Interviews", count: 3 },
  { icon: BadgeCheck, label: "Offers" },
  { icon: Archive, label: "Archived" },
];

const CATEGORIES = [
  { name: "Engineering", color: "#00d2ff" },
  { name: "Design", color: "#A4F4FD" },
  { name: "Product", color: "#f59e0b" },
  { name: "Data", color: "#10b981" },
];

const JOB_LIST = [
  {
    company: "Northwind",
    title: "Senior Frontend Engineer",
    preview: "Remote · ₹28–36 LPA · React, TypeScript, Next.js",
    time: "9:41 AM",
    unread: true,
    active: true,
  },
  {
    company: "Cobalt Systems",
    title: "Product Designer",
    preview: "Bengaluru · ₹18–24 LPA · Figma, design systems",
    time: "8:12 AM",
    unread: true,
  },
  {
    company: "Meridian",
    title: "Backend Engineer (Node)",
    preview: "Hybrid · ₹22–30 LPA · Node.js, Postgres, Kafka",
    time: "Yesterday",
  },
  {
    company: "Fernpath",
    title: "Data Analyst",
    preview: "Remote · ₹12–18 LPA · SQL, Python, dashboards",
    time: "Yesterday",
  },
  {
    company: "Auralite",
    title: "Engineering Manager",
    preview: "Pune · ₹40–52 LPA · 8+ years, team of 12",
    time: "Mon",
  },
  {
    company: "Ardent",
    title: "DevOps Engineer",
    preview: "Remote · ₹20–28 LPA · AWS, Kubernetes, Terraform",
    time: "Mon",
  },
];

const DashboardMockup = () => (
  <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
    >
      {/* Title bar */}
      <div className="relative flex items-center px-4 h-10 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-xs text-white/50">
          JobQ — Job Feed
        </span>
      </div>

      <div className="grid grid-cols-12 h-[520px]">
        {/* Sidebar */}
        <div className="col-span-3 border-r border-white/10 bg-black/30 p-4 hidden sm:block overflow-y-auto">
          <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2">
            <Sparkles className="w-3.5 h-3.5" />
            Match with JobQ AI
          </button>

          <nav className="mt-5 space-y-0.5">
            {SIDEBAR_NAV.map(({ icon: Icon, label, count, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs cursor-default ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {count !== undefined && (
                  <span className="text-[10px] text-white/40">{count}</span>
                )}
              </div>
            ))}
          </nav>

          <div className="mt-6">
            <p className="px-2.5 text-[10px] uppercase tracking-widest text-white/35 font-semibold">
              Categories
            </p>
            <div className="mt-2 space-y-0.5">
              {CATEGORIES.map(({ name, color }) => (
                <div
                  key={name}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-white/60 hover:bg-white/5 cursor-default"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Job list */}
        <div className="col-span-6 sm:col-span-4 border-r border-white/10 flex flex-col">
          <div className="flex items-center gap-2 px-4 h-11 border-b border-white/10 shrink-0">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/40">Search roles</span>
          </div>
          <div className="overflow-y-auto">
            {JOB_LIST.map((job) => (
              <div
                key={job.company + job.title}
                className={`px-4 py-3 border-b border-white/[0.06] cursor-default ${
                  job.active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs truncate ${
                      job.unread ? "text-white font-semibold" : "text-white/70"
                    }`}
                  >
                    {job.company}
                  </span>
                  <span className="text-[10px] text-white/35 shrink-0">
                    {job.time}
                  </span>
                </div>
                <p
                  className={`mt-0.5 text-xs truncate ${
                    job.unread ? "text-white/90" : "text-white/60"
                  }`}
                >
                  {job.title}
                </p>
                <p className="mt-0.5 text-[11px] text-white/40 truncate">
                  {job.preview}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Job detail */}
        <div className="col-span-6 sm:col-span-5 flex flex-col">
          <div className="flex items-center gap-1 px-3 h-11 border-b border-white/10 shrink-0">
            {[Send, Bookmark, Share2, Archive, Trash2].map((Icon, i) => (
              <button
                key={i}
                className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60"
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
            <button className="ml-auto w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-5 py-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-white">
              Senior Frontend Engineer
            </h3>

            <div className="mt-3 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                N
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white truncate">Northwind</p>
                <p className="text-[11px] text-white/40 truncate">
                  Posted 2 days ago · 24 applicants
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/50 shrink-0">
                Engineering
              </span>
            </div>

            {/* AI summary card */}
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#A4F4FD" }} />
                <span className="text-[11px] font-semibold text-white">
                  Match summary by JobQ
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-[1.6] text-white/60">
                You match 9 of 11 required skills. Your React and TypeScript
                experience is a strong fit for this team. Adding GraphQL to your
                profile would close the gap.
              </p>
            </div>

            <div className="mt-4 space-y-3 text-[11px] leading-[1.7] text-white/70">
              <p>Hi there,</p>
              <p>
                We&apos;re looking for a senior frontend engineer to own the
                customer-facing surface of our platform — design systems,
                performance, and the details that make a product feel fast.
              </p>
              <p>
                You&apos;ll work alongside two designers and a backend team of
                six, shipping to production several times a week. We care more
                about judgment and taste than years on a résumé.
              </p>
              <p>
                Interviews are two conversations and one take-home you can
                finish in an afternoon. No whiteboard algorithms.
              </p>
              <p className="text-white/50">— The Northwind hiring team</p>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] text-white/70">
              <Paperclip className="w-3.5 h-3.5 text-white/40" />
              job-description.pdf
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);

/* ================================================================== *
 * 5 — Feature: Matching
 * ================================================================== */
const MATCH_CHIPS = [
  "Auto-match by skill",
  "Save for later",
  "Hide irrelevant roles",
  "One-tap apply",
];

const MATCH_BUCKETS = [
  {
    label: "Strong match",
    count: 4,
    color: "#ffffff",
    items: ["Northwind — Senior Frontend", "Cobalt — Product Designer"],
  },
  {
    label: "Worth a look",
    count: 7,
    color: "#e5e5e5",
    items: ["Meridian — Backend Engineer", "Auralite — Engineering Manager"],
  },
  {
    label: "New this week",
    count: 18,
    color: "#a3a3a3",
    items: ["Fernpath — Data Analyst", "Ardent — DevOps Engineer"],
  },
  {
    label: "Filtered out",
    count: 13,
    color: "#525252",
    items: ["Location mismatch · Expired · Overqualified"],
  },
];

const FeatureMatching = () => (
  <section
    id="features"
    className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 scroll-mt-24"
  >
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionEyebrow label="Matching" tag="AI-native" />
        <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02] text-white">
          Clear your job hunt
          <br />
          in a single pass.
        </h2>
        <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
          JobQ reads every posting, understands what you&apos;re actually good
          at, and routes the noise away from the signal. Focus on the roles that
          move your career forward — the rest filters itself.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {MATCH_CHIPS.map((chip) => (
            <span
              key={chip}
              className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
            >
              {chip}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="liquid-glass rounded-2xl p-5"
      >
        <p className="text-xs text-white/50">Today · 42 roles screened</p>
        <div className="mt-4 space-y-2.5">
          {MATCH_BUCKETS.map((bucket) => (
            <div key={bucket.label} className="liquid-glass rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: bucket.color }}
                />
                <span className="text-xs font-medium text-white">
                  {bucket.label}
                </span>
                <span className="text-[10px] text-white/40">
                  ({bucket.count})
                </span>
              </div>
              <div className="mt-2 space-y-1 pl-3.5">
                {bucket.items.map((item) => (
                  <p key={item} className="text-[11px] text-white/50 truncate">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

/* ================================================================== *
 * 6 — Category cloud
 * ================================================================== */
const CATEGORY_CLOUD = [
  "Engineering",
  "Design",
  "Product",
  "Data",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
];

const CategoryCloud = () => (
  <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20">
    <p className="text-center text-xs uppercase tracking-widest text-white/40">
      Hiring across every corner of the market
    </p>
    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
      {CATEGORY_CLOUD.map((name, i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="text-center text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-default"
        >
          {name}
        </motion.div>
      ))}
    </div>
  </section>
);

/* ================================================================== *
 * 7 — Testimonials
 * ================================================================== */
const TESTIMONIALS = [
  {
    quote:
      "JobQ surfaced three roles I would never have found by scrolling. I had two offers within a month of switching to it.",
    name: "Parker Wilf",
    role: "Senior Frontend Engineer",
    company: "NORTHWIND",
  },
  {
    quote:
      "The résumé scoring alone changed how I apply. I finally understood why I was getting filtered out before a human ever saw me.",
    name: "Andrew von Rosenbach",
    role: "Data Analyst",
    company: "FERNPATH",
  },
  {
    quote:
      "As a recruiter, the shortlisting is the whole product. Our time-to-first-interview dropped from eleven days to four.",
    name: "Mathies Christensen",
    role: "Talent Lead",
    company: "AURALITE",
  },
];

const Testimonials = () => (
  <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
    <div className="grid md:grid-cols-3 gap-5">
      {TESTIMONIALS.map((t, i) => (
        <motion.figure
          key={t.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass rounded-2xl p-6"
        >
          <blockquote className="text-sm text-white/80 leading-[1.6]">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-6 pt-5 border-t border-white/10">
            <p className="text-sm font-semibold text-white">{t.name}</p>
            <p className="text-xs text-white/50">{t.role}</p>
            <p className="mt-1.5 text-xs text-white font-semibold tracking-wide">
              {t.company}
            </p>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  </section>
);

/* ================================================================== *
 * 8 — AI tools (live features, not a mockup)
 * ================================================================== */
const AITools = () => (
  <section className="relative z-10 border-t border-white/10">
    <div className="max-w-6xl mx-auto px-6 pt-20 md:pt-28 text-center">
      <div className="flex justify-center">
        <SectionEyebrow label="Try it now" tag="Included with your account" />
      </div>
      <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02] text-white">
        Two tools, working right here.
      </h2>
      <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md mx-auto">
        Not a screenshot — these run the same AI that powers every match on
        JobQ. Sign in, paste your skills or drop in a résumé, and see what
        comes back.
      </p>
    </div>

    <div className="max-w-6xl mx-auto px-6 mt-12 md:mt-16 grid md:grid-cols-2 gap-5 items-stretch">
      <CareerGuide />
      <ResumeAnalyzer />
    </div>
  </section>
);

/* ================================================================== *
 * 9 — Final CTA
 * ================================================================== */
const FinalCTA = () => (
  <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)",
          opacity: 0.3,
        }}
      />
      <div className="relative">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02] text-white">
          Close the tabs.
          <br />
          Join the queue.
        </h2>
        <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
          Join thousands of engineers, designers, and operators who treat the
          job hunt like a system — not a slog.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <PrimaryButton label="Browse Jobs" href="/jobs" />
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors"
          >
            For recruiters
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
          </Link>
        </div>
      </div>
    </motion.div>
  </section>
);

/* ================================================================== *
 * Root
 * ================================================================== */
export default function LandingPage() {
  return (
    <>
      {/* Root noise filter for the shiny headline */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="c3-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"
          />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <Navbar />
      <Hero />
      <MenuBar />
      <DashboardMockup />
      <FeatureMatching />
      <CategoryCloud />
      <Testimonials />
      <AITools />
      <FinalCTA />
    </>
  );
}
