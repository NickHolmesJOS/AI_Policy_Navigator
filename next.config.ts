import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // mammoth (DOCX parsing) needs to stay in Node.js land, not bundled by Turbopack
  serverExternalPackages: ["mammoth", "unpdf"],
};

export default nextConfig;
