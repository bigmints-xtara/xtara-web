import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

export const SITE_URL = "https://xtara.ai";
const DEFAULT_SHARE_IMAGE = "/images/home/hero-career-exploration.jpg";

type PageMetadata = {
  path: string;
  locale: Locale;
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  publishedTime?: string;
};

export function buildPageMetadata({
  path,
  locale,
  title,
  description,
  keywords,
  image = DEFAULT_SHARE_IMAGE,
  publishedTime,
}: PageMetadata): Metadata {
  const url = new URL(path, SITE_URL).href;
  const imageUrl = new URL(image, SITE_URL).href;
  const social = { title, description, images: [imageUrl] };

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      ...social,
      url,
      siteName: "Xtara",
      locale: `${locale}_IN`,
      ...(publishedTime ? { type: "article", publishedTime } : { type: "website" }),
    },
    twitter: { ...social, card: "summary_large_image" },
  };
}
