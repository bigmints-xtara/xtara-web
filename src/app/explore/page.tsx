import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { explorerMetadata } from "@/lib/seo/marketing-copy";
import { getLocaleFromCookie } from "@/i18n/server";
import DiscoveryResultPage from "@/components/journey/DiscoveryResultPage";
import ExploreCareers from "@/components/careers/ExploreCareers";
import { MVP_NAVIGATION_ENABLED } from "@/lib/mvp-navigation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return buildPageMetadata({ ...explorerMetadata[locale], path: "/explore", locale });
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ choose?: string }> }) {
  if (MVP_NAVIGATION_ENABLED && (await searchParams).choose === "direction") return <DiscoveryResultPage choosing />;
  if (MVP_NAVIGATION_ENABLED) return <ExploreCareers />;
  redirect("/assessment");
}
