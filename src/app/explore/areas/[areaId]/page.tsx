"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Compass, Loader2, Plus } from "lucide-react";

import CareerPreviewDialog from "@/components/careers/CareerPreviewDialog";
import Footer from "@/components/Footer";
import styles from '@/components/journey/journey.module.css';
import DirectionImage from '@/components/journey/DirectionImage';
import launchpad from '@/components/launchpad/launchpad.module.css';
import JourneySteps from '@/components/journey/JourneySteps';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { assessmentV2StorageKey, getAssessmentV2Catalog, parseDiscoveryResult } from "@/lib/assessment-v2";
import { getCareerKnowledgeCatalog } from "@/lib/career-knowledge";
import { getPublishedCareerCatalog } from "@/lib/curated-career-api";
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  setDreamCareers,
  subscribeToDirection,
} from "@/lib/direction";
import { hydrateDiscoveryFromAccount } from "@/lib/discovery-save";
import { canAccessPursuedArea } from "@/lib/exploration-access";
import type { CuratedDreamCareer, FutureDirection } from "@/types/curated-career";

import { saveDirectionToApi } from '@/lib/direction-api';
import { markDiscoveryCacheOwner } from '@/lib/discovery-cache-owner';

const serverSnapshot = () => null;
const subscribeToHydration = () => () => undefined;

const copy = {
  "en": {
    "lockedTitle": "Choose a Career Direction from your results first",
    "lockedDescription": "Complete the assessment, then choose one of the Career Directions suggested for you.",
    "results": "Back to results",
    "selectedDirection": "Selected Career Direction",
    "title": "What would you like to explore?",
    "description": "Choose one to three careers you want to understand better. You can change these choices at any time.",
    "selected": "selected",
    "max": "Choose up to three careers. You can change them later.",
    "details": "View career details",
    "build": "Build My Career Path",
    "chooseOne": "Choose at least one Dream Career to continue.",
    "saving": "Saving…",
    "saveFailed": "We could not save your choices yet. Check your connection and try again.",
    "loading": "Loading Dream Careers…"
  },
  "ml": {
    "lockedTitle": "ആദ്യം ഫലത്തിൽ നിന്ന് ഒരു കരിയർ മേഖല തിരഞ്ഞെടുക്കൂ",
    "lockedDescription": "അസസ്‌മെന്റ് പൂർത്തിയാക്കി നിങ്ങൾക്ക് നോക്കാവുന്ന മേഖലകളിൽ ഒന്ന് തിരഞ്ഞെടുക്കൂ.",
    "results": "എന്റെ ഫലത്തിലേക്ക് മടങ്ങാം",
    "selectedDirection": "തിരഞ്ഞെടുത്ത കരിയർ മേഖല",
    "title": "ഇഷ്ടപ്പെട്ട കരിയറുകൾ തിരഞ്ഞെടുക്കൂ",
    "description": "കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്ന മൂന്ന് ജോലികൾ വരെ തിരഞ്ഞെടുക്കൂ. പിന്നീട് ഇവ മാറ്റാം.",
    "selected": "തിരഞ്ഞെടുത്തു",
    "max": "മൂന്ന് കരിയറുകൾ വരെ തിരഞ്ഞെടുക്കാം.",
    "details": "ജോലിയെക്കുറിച്ച് അറിയാം",
    "build": "എന്റെ കരിയർ പ്ലാൻ തയ്യാറാക്കാം",
    "chooseOne": "തുടരാൻ കുറഞ്ഞത് ഒരു കരിയർ തിരഞ്ഞെടുക്കൂ.",
    "saving": "സൂക്ഷിക്കുന്നു…",
    "saveFailed": "നിങ്ങളുടെ തിരഞ്ഞെടുപ്പുകൾ ഇപ്പോൾ സൂക്ഷിക്കാനായില്ല. ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കൂ.",
    "loading": "കരിയറുകൾ ലോഡ് ചെയ്യുന്നു…"
  },
  "hi": {
    "lockedTitle": "अपने results से Career Direction चुनें",
    "lockedDescription": "Dream Careers खोलने से पहले assessment complete करें और सुझाई गई direction चुनें।",
    "results": "मेरे results देखें",
    "selectedDirection": "Selected Career Direction",
    "title": "Dream Careers compare करें",
    "description": "Real work, preparation और trade-offs देखें। फिर explore करने के लिए roles save करें।",
    "selected": "Selected",
    "max": "Explore करने के लिए up to three Dream Careers चुनें।",
    "details": "Details देखें",
    "build": "My Career Path बनाएँ",
    "chooseOne": "कम से कम एक Dream Career चुनें।",
    "saving": "Save हो रहा है...",
    "saveFailed": "आपके choices अभी save नहीं हो पाए। Connection check करके फिर try करें।",
    "loading": "Loading..."
  },
  "ta": {
    "lockedTitle": "முதலில் உங்களுடைய ரிசல்ட்ஸை வைத்து ஒரு கேரியர் டைரக்ஷனை தேர்ந்தெடுங்க.",
    "lockedDescription": "மதிப்பீட்டை நிறைவு செய்து, பின்னர் உங்களுக்கு பரிந்துரைக்கப்பட்ட தொழில் வழிகாட்டல்களில் ஒன்றை தேர்வு செய்யுங்கள்.",
    "results": "எனது தொழில் வழிகாட்டுதலுக்குத் திரும்பு",
    "selectedDirection": "தேர்ந்தெடுக்கப்பட்ட Career Direction",
    "title": "கனவுத் தொழிலைத் தேர்ந்தெடுங்கள்",
    "description": "நீங்கள் நன்கு புரிந்து கொள்ள விரும்பும் ஒன்று முதல் மூன்று தொழில் வாய்ப்புகளைத் தேர்ந்தெடுங்கள். இந்தத் தேர்வுகளை நீங்கள் எப்போது வேண்டுமானாலும் மாற்றலாம்.",
    "selected": "தேர்ந்தெடுக்கப்பட்டது",
    "max": "நீங்கள் மூன்று கனவுத் தொழில்களைத் தேர்வு செய்யலாம்.",
    "details": "வேலை விவரங்களைக் காண்க",
    "build": "என் தொழில் பாதையை உருவாக்கு",
    "chooseOne": "தொடர்ந்து செயல்பட குறைந்தபட்சம் ஒரு கனவுத் தொழிலையாவது தேர்ந்தெடுங்கள்.",
    "saving": "சேமிப்பு...",
    "saveFailed": "உங்கள் தேர்வுகளை இப்போது சேமிக்க முடியவில்லை. இணைய இணைப்பை சரிபார்த்து மீண்டும் முயலுங்கள்.",
    "loading": "கனவு வேலைகளை ஏற்றுகிறது..."
  }
} as const;

type DreamCareerView = {
  id: string;
  title: string;
  englishTitle?: string;
  summary: string;
  workSetting?: string;
  salaryRange?: string;
};

export default function CareerDirectionPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const owner = user && !user.isAnonymous ? user.uid : null;
  const currentScope = useRef({ owner, areaId, generation: 0 });
  currentScope.current.owner = owner;
  currentScope.current.areaId = areaId;
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [accountError, setAccountError] = useState(false);
  const { locale } = useTranslations();
  const text = copy[locale];
  const fallbackCatalog = getCareerKnowledgeCatalog(locale);
  const rawResult = useSyncExternalStore(subscribeToAssessment, () => localStorage.getItem(assessmentV2StorageKey), serverSnapshot);
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, serverSnapshot);
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const plan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);
  const [directions, setDirections] = useState<FutureDirection[]>([]);
  const directionRecord = directions.find((item) => item.id === areaId);
  const direction = directionRecord ? { id: directionRecord.id, title: directionRecord.translations[locale]?.title || directionRecord.translations.en.title } : null;
  const [catalogError, setCatalogError] = useState(false);
  const [reload, setReload] = useState(0);
  const assessmentCopy = getAssessmentV2Catalog(locale);
  const [curatedCareers, setCuratedCareers] = useState<CuratedDreamCareer[]>([]);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [loading, setLoading] = useState(true);
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(null);
  const rawSelectedIds = selectionOverride ?? (plan?.areaId === areaId ? plan.dreamCareerIds : []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<DreamCareerView | null>(null);

  useEffect(() => {
    let active = true;
    currentScope.current.generation += 1;
    setSelectionOverride(null);
    setSaving(false);
    setAccountError(false);
    setLoadedOwner(null);
    if (owner) void hydrateDiscoveryFromAccount()
      .then(() => { if (active) setLoadedOwner(owner); })
      .catch(() => { if (active) setAccountError(true); });
    return () => { active = false; currentScope.current.generation += 1; };
  }, [owner, areaId, reload]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCatalogError(false);
    getPublishedCareerCatalog()
      .then(({ roles, directions }) => { if (active) { setCuratedCareers(roles); setDirections(directions); } })
      .catch(() => { if (active) setCatalogError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const careers = useMemo(() => {
    const dynamic = curatedCareers
      .filter((career) => career.futureDirectionIds.includes(areaId)
        && directionRecord?.roleIds.includes(career.id))
      .map((career) => localizeCareer(career, locale));
    return dynamic;
  }, [areaId, curatedCareers, locale, directionRecord]);
  const selectedIds = rawSelectedIds.filter((id) => careers.some((career) => career.id === id));

  useEffect(() => {
    const syncPreview = () => {
      const id = new URL(window.location.href).searchParams.get('career');
      setPreview(careers.find((career) => career.id === id) ?? null);
    };
    syncPreview();
    window.addEventListener('popstate', syncPreview);
    return () => window.removeEventListener('popstate', syncPreview);
  }, [careers]);

  const openPreview = (career: DreamCareerView) => {
    const url = new URL(window.location.href);
    url.searchParams.set('career', career.id);
    window.history.pushState({ ...window.history.state, xtaraCareerPreview: career.id }, '', url);
    setPreview(career);
  };
  const closePreview = () => {
    if (preview && window.history.state?.xtaraCareerPreview === preview.id) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('career');
      window.history.replaceState(window.history.state, '', url);
      setPreview(null);
    }
  };


  if (authLoading || (!accountError && (!hydrated || loading || (owner && loadedOwner !== owner)))) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (catalogError || accountError) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6"><p role="alert">{assessmentCopy.ui.errorTitle}</p><Button onClick={() => setReload((value) => value + 1)}>{assessmentCopy.ui.retry}</Button></div>;
  }
  if (!direction) {
    return <EmptyState title={fallbackCatalog.ui.notFound} action={fallbackCatalog.ui.back} href="/assessment" />;
  }

  if (!canAccessPursuedArea(storedResult, plan, areaId)) {
    return <EmptyState title={text.lockedTitle} description={text.lockedDescription} action={storedResult ? text.results : fallbackCatalog.ui.back} href={storedResult ? "/assessment/discovery" : "/assessment"} />;
  }

  const toggle = async (careerId: string) => {
    if (saving || !plan) return;
    setError("");
    const current = selectedIds;
    if (!current.includes(careerId) && current.length >= 3) {
      setError(text.max);
      return;
    }
    const next = current.includes(careerId) ? current.filter((id) => id !== careerId) : [...current, careerId];
    // Anonymous choices are a resumable draft, including while opening a guide.
    if ((!user || user.isAnonymous) && plan) {
      saveDirectionPlan(setDreamCareers(plan, next));
      setSelectionOverride(null);
    } else if (owner) {
      const scope = { ...currentScope.current };
      const isCurrent = () => currentScope.current.owner === scope.owner && currentScope.current.areaId === scope.areaId && currentScope.current.generation === scope.generation;
      setSaving(true);
      try {
        const saved = await saveDirectionToApi(setDreamCareers(plan, next), owner);
        if (!isCurrent()) return;
        markDiscoveryCacheOwner(owner);
        saveDirectionPlan(saved);
        setSelectionOverride(null);
      } catch {
        if (isCurrent()) setError(text.saveFailed);
      } finally {
        if (isCurrent()) setSaving(false);
      }
    }
  };

  const continueToSummary = () => {
    if (saving || !selectedIds.length || !plan) return;
    router.push('/assessment/save');
  };

  return (
    <div className={styles.surface}>
      <Header />
      <main className={styles.shell}>
        <JourneySteps step={2} locale={locale} />
        <div className="mx-auto max-w-6xl">
          <Link href="/assessment/discovery" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />{text.results}
          </Link>

          <section className={launchpad.directionHero}>
            <div><p className={launchpad.eyebrow}>{text.selectedDirection}</p><h1>{direction.title}</h1></div>
            <DirectionImage directionId={direction.id} />
          </section>

          <section className="mt-8" aria-labelledby="dream-careers-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="dream-careers-title" className={styles.heading}>{text.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{text.max}</p>
              </div>

            </div>

            {loading && !careers.length ? <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text.loading}</p> : null}
            <label className="mt-6 block text-sm font-medium">{({ en: 'Find a career', ml: 'കരിയർ കണ്ടെത്തൂ', hi: 'करियर खोजें', ta: 'தொழிலைத் தேடுங்கள்' })[locale]}
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className={`${styles.search} mt-2 block w-full border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`} />
            </label>
            {careers.length > 0 && !careers.some((career) => `${career.title} ${career.englishTitle || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ? <p role="status" className="mt-6">{({ en: 'No careers found. Try another name.', ml: 'കരിയറുകൾ കണ്ടെത്താനായില്ല. മറ്റൊരു പേര് പരീക്ഷിക്കൂ.', hi: 'कोई करियर नहीं मिला। दूसरा नाम खोजें।', ta: 'தொழில்கள் கிடைக்கவில்லை. வேறு பெயரைத் தேடுங்கள்.' })[locale]}</p> : null}
            <div className={styles.careerGrid}>
              {careers.filter((career) => `${career.title} ${career.englishTitle || ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).map((career) => {
                const selected = selectedIds.includes(career.id);
                return (
                  <Card key={career.id} className={styles.careerCard} data-selected={selected}>
                    <CardContent className={styles.careerBody}>
                      <div className={styles.cardToolbar}><span className={styles.careerIcon} aria-hidden="true"><BriefcaseBusiness size={23} strokeWidth={1.5} /></span>                      <Button type="button" variant={selected ? "default" : "outline"} className={styles.selectButton} disabled={saving} onClick={() => void toggle(career.id)} aria-pressed={selected} aria-label={`${selected ? ({ en: "Remove", ml: "നീക്കുക", hi: "हटाएँ", ta: "நீக்கு" })[locale] : ({ en: "Choose", ml: "തിരഞ്ഞെടുക്കൂ", hi: "चुनें", ta: "தேர்ந்தெடுக்கவும்" })[locale]} ${career.title}`}>
                        {selected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                        {selected ? ({ en: 'Remove', ml: 'നീക്കുക', hi: 'हटाएँ', ta: 'நீக்கு' })[locale] : ({ en: 'Choose', ml: 'തിരഞ്ഞെടുക്കൂ', hi: 'चुनें', ta: 'தேர்ந்தெடுக்கவும்' })[locale]}
                      </Button></div>
                      <button type="button" disabled={saving} onClick={() => openPreview(career)} className={styles.careerRead} aria-label={career.title}>

                        <span><span className={styles.careerTitle}>{career.title}</span>
                          {locale !== "en" && career.englishTitle ? <span className="mt-1 block text-xs text-muted-foreground">{career.englishTitle}</span> : null}
                          <span className={styles.careerSummary}>{career.summary}</span>
                        </span>
                        <span className={styles.details}>{text.details}<ArrowRight size={14} aria-hidden="true" /></span>
                      </button>

                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!careers.length ? <p role="status" className="py-6 text-muted-foreground">{({
              en: 'No recommended careers are available for this direction yet.',
              ml: 'ഈ ദിശയിൽ ശുപാർശ ചെയ്ത കരിയറുകൾ ഇപ്പോൾ ലഭ്യമല്ല.',
              hi: 'इस दिशा के लिए सुझाए गए करियर अभी उपलब्ध नहीं हैं।',
              ta: 'இந்தத் திசையில் பரிந்துரைக்கப்பட்ட தொழில்கள் இன்னும் கிடைக்கவில்லை.',
            })[locale]}</p> : null}

            <div className={styles.selectionBar}>
              <div><p className="text-sm font-semibold" aria-live="polite" aria-label={`${selectedIds.length} / 3 ${text.selected}`}>{selectedIds.length} / 3</p><p className={styles.selectionNames}>{careers.filter((career) => selectedIds.includes(career.id)).map((career) => career.title).join(', ') || text.chooseOne}</p></div>
              <Button size="lg" className="min-h-11" disabled={saving || !selectedIds.length} onClick={continueToSummary}>
                {saving ? text.saving : ({ en: 'Continue', ml: 'തുടരൂ', hi: 'आगे बढ़ें', ta: 'தொடர்க' })[locale]}{saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            {error ? <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
          </section>
        </div>
      </main>
      {preview ? <CareerPreviewDialog career={preview} onClose={closePreview} /> : null}
      <Footer />
    </div>
  );
}

function localizeCareer(career: CuratedDreamCareer, locale: "en" | "ml" | "hi" | "ta"): DreamCareerView {
  const translation = career.translations[locale] || career.translations.en;
  return {
    id: career.id,
    title: translation.title,
    englishTitle: locale !== "en" ? career.translations.en.title : undefined,
    summary: translation.summary,
    workSetting: translation.workSetting,
    salaryRange: career.salaryRange,
  };
}

function EmptyState({ title, description, action, href }: { title: string; description?: string; action: string; href: string }) {
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-xl px-5 py-20 text-center"><Compass className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-semibold text-primary">{title}</h1>{description ? <p className="mt-3 leading-7 text-muted-foreground">{description}</p> : null}<Button asChild className="mt-6 rounded-full"><Link href={href}>{action}</Link></Button></main></div>;
}

function subscribeToAssessment(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("xtara:assessment-result-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("xtara:assessment-result-changed", onChange);
  };
}
