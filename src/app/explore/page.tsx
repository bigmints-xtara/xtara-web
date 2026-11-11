import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { explorerMetadata } from "@/lib/seo/marketing-copy";
import { getLocaleFromCookie } from "@/i18n/server";
import ExploreCareers from "@/components/careers/ExploreCareers";
import { MVP_NAVIGATION_ENABLED } from "@/lib/mvp-navigation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return buildPageMetadata({ ...explorerMetadata[locale], path: "/explore", locale });
}

export default function ExplorePage() {
  if (MVP_NAVIGATION_ENABLED) return <ExploreCareers />;
  redirect("/assessment");
}
