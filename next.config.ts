import type { NextConfig } from "next";

// `npm run build` uses `next build --webpack` (see package.json), not the
// Turbopack default. Turbopack's production build hits an open upstream bug
// where Vercel's onBuildComplete packaging step fails with
// "ENOENT: .next/next-server.js.nft.json" (reproduces on Next.js 16.3.x,
// see https://github.com/vercel/next.js/issues/84960). Builds locally under
// Turbopack, fails only on Vercel. Do not switch build back to Turbopack
// until that upstream issue is resolved.
const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
};

export default nextConfig;
