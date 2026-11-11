import Container from "@/components/Container";
import Breadcrumb from "@/components/Breadcrumb";
import AppStoreButton from "@/components/AppStoreButton";
import PlayStoreButton from "@/components/PlayStoreButton";
import MarketingLayout from "@/components/MarketingLayout";
import Image from "next/image";
import { getLocaleFromCookie } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const metadata = getMessages(locale).download.metadata;
  return buildPageMetadata({ ...metadata, path: "/download", locale });
}

const DownloadPage = async () => {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);

  return (
    <MarketingLayout>
      <Container>
        <div className="py-4 px-6 md:py-6 md:px-8">
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: messages.common.breadcrumb.home, href: "/" },
                { label: messages.common.breadcrumb.download },
              ]}
            />
          </div>

          <div className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary to-sky-500 py-24 sm:py-32 rounded-3xl">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  {messages.download.hero.title}
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-200">
                  {messages.download.hero.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-4xl py-24 sm:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
                {messages.download.downloadSection.title}
              </h2>
              <p className="text-lg leading-8 text-gray-600 mb-12">
                {messages.download.downloadSection.subtitle}
              </p>

              <div className="flex flex-col items-center space-y-12">
                <div className="relative">
                  <Image
                    src={messages.download.downloadSection.mockupImage}
                    width={384}
                    height={340}
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 384px"
                    priority={true}
                    unoptimized={true}
                    alt={messages.download.downloadSection.mockupAlt}
                    className="mx-auto"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <AppStoreButton url={messages.download.downloadSection.appStoreUrl} />
                  <PlayStoreButton url={messages.download.downloadSection.playStoreUrl} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {messages.download.features.title}
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  {messages.download.features.subtitle}
                </p>
              </div>

              <div className="mx-auto max-w-2xl lg:max-w-none">
                <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-6">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{messages.download.features.items[0].title}</h3>
                    <p className="text-gray-600">{messages.download.features.items[0].description}</p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-6">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{messages.download.features.items[1].title}</h3>
                    <p className="text-gray-600">{messages.download.features.items[1].description}</p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-6">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{messages.download.features.items[2].title}</h3>
                    <p className="text-gray-600">{messages.download.features.items[2].description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {messages.download.finalCta.title}
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  {messages.download.finalCta.subtitle}
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <AppStoreButton dark={true} url={messages.download.downloadSection.appStoreUrl} />
                  <PlayStoreButton dark={true} url={messages.download.downloadSection.playStoreUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </MarketingLayout>
  );
};

export default DownloadPage;
