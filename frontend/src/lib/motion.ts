import type { Transition, Variants } from "motion/react";

/**
 * Motion for the three moments that carry the brand (ticket tear, stamp,
 * number roll) plus dialogs and sheets. Every variant has a reduced-motion
 * twin: tear and stamp become 150ms fades, the roll swaps instantly.
 *
 * Pick with `useReducedMotion()` from motion/react:
 *   const reduce = useReducedMotion();
 *   <motion.div variants={reduce ? tear.reduced : tear.full} />
 */

export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;
export const EASE_STAMP = [0.34, 1.56, 0.64, 1] as const;

export const DURATION = {
  press: 0.12,
  base: 0.2,
  stamp: 0.28,
  tear: 0.42,
  roll: 0.5,
} as const;

const fade150: Transition = { duration: 0.15, ease: "linear" };

/** Ticket stub on apply: drops 28px, tilts 8°, fades. */
export const tear: { full: Variants; reduced: Variants } = {
  full: {
    attached: { x: 0, y: 0, rotate: 0, opacity: 1 },
    torn: {
      x: [0, 6, 28],
      y: [0, 2, 22],
      rotate: [0, 2, 8],
      opacity: [1, 1, 0],
      transition: { duration: DURATION.tear, ease: EASE_OUT, times: [0, 0.4, 1] },
    },
  },
  reduced: {
    attached: { opacity: 1 },
    torn: { opacity: 0, transition: fade150 },
  },
};

/** The "You're in the queue" line that follows a tear. */
export const tearMessage: { full: Variants; reduced: Variants } = {
  full: {
    hidden: { opacity: 0, y: 6 },
    shown: { opacity: 1, y: 0, transition: { duration: DURATION.base, delay: 0.3, ease: EASE_OUT } },
  },
  reduced: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: fade150 },
  },
};

/** Status stamp: lands from 1.7x with an overshoot, settles at -9°. */
export const stamp: { full: Variants; reduced: Variants } = {
  full: {
    lifted: { scale: 1.7, rotate: -22, opacity: 0 },
    landed: {
      scale: 1,
      rotate: -9,
      opacity: [0, 1, 1],
      transition: { duration: DURATION.stamp, ease: EASE_STAMP, opacity: { times: [0, 0.6, 1] } },
    },
  },
  reduced: {
    lifted: { rotate: -9, opacity: 0 },
    landed: { rotate: -9, opacity: 1, transition: fade150 },
  },
};

/** Dialogs: 200ms fade and an 8px rise. */
export const dialog: Variants = {
  closed: { opacity: 0, y: 8 },
  open: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/** Bottom sheets on mobile: slide up 200ms. */
export const sheet: Variants = {
  closed: { y: "100%" },
  open: { y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/**
 * Stamps play once per application per device: the first time someone sees
 * a new status, never again after.
 */
export function shouldPlayStamp(applicationId: number, status: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `jq-stamp-${applicationId}`;
  try {
    if (window.localStorage.getItem(key) === status) return false;
    window.localStorage.setItem(key, status);
    return true;
  } catch {
    return false;
  }
}
