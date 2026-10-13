import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Raised variants carry a hard offset shadow and lift on hover, sink on
 * press (`.press`). Every size is at least 44px tall. Disabled is one look
 * for all variants, so it never reads as a colour choice.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0",
    "rounded-[10px] border-2 border-ink font-sans font-bold no-underline cursor-pointer",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
    "disabled:cursor-not-allowed disabled:border-disabled-line disabled:bg-disabled disabled:text-disabled-ink disabled:shadow-none",
    "aria-disabled:cursor-not-allowed aria-disabled:border-disabled-line aria-disabled:bg-disabled aria-disabled:text-disabled-ink aria-disabled:shadow-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "press bg-red text-white shadow-hard hover:text-white",
        ink: "press bg-ink text-paper shadow-hard-red hover:text-paper [--press-shadow:var(--color-red)]",
        secondary:
          "bg-card text-ink transition-[background-color,transform] duration-[120ms] hover:bg-paper-deep active:translate-x-px active:translate-y-px",
        /** Priority only. Never a general accent. */
        gold: "press bg-gold text-ink shadow-hard hover:text-ink",
        /** Destructive actions inside confirmation dialogs only. */
        danger:
          "bg-red-deep text-white transition-[background-color,transform] duration-[120ms] hover:bg-red-press hover:text-white active:translate-x-px active:translate-y-px",
        ghost:
          "border-transparent bg-transparent px-2.5 text-ink underline underline-offset-[3px] hover:text-red-deep",

        // Pre-redesign names, kept until their call sites are rebuilt.
        default: "press bg-red text-white shadow-hard hover:text-white",
        outline: "bg-card text-ink hover:bg-paper-deep",
        destructive: "bg-red-deep text-white hover:bg-red-press",
        link: "border-transparent bg-transparent text-red-deep underline",
      },
      size: {
        lg: "min-h-14 px-7 text-[18px]",
        md: "min-h-12 px-[22px] text-[16px]",
        sm: "min-h-11 px-4 text-[15px]",
        icon: "size-11 p-0",
        default: "min-h-12 px-[22px] text-[16px]",
      },
    },
    compoundVariants: [{ variant: "ghost", className: "px-2.5" }],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

function Spinner({ className, strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={cn("spin size-[18px]", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner. Pass the verb as children: "Applying", "Saving". */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      // Loading keeps the variant's colour (the design shows a red
      // "Applying"), so it blocks clicks rather than using `disabled`.
      className={cn(buttonVariants({ variant, size, className }), loading && "pointer-events-none")}
      disabled={asChild ? undefined : disabled}
      aria-busy={loading || undefined}
      {...props}
      onClick={loading ? undefined : props.onClick}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants, Spinner };
