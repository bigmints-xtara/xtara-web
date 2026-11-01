"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/language-provider";
import { getPublishedDreamCareers } from "@/lib/curated-career-api";
import { mvpNavigationCopy } from "@/lib/mvp-navigation";
import type { CuratedDreamCareer } from "@/types/curated-career";

export default function ExploreCareers() {
  const { locale } = useTranslations();
  const copy = mvpNavigationCopy[locale];
  const [careers, setCareers] = useState<CuratedDreamCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const visibleCareers = careers.filter((career) => {
    const translated = career.translations[locale];
    const text = `${translated?.title || career.translations.en.title} ${translated?.summary || career.translations.en.summary} ${career.translations.en.title}`;
    return text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  });
  useEffect(() => {
    let active = true;
    getPublishedDreamCareers().then((items) => {
      if (active) setCareers(items.filter((item) => item.status === "published" || item.published));
    }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="mx-auto max-w-6xl px-5 py-8 pb-28 sm:py-10 xl:pb-20">
      <h1 className="text-3xl font-semibold">{copy.exploreCareers}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{copy.description}</p>
      <label className="mt-6 block text-sm font-medium">
        {copy.search}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 block w-full max-w-lg rounded-lg border border-border bg-background p-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>
      {loading ? <p className="mt-8" role="status">{copy.loading}</p> : error ?
        <div className="mt-8"><p role="alert">{copy.error}</p><Button className="mt-4" onClick={() => { setLoading(true); setError(false); setAttempt((value) => value + 1); }}>{copy.retry}</Button></div> :
        careers.length === 0 ? <p className="mt-8" role="status">{copy.empty}</p> :
        visibleCareers.length === 0 ? <p className="mt-8" role="status">{copy.noMatches}</p> :
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCareers.map((career) => {
              const translated = career.translations[locale];
              const title = translated?.title || career.translations.en.title;
              const summary = translated?.summary || career.translations.en.summary;
              return <li key={career.id}>
                <Link href={`/dream-careers/${encodeURIComponent(career.id)}`} className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{summary}</p>
                  <span className="mt-5 text-sm font-semibold text-primary">{copy.openCareer}</span>
                </Link>
              </li>;
            })}
          </ul>}
    </main>
  </div>;
}
