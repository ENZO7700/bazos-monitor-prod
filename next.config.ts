import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  additionalPrecacheEntries: [{ url: "/~offline", revision: "1" }],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.bazos.sk",
        pathname: "/img/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
