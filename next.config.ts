import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backendBase =
      process.env.BACKEND_ORIGIN?.trim() ||
      process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim() ||
      "https://arberwebapp.arbernetwork.com";

    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendBase.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
