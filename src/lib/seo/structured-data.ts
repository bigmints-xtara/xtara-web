import type { BreadcrumbItem } from "@/components/Breadcrumb";
import { SITE_URL } from "./page-metadata";

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Xtara",
      url: SITE_URL,
      logo: `${SITE_URL}/logo/logo-color.svg`,
      email: "xtara.connect@gmail.com",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Xtara",
      url: SITE_URL,
      inLanguage: ["en", "ml", "hi", "ta"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Xtara",
      url: SITE_URL,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "Career exploration and decision guidance for students from Grade 8 onward.",
    },
  ],
};

export function breadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ label, href }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: label,
      ...(href && { item: new URL(href, SITE_URL).href }),
    })),
  };
}
