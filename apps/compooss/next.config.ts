import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  output: "standalone",
  // Pin tracing to the monorepo root, so standalone output keeps the same
  // layout when built from the desktop app's staging copy.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
