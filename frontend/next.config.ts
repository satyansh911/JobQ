import type { NextConfig } from "next";

/**
 * Where the backend services live, as seen from the Next.js server (not from
 * the browser). On Vercel this is the EC2 box; unset, the rewrites below are
 * skipped entirely and the app talks to the services directly via the
 * NEXT_PUBLIC_* URLs, which is how it runs locally and under Compose.
 *
 * e.g. BACKEND_HOST=http://16.4.10.59
 */
const BACKEND_HOST = process.env.BACKEND_HOST?.replace(/\/+$/, "");

/** service -> the port it listens on */
const SERVICE_PORTS: Record<string, number> = {
  auth: 5050,
  utils: 5001,
  user: 5002,
  job: 5003,
  payment: 5004,
};

const nextConfig: NextConfig = {
  /**
   * Emit a self-contained server bundle in .next/standalone, so the runtime
   * image carries only the modules actually imported rather than the whole
   * node_modules tree. Cuts the image from roughly a gigabyte to ~200MB.
   */
  output: "standalone",

  /**
   * Proxy API traffic to the backend from the Next.js server.
   *
   * Vercel serves over HTTPS and the EC2 services speak plain HTTP. A browser
   * refuses to make HTTP requests from an HTTPS page (mixed content), so the
   * frontend cannot call them directly. Routing through here keeps the browser
   * on HTTPS to Vercel and lets the server make the HTTP hop, which is not
   * subject to that rule.
   *
   * It also makes every request same-origin, so CORS stops being involved.
   */
  async rewrites() {
    if (!BACKEND_HOST) return [];

    return [
      ...Object.entries(SERVICE_PORTS).map(([name, port]) => ({
        source: `/api/${name}/:path*`,
        destination: `${BACKEND_HOST}:${port}/api/${name}/:path*`,
      })),
      // Locally-stored uploads are served by the utils service.
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_HOST}:${SERVICE_PORTS.utils}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
