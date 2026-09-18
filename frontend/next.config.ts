import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Emit a self-contained server bundle in .next/standalone, so the runtime
   * image carries only the modules actually imported rather than the whole
   * node_modules tree. Cuts the image from roughly a gigabyte to ~200MB.
   */
  output: "standalone",
};

export default nextConfig;
