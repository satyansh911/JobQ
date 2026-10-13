import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 min-h-12 rounded-[10px] border-2 border-ink bg-card px-3.5 text-[16px] text-ink placeholder:text-ink-muted",
        "file:mr-3 file:border-0 file:bg-transparent file:font-bold",
        "disabled:cursor-not-allowed disabled:border-disabled-line disabled:bg-disabled disabled:text-ink-muted",
        "aria-invalid:border-red-deep aria-invalid:shadow-[0_0_0_3px_var(--color-error-ring)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
