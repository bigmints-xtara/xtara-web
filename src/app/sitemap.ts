import type { MetadataRoute } from "next";
import { getAllNews } from "@/data/newsData";
import { MVP_NAVIGATION_ENABLED } from "@/lib/mvp-navigation";
import { SITE_URL } from "@/lib/seo/page-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/about",
    "/assessment",
    "/contact",
    "/download",
    "/educators",
    "/news",
    "/privacy-policy",
    "/terms-of-use",
    ...(MVP_NAVIGATION_ENABLED ? ["/explore"] : []),
    ...getAllNews().map(({ slug }) => `/news/${slug}`),
  ];

  return paths.map((path) => ({ url: new URL(path, SITE_URL).href }));
}
