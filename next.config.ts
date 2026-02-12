import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.lootmart.com.pk",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    // Optimized image formats
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 60 days
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },

  // Enable React strict mode for catching issues
  reactStrictMode: true,

  // Compression for smaller bundles
  compress: true,

  // Powered by header removed for security
  poweredByHeader: false,

  // Redirect /store.html to /store/royal-cash-and-carry for backwards compat
  async redirects() {
    return [
      {
        source: "/store.html",
        destination: "/store/royal-cash-and-carry",
        permanent: true,
      },
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Custom headers for caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/:path*.woff2",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
