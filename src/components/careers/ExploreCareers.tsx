"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Search } from 'lucide-react';
import Link from "next/link";
import styles from '@/components/journey/journey.module.css';
import listStyles from './ExploreCareers.module.css';
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
  useEffect(() => {
    const restoreSearch = () => setQuery(new URL(window.location.href).searchParams.get('q') || '');
    restoreSearch();
    window.addEventListener('popstate', restoreSearch);
    return () => window.removeEventListener('popstate', restoreSearch);
  }, []);
  const updateQuery = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('q', value); else url.searchParams.delete('q');
    window.history.replaceState(window.history.state, '', url);
  };
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
  return <div className={styles.surface}>
    <Header />
    <main className={listStyles.page}>
      <header className={listStyles.header}>
      <h1>{copy.exploreCareers}</h1>
      <p>{copy.description}</p>
      </header>
      <div className={listStyles.toolbar}>
        <label className={listStyles.search}>
          {copy.search}
          <span className={listStyles.searchField}><Search size={18} aria-hidden="true" /><input type="search" value={query} onChange={(event) => updateQuery(event.target.value)} /></span>
        </label>
        {!loading && !error && visibleCareers.length > 0 ? <p className={listStyles.count} role="status">{visibleCareers.length} {({ en: visibleCareers.length === 1 ? 'career' : 'careers', ml: 'കരിയറുകൾ', hi: 'करियर', ta: 'தொழில்கள்' })[locale]}</p> : null}
      </div>
      {loading ? <p className="mt-8" role="status">{copy.loading}</p> : error ?
        <div className="mt-8"><p role="alert">{copy.error}</p><Button className="mt-4" onClick={() => { setLoading(true); setError(false); setAttempt((value) => value + 1); }}>{copy.retry}</Button></div> :
        careers.length === 0 ? <p className="mt-8" role="status">{copy.empty}</p> :
        visibleCareers.length === 0 ? <p className="mt-8" role="status">{copy.noMatches}</p> :
          <ul className={listStyles.list} aria-label={copy.exploreCareers}>
            {visibleCareers.map((career) => {
              const translated = career.translations[locale];
              const title = translated?.title || career.translations.en.title;
              const summary = translated?.summary || career.translations.en.summary;
              return <li key={career.id}>
                <Link href={`/dream-careers/${encodeURIComponent(career.id)}?from=explore`} className={listStyles.row}>
                  <h2>{title}</h2>
                  <p className={listStyles.summary}>{summary}</p>
                  <span className={listStyles.open}><span>{copy.openCareer}</span><ArrowRight size={18} aria-hidden="true" /></span>
                </Link>
              </li>;
            })}
          </ul>}
    </main>
  </div>;
}
