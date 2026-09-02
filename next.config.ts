import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server and only the traced
  // runtime dependencies, so the container image ships without node_modules.
  output: "standalone",
  transpilePackages: ['mapbox-gl'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.wayfairertravel.com",
      },
      // Google Places Photos API
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "places.googleapis.com",
      },
      // Google user-uploaded place photos (CDN)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Google thumbnail cache (used for avatar placeholder)
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      // Unsplash (explore card placeholder images)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
