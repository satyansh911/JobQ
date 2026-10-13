"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/** Square-ish track, hired-green when on. The label beside it says what it does. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-[10px] border-2 border-ink p-0.5 transition-colors duration-[120ms]",
        "data-[state=checked]:bg-hired data-[state=unchecked]:bg-disabled",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className="block size-6 rounded-[6px] border-2 border-ink bg-card transition-transform duration-[120ms] data-[state=checked]:translate-x-6"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
