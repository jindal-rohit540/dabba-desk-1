import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: the classic dynamic model is easier to teach.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
