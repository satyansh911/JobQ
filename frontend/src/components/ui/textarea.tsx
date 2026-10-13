import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-24 resize-y rounded-[10px] border-2 border-ink bg-card px-3.5 py-3 text-[16px] leading-[1.5] text-ink placeholder:text-ink-muted",
        "disabled:cursor-not-allowed disabled:border-disabled-line disabled:bg-disabled",
        "aria-invalid:border-red-deep aria-invalid:shadow-[0_0_0_3px_var(--color-error-ring)]",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
