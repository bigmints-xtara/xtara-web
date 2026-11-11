import type { Metadata } from "next";
import { getLocaleFromCookie } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const { fallbackTitle, fallbackDescription } = getMessages(locale).news.metadata;
  return buildPageMetadata({
    path: "/news",
    locale,
    title: fallbackTitle,
    description: fallbackDescription,
  });
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
