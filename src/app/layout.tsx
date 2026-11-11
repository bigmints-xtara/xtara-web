import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { Suspense } from "react";
import { LanguageProvider } from "@/i18n/language-provider";
import ReactQueryProvider from "@/lib/query/query-client";
import { getLocaleFromCookie } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/seo/page-metadata";
import WaitlistScript from "@/components/WaitlistScript";
import { OrganizationProvider } from "@/context/OrganizationContext";
import WorkspaceRouteBoundary from "@/components/auth/WorkspaceRouteBoundary";
import MvpRouteBoundary from "@/components/MvpRouteBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#12192e" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: messages.metadata.title,
    description: messages.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookie();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_ID?.trim();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans antialiased`}>
        {gaMeasurementId ? <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-setup" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');`}
          </Script>
        </> : null}
        <WaitlistScript />
        <ReactQueryProvider>
        <AuthProvider>
          <OrganizationProvider>
            <LanguageProvider initialLocale={locale}>
              <Suspense fallback={null}>
                <AnalyticsProvider />
              </Suspense>
              <WorkspaceRouteBoundary><MvpRouteBoundary>{children}</MvpRouteBoundary></WorkspaceRouteBoundary>
            </LanguageProvider>
          </OrganizationProvider>
        </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
