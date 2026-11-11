import type { Metadata } from "next";
import { getLocaleFromCookie } from "@/i18n/server";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { educatorMetadata } from "@/lib/seo/marketing-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return buildPageMetadata({ ...educatorMetadata[locale], path: "/educators", locale });
}

export default function EducatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
