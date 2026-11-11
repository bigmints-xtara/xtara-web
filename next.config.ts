import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCTION_API_PROXY_TARGET = "https://xtara-api-h7awati5ja-uc.a.run.app";
const nonIndexableRoutes = [
  "/admin", "/dashboard", "/profile", "/notifications", "/achievements",
  "/learn", "/play", "/organization", "/assessment-data", "/login",
  "/signup", "/join", "/direction", "/careers", "/colleges",
];

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [...nonIndexableRoutes.map((route) => `${route}/:path*`), "/assessment/:step/:path*"].map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
  async rewrites() {
    const proxyTarget = (
      process.env.XTARA_API_PROXY_TARGET
      || (process.env.NODE_ENV === "production" ? PRODUCTION_API_PROXY_TARGET : "")
    ).replace(/\/$/, "");
    return proxyTarget
      ? [{ source: "/xtara-service/:path*", destination: `${proxyTarget}/:path*` }]
      : [];
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
    NEXT_PUBLIC_ALGOLIA_INDEX_NAME: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME,
    NEXT_PUBLIC_XTARA_API_BASE_URL: process.env.NEXT_PUBLIC_XTARA_API_BASE_URL,
  },
};

export default nextConfig;
