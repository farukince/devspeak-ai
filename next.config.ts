import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    domains: [],
  },
};

export default nextConfig;
