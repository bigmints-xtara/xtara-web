"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowRight, Search, ArrowUpRight, X, Compass } from 'lucide-react';
import Link from "next/link";
import styles from '@/components/journey/journey.module.css';
import listStyles from './ExploreCareers.module.css';
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/language-provider";
import { getPublishedDreamCareers } from "@/lib/curated-career-api";
import { mvpNavigationCopy } from "@/lib/mvp-navigation";
import type { CuratedDreamCareer } from "@/types/curated-career";

export default function ExploreCareers() {
  const { locale } = useTranslations();
  const { user } = useAuth();
  const searchInput = useRef<HTMLInputElement>(null);
  const copy = mvpNavigationCopy[locale];
  const editorial = exploreCopy[locale];
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
        <div><p className={listStyles.eyebrow}>{editorial.eyebrow}</p><h1>{copy.exploreCareers}<span aria-hidden="true">.</span></h1><p className={listStyles.intro}>{editorial.intro}</p></div>
        <div className={listStyles.headerNote}><Compass size={28} strokeWidth={1.4} aria-hidden="true" /><p>{editorial.note}</p></div>
      </header>
      <div className={listStyles.layout}>
      <aside className={listStyles.sidebar} aria-label={editorial.guide}>
        <p className={listStyles.eyebrow}>{editorial.guide}</p><h2>{editorial.sidebarTitle}</h2><p>{editorial.sidebarDescription}</p>
        <div className={listStyles.guideSteps}>{editorial.steps.map((step, index) => <div key={step}><span aria-hidden="true">0{index + 1}</span><p>{step}</p></div>)}</div>
        <Link className={listStyles.directionLink} href={user && !user.isAnonymous ? "/dashboard" : "/assessment"}>{user && !user.isAnonymous ? copy.myDirection : ({ en: "Find my direction", ml: "എന്റെ ദിശ കണ്ടെത്താം", hi: "अपनी दिशा खोजें", ta: "எனது திசையைக் கண்டறிக" })[locale]}<ArrowUpRight size={18} aria-hidden="true" /></Link>
      </aside>
      <section aria-label={copy.exploreCareers}>
      <div className={listStyles.toolbar}>
        <div className={listStyles.search}>
          <label htmlFor="career-search">{copy.search}</label>
          <span className={listStyles.searchField}><Search size={18} aria-hidden="true" /><input id="career-search" ref={searchInput} type="search" placeholder={editorial.placeholder} value={query} onChange={(event) => updateQuery(event.target.value)} />{query ? <button type="button" onClick={() => { updateQuery(""); searchInput.current?.focus(); }} aria-label={editorial.clear}><X size={18} aria-hidden="true" /></button> : null}</span>
        </div>
        {!loading && !error && visibleCareers.length > 0 ? <p className={listStyles.count} role="status">{visibleCareers.length} {({ en: visibleCareers.length === 1 ? 'career' : 'careers', ml: 'കരിയറുകൾ', hi: 'करियर', ta: 'தொழில்கள்' })[locale]}</p> : null}
      </div>
      {loading ? <p className="mt-8" role="status">{copy.loading}</p> : error ?
        <div className="mt-8"><p role="alert">{copy.error}</p><Button className="mt-4" onClick={() => { setLoading(true); setError(false); setAttempt((value) => value + 1); }}>{copy.retry}</Button></div> :
        careers.length === 0 ? <p className="mt-8" role="status">{copy.empty}</p> :
        visibleCareers.length === 0 ? <p className="mt-8" role="status">{copy.noMatches}</p> :
          <ul className={listStyles.list} aria-label={copy.exploreCareers}>
            {visibleCareers.map((career, index) => {
              const translated = career.translations[locale];
              const title = translated?.title || career.translations.en.title;
              const summary = translated?.summary || career.translations.en.summary;
              return <li key={career.id}>
                <Link href={`/dream-careers/${encodeURIComponent(career.id)}?from=explore`} className={listStyles.row}>
                  <span className={listStyles.rowNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div className={listStyles.careerText}><h2>{title}</h2><p className={listStyles.summary}>{summary}</p></div>
                  <span className={listStyles.open}><span>{copy.openCareer}</span><ArrowRight size={18} aria-hidden="true" /></span>
                </Link>
              </li>;
            })}
          </ul>}
      </section></div>
    </main>
  </div>;
}

const exploreCopy = {
 en: { eyebrow: "YOUR FUTURE, WIDE OPEN", intro: "There’s more than one way forward. Get to know the work, the possibilities, and what feels like you.", note: "Stay curious. You don’t have to decide today.", guide: "A PLACE TO START", sidebarTitle: "Follow your curiosity.", sidebarDescription: "A career is more than a job title. Open a guide and look a little closer.", steps: ["Find something that interests you.", "Explore what the work involves.", "Think about what you’d like to try."], placeholder: "Search a career or an interest…", clear: "Clear search" },
 ml: { eyebrow: "നിങ്ങളുടെ ഭാവി, തുറന്ന സാധ്യതകൾ", intro: "മുന്നോട്ട് പോകാൻ ഒന്നിലധികം വഴികളുണ്ട്. ജോലിയും സാധ്യതകളും നിങ്ങൾക്ക് ഇണങ്ങുന്നതും അറിയൂ.", note: "അറിയാൻ ശ്രമിക്കൂ. ഇന്ന് തന്നെ തീരുമാനിക്കേണ്ടതില്ല.", guide: "ഇവിടെ തുടങ്ങാം", sidebarTitle: "താൽപ്പര്യങ്ങളെ പിന്തുടരൂ.", sidebarDescription: "കരിയർ ഒരു ജോലി പേര് മാത്രമല്ല. ഗൈഡ് തുറന്ന് കൂടുതൽ അറിയൂ.", steps: ["താൽപ്പര്യമുള്ളത് കണ്ടെത്തൂ.", "ജോലി എന്താണെന്ന് അറിയൂ.", "എന്ത് പരീക്ഷിക്കണമെന്ന് ചിന്തിക്കൂ."], placeholder: "കരിയറോ താൽപ്പര്യമോ തിരയൂ…", clear: "തിരച്ചിൽ മായ്ക്കൂ" },
 hi: { eyebrow: "आपका भविष्य, नई संभावनाएँ", intro: "आगे बढ़ने के कई रास्ते हैं। काम, संभावनाओं और अपनी रुचियों को जानें।", note: "जिज्ञासु रहें। आज ही निर्णय लेना ज़रूरी नहीं।", guide: "यहाँ से शुरू करें", sidebarTitle: "अपनी जिज्ञासा का साथ दें।", sidebarDescription: "करियर सिर्फ नौकरी का नाम नहीं है। गाइड खोलें और उसे करीब से जानें।", steps: ["अपनी रुचि का कुछ खोजें।", "जानें कि काम में क्या होता है।", "सोचें कि आप क्या आज़माना चाहेंगे।"], placeholder: "करियर या रुचि खोजें…", clear: "खोज साफ़ करें" },
 ta: { eyebrow: "உங்கள் எதிர்காலம், புதிய வாய்ப்புகள்", intro: "முன்னேற ஒன்றுக்கும் மேற்பட்ட வழிகள் உள்ளன. வேலை, வாய்ப்புகள் மற்றும் உங்கள் ஆர்வங்களை அறியுங்கள்.", note: "ஆர்வத்துடன் இருங்கள். இன்றே முடிவு செய்ய வேண்டியதில்லை.", guide: "இங்கே தொடங்குங்கள்", sidebarTitle: "உங்கள் ஆர்வத்தைத் தொடருங்கள்.", sidebarDescription: "ஒரு தொழில் என்பது வேலைப் பெயர் மட்டுமல்ல. வழிகாட்டியைத் திறந்து மேலும் அறியுங்கள்.", steps: ["உங்களுக்கு ஆர்வமானதைக் கண்டறியுங்கள்.", "வேலையில் என்ன செய்வீர்கள் என அறியுங்கள்.", "எதை முயற்சிக்க விரும்புகிறீர்கள் எனச் சிந்தியுங்கள்."], placeholder: "ஒரு தொழில் அல்லது ஆர்வத்தைத் தேடுங்கள்…", clear: "தேடலை அழிக்கவும்" },
} as const;
