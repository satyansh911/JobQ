/**
 * One status check per page load, shared by every caller.
 *
 * Same-origin API calls wait on this before going out, so when the backend is
 * down they fail after the status route's three-second timeout instead of
 * hanging on the proxy for thirty.
 */
let pending: Promise<boolean> | null = null;

export function backendStatus(): Promise<boolean> {
  pending ??= fetch("/api/status", { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => data?.online !== false)
    // If the status route itself is unreachable it says nothing about the
    // backend, so let the real request go ahead and report its own error.
    .catch(() => true);
  return pending;
}

export function recheckBackend(): Promise<boolean> {
  pending = null;
  return backendStatus();
}
