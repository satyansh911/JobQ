import React from "react";

/**
 * Page-level placeholder. A spinner is reserved for button-local pending
 * states, so this uses skeleton bones with the same geometry as content.
 */
const Loading = () => (
  <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6" role="status" aria-label="Loading">
    <div className="skeleton h-8 w-56" />
    <div className="skeleton mt-3 h-4 w-80" />
    <div className="mt-8 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border border-hairline bg-raised p-5">
          <div className="flex gap-4">
            <div className="skeleton size-11 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-2/5" />
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-3 w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <span className="sr-only">Loading…</span>
  </div>
);

export default Loading;
