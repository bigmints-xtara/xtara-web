import type { Metadata } from "next";
import { homeMetadata } from "@/lib/seo/marketing-copy";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import Hero from "@/components/Hero";
import FAQ from "@/components/FAQ";
import Benefits from "@/components/Benefits/Benefits";
import Container from "@/components/Container";
import CTA from "@/components/CTA";
import JsonLd from "@/components/JsonLd";
import { siteStructuredData } from "@/lib/seo/structured-data";
import MarketingLayout from "@/components/MarketingLayout";
import { getLocaleFromCookie } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const metadata = locale === "en" ? homeMetadata : getMessages(locale).metadata;
  return buildPageMetadata({ ...metadata, path: "/", locale });
}

export default function Home() {
  return (
    <MarketingLayout>
      <JsonLd data={siteStructuredData} />
      <Hero />
      <Container>
        <Benefits />
        <FAQ />
        <CTA />

      </Container>
    </MarketingLayout>
  );
}
