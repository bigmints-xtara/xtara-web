import type { Metadata } from "next";
import { getLocaleFromCookie } from "@/i18n/server";
import { launchpadCopy } from "@/components/launchpad/copy";
import { getAssessmentV2Catalog } from "@/lib/assessment-v2";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  return buildPageMetadata({
    path: "/assessment",
    locale,
    title: `${getAssessmentV2Catalog(locale).ui.title} | Xtara`,
    description: launchpadCopy[locale].description,
  });
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
