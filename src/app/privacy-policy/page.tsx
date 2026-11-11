import Container from "@/components/Container";
import MarketingLayout from "@/components/MarketingLayout";
import { defaultMessages, getMessages } from "@/i18n/messages";
import { getLocaleFromCookie } from "@/i18n/server";
import { translate } from "@/i18n/translate";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const metadata = getMessages(locale).privacy.metadata;
  return buildPageMetadata({ ...metadata, path: "/privacy-policy", locale });
}

const PrivacyPolicyPage = async () => {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);
  const contentHtml = translate(messages, "privacy.contentHtml", undefined, defaultMessages);

  return (
    <MarketingLayout>
      <Container>
        <div className="py-4 px-6 md:py-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>
        </div>
      </Container>
    </MarketingLayout>
  );
};

export default PrivacyPolicyPage;
