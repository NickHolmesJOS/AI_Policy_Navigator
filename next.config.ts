import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // mammoth (DOCX parsing) needs to stay in Node.js land, not bundled by Turbopack
  serverExternalPackages: ["mammoth", "unpdf"],
  // Render uses PORT env var
  env: {
    PORT: process.env.PORT || "3000",
  },
};

export default nextConfig;
