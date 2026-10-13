"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The shell shared by form dialogs and the AI tools: a header with title
 * and close, a scrolling body, and a footer. A centred dialog from 768px up;
 * a full-height sheet sliding up from the bottom below that.
 */
export function PanelDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = 560,
  closable = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Extra context for screen readers, when the body doesn't already give it. */
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  /** False while something can't be interrupted, like a request in flight. */
  closable?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => (closable || o) && onOpenChange(o)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(29,21,23,.55)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          // Without a description, say so explicitly rather than repeating the title.
          {...(description ? {} : { "aria-describedby": undefined })}
          onEscapeKeyDown={(e) => !closable && e.preventDefault()}
          onPointerDownOutside={(e) => !closable && e.preventDefault()}
          style={{ "--panel-w": `${width}px` } as React.CSSProperties}
          className={cn(
            "fixed z-50 flex flex-col border-2 border-ink bg-card",
            // phones: full-height sheet
            "inset-x-0 top-10 bottom-0 rounded-t-[20px] border-b-0",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom duration-200",
            // 768+: centred dialog
            "md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-48px)] md:w-[min(var(--panel-w),calc(100vw-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[10px] md:border-b-2 md:shadow-hard-lg",
            "md:data-[state=open]:slide-in-from-bottom-2 md:data-[state=closed]:slide-out-to-bottom-2"
          )}
        >
          <div className="flex flex-none items-center justify-between gap-3 border-b-2 border-ink px-5 py-4 md:px-[22px]">
            <DialogPrimitive.Title className="font-display text-[22px] leading-[1.05] font-extrabold tracking-[-0.03em] md:text-[26px]">
              {title}
            </DialogPrimitive.Title>
            {closable && (
              <DialogPrimitive.Close
                aria-label="Close"
                className="grid size-11 flex-none place-items-center rounded-[10px] border-2 border-ink bg-card hover:bg-paper-deep"
              >
                <X className="size-[18px]" strokeWidth={2.75} />
              </DialogPrimitive.Close>
            )}
          </div>
          {description && <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-[22px]">{children}</div>
          {footer && (
            <div className="flex flex-none flex-wrap justify-end gap-3 border-t-[1.5px] border-line px-5 py-4 md:px-[22px]">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
