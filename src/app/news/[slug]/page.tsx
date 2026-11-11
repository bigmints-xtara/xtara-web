import type { Metadata } from "next";
import Image from "next/image";
import Container from "@/components/Container";
import Breadcrumb from "@/components/Breadcrumb";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { breadcrumbStructuredData } from "@/lib/seo/structured-data";
import MarketingLayout from "@/components/MarketingLayout";
import { notFound } from "next/navigation";
import { getAllNews, getNewsBySlug, markdownToHtml } from "@/data/newsData";
import { getLocaleFromCookie } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const news = getAllNews();
  return news.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  return buildPageMetadata({
    path: `/news/${article.slug}`,
    locale: "en",
    title: `${article.title} - Xtara`,
    description: article.description,
    image: article.image,
    publishedTime: article.date,
  });
}

const NewsDetailPage = async ({ params }: Params) => {
  const { slug } = await params;
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);
  const breadcrumbs = [
    { label: messages.common.breadcrumb.home, href: "/" },
    { label: messages.common.breadcrumb.news, href: "/news" },
    { label: article.title },
  ];
  const html = markdownToHtml(article.content);

  return (
    <MarketingLayout>
      <Container>
        <div className="py-4 px-6 md:py-6 md:px-8">
          <div className="mb-8">
            <JsonLd data={breadcrumbStructuredData(breadcrumbs)} />
            <Breadcrumb items={breadcrumbs} />
          </div>

          {article.image && (
            <div className="mb-8">
              <Image
                src={article.image}
                alt={article.title}
                width={800}
                height={400}
                className="w-full h-64 object-cover rounded-3xl"
              />
            </div>
          )}

          <article className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-4">{article.title}</h1>
            <p className="text-sm text-gray-600 mb-8">
              {new Date(article.date).toLocaleDateString(locale)}
            </p>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>
        </div>
      </Container>
    </MarketingLayout>
  );
};

export default NewsDetailPage;
