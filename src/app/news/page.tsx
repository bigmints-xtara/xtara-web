"use client";

import { Button } from "@/components/ui/button";
import publicType from "@/components/MarketingLayout.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import Breadcrumb from "@/components/Breadcrumb";
import MarketingLayout from "@/components/MarketingLayout";
import { getAllNews } from "@/data/newsData";
import { useTranslations } from "@/i18n/language-provider";

const PAGE_SIZE = 10;

const NewsPage = () => {
  const { t, locale } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const newsItems = getAllNews();
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginated = newsItems.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(newsItems.length / PAGE_SIZE);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get("page");
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    }
  }, [totalPages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const url = new URL(window.location.href);
    url.searchParams.set("page", newPage.toString());
    window.history.pushState({}, "", url.toString());
  };

  return (
    <MarketingLayout>
      <Container marketing>
        <div className="py-4 md:py-6">
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: t("common.breadcrumb.home"), href: "/" },
                { label: t("common.breadcrumb.news") },
              ]}
            />
          </div>
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary to-sky-500 py-24 sm:py-32 rounded-3xl mb-12">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className={`font-bold text-white ${publicType.title}`}>
                  {t("news.hero.title")}
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-200">
                  {t("news.metadata.fallbackDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">{t("news.sections.latest")}</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {paginated.slice(0, 6).map((item) => (
                <article
                  key={item.slug}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link href={`/news/${item.slug}`} className="block">
                    {item.image && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className={`${item.image ? "p-6" : "p-8"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <time className="text-sm text-gray-500">
                          {new Date(item.date).toLocaleDateString(locale)}
                        </time>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-foreground">
                          {t("news.badge")}
                        </span>
                      </div>
                      <h3
                        className={`font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-foreground transition-colors ${item.image ? "text-lg" : "text-xl"
                          }`}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={`text-gray-600 line-clamp-3 leading-relaxed ${item.image ? "text-sm" : "text-base"
                          }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {paginated.length > 6 && (
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-6">{t("news.sections.more")}</h2>
              <ul className="space-y-6">
                {paginated.slice(6).map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/news/${item.slug}`}
                      className="block rounded-3xl overflow-hidden bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className={item.image ? "md:flex" : ""}>
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={400}
                            height={250}
                            className="w-full md:w-64 h-48 object-cover md:mr-6 mb-4 md:mb-0"
                          />
                        )}
                        <div className="p-6">
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(item.date).toLocaleDateString(locale)}
                          </p>
                          <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
                          <p className="text-gray-700 mt-2">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between mt-8">
              {currentPage > 1 ? (
                <Button variant="ghost"
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  {t("common.pagination.previous")}
                </Button>
              ) : (
                <span />
              )}
              {currentPage < totalPages && (
                <Button variant="ghost"
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="ml-auto"
                >
                  {t("common.pagination.next")}
                </Button>
              )}
            </div>
          )}
        </div>
      </Container>
    </MarketingLayout>
  );
};

export default NewsPage;
