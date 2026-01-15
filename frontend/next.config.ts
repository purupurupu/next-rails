import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
