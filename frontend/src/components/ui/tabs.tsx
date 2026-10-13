"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/** Folder tabs on an ink baseline. Scrolls sideways on narrow screens. */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex gap-1 overflow-x-auto border-b-2 border-ink [scrollbar-width:none]", className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-t-[10px] border-2 border-b-0 border-transparent px-4 font-bold text-ink",
        "hover:bg-paper-deep",
        "data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-paper",
        className
      )}
      {...props}
    />
  );
}

const TabsContent = TabsPrimitive.Content;

export { Tabs, TabsList, TabsTrigger, TabsContent };
