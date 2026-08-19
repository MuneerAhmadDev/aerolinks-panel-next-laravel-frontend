import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Workaround for Next.js 15.5.x bug where generateBuildId must be defined
  generateBuildId: async () => null,
  // Produces a minimal, self-contained .next/standalone/ folder on build —
  // a pruned server + only the node_modules actually used at runtime. This
  // is what gets deployed to the client's server; the .tsx/.ts source never
  // needs to leave this machine.
  output: "standalone",
  // Explicit, even though false is already the default: never ship .map
  // files that let a browser reconstruct something close to the original
  // source from the production bundle.
  productionBrowserSourceMaps: false,
};

export default nextConfig; 