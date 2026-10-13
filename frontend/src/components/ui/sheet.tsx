"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet for mobile: filters, job actions, forms under 768px.
 * Drag handle plus a real close button. Slides up 200ms.
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

function SheetContent({
  className,
  children,
  title,
  headerAction,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  /** Sits beside the close button, e.g. "Clear all". */
  headerAction?: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(29,21,23,.55)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-2 border-b-0 border-ink bg-paper",
          "duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-[5px] w-11 rounded-full bg-ink" />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-3">
          <DialogPrimitive.Title className="t-h3 flex-1">{title}</DialogPrimitive.Title>
          {headerAction}
          <DialogPrimitive.Close
            className="grid size-11 place-items-center rounded-[10px] border-2 border-ink bg-card"
            aria-label="Close"
          >
            <X className="size-[18px]" strokeWidth={2.75} />
          </DialogPrimitive.Close>
        </div>
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent };
