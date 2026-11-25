"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Compass, Loader2, Search, X } from "lucide-react";

import CareerPreviewDialog from "@/components/careers/CareerPreviewDialog";
import Footer from "@/components/Footer";
import styles from '@/components/journey/journey.module.css';
import { ExplorerScene, explorerTone } from '@/components/careers/explorer/ExplorerScene';
import { resolveCareerArtwork } from '@/components/careers/explorer/career-artwork';
import { useCareerExplorer } from '@/components/careers/explorer/useCareerExplorer';
import { journeyCopy } from '@/components/careers/explorer/journey-copy';
import explorer from '@/components/careers/ExploreCareers.module.css';
import design from '@/components/journey/ExplorerJourney.module.css';
import JourneySteps from '@/components/journey/JourneySteps';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { assessmentV2StorageKey, getAssessmentV2Catalog, parseDiscoveryResult } from "@/lib/assessment-v2";
import { getCareerKnowledgeCatalog } from "@/lib/career-knowledge";
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  setDreamCareers,
  subscribeToDirection,
  type DirectionPlan,
} from "@/lib/direction";
import { canAccessPursuedArea } from "@/lib/exploration-access";

import { mvpNavigationCopy } from "@/lib/mvp-navigation";
import { getDirectionFromApi, saveDirectionToApi } from '@/lib/direction-api';
import { markDiscoveryCacheOwner } from '@/lib/discovery-cache-owner';

const serverSnapshot = () => null;
const subscribeToHydration = () => () => undefined;

const copy = {
  "en": {
    "pickerTitle": "Choose your dream careers",
    "shortlist": "Your choices",
    "full": "Remove a choice to add another.",
    "save": "Save choices",
    "choose": "Choose",
    "remove": "Remove",
    "find": "Find a career",
    "continue": "Continue",
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
    "pickerTitle": "നിങ്ങളുടെ സ്വപ്ന കരിയറുകൾ തിരഞ്ഞെടുക്കൂ",
    "shortlist": "നിങ്ങളുടെ തിരഞ്ഞെടുപ്പുകൾ",
    "full": "മറ്റൊന്ന് ചേർക്കാൻ ഒരു കരിയർ നീക്കൂ.",
    "save": "തിരഞ്ഞെടുപ്പുകൾ സേവ് ചെയ്യൂ",
    "choose": "തിരഞ്ഞെടുക്കൂ",
    "remove": "നീക്കൂ",
    "find": "കരിയർ കണ്ടെത്തൂ",
    "continue": "തുടരൂ",
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
    "pickerTitle": "अपने पसंदीदा करियर चुनें",
    "shortlist": "आपकी पसंद",
    "full": "दूसरा करियर जोड़ने के लिए एक विकल्प हटाएँ।",
    "save": "विकल्प सेव करें",
    "choose": "चुनें",
    "remove": "हटाएँ",
    "find": "करियर खोजें",
    "continue": "आगे बढ़ें",
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
    "pickerTitle": "உங்கள் கனவுத் தொழில்களைத் தேர்ந்தெடுங்கள்",
    "shortlist": "உங்கள் தேர்வுகள்",
    "full": "வேறொன்றைச் சேர்க்க ஒரு தேர்வை நீக்குங்கள்.",
    "save": "தேர்வுகளைச் சேமிக்கவும்",
    "choose": "தேர்ந்தெடுக்கவும்",
    "remove": "நீக்கவும்",
    "find": "தொழிலைத் தேடுங்கள்",
    "continue": "தொடர்க",
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
  const catalog = useCareerExplorer(locale);
  const publicExplorer = catalog.data;
  const { data: englishExplorer } = useCareerExplorer('en', locale !== 'en');
  const direction = publicExplorer?.directions.find(item => item.id === areaId);
  const artworkFor = (id: string) => resolveCareerArtwork(
    publicExplorer, publicExplorer?.careers.find(career => career.id === id), direction?.id,
  );
  const sceneTone = explorerTone(direction?.presentation);
  const fallbackCatalog = getCareerKnowledgeCatalog(locale);
  const rawResult = useSyncExternalStore(subscribeToAssessment, () => localStorage.getItem(assessmentV2StorageKey), serverSnapshot);
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, serverSnapshot);
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const localPlan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);
  const [draft, setDraft] = useState<{ owner: string; areaId: string; ids: string[] } | null>(null);
  const [accountPlan, setAccountPlan] = useState<DirectionPlan | null>(null);
  const plan = owner ? accountPlan : localPlan;
  const [reload, setReload] = useState(0);
  const assessmentCopy = getAssessmentV2Catalog(locale);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const rawSelectedIds = plan?.areaId === areaId ? plan.dreamCareerIds : [];
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<DreamCareerView | null>(null);

  useEffect(() => {
    let active = true;
    const saveScope = currentScope.current;
    saveScope.generation += 1;
    setSaving(false);
    setAccountError(false);
    setLoadedOwner(null);
    setDraft(null);
    setError("");
    setQuery("");
    setShortlistOpen(false);
    if (owner) void getDirectionFromApi(owner)
      .then(plan => {
        if (!active) return;
        setAccountPlan(plan);
        setLoadedOwner(owner);
      })
      .catch(() => { if (active) setAccountError(true); });
    return () => { active = false; saveScope.generation += 1; };
  }, [owner, areaId, reload]);

  const careers = useMemo(() => {
    const eligible = new Set(direction?.careerIds);
    const englishTitles = new Map(englishExplorer?.careers.map(career => [career.id, career.title]));
    return (publicExplorer?.careers ?? [])
      .filter(career => eligible.has(career.id) && career.directionIds.includes(areaId))
      .map(career => ({ ...career, englishTitle: locale === 'en' ? undefined : englishTitles.get(career.id) }));
  }, [areaId, direction, englishExplorer, locale, publicExplorer]);
  const selectedIds = owner && draft?.owner === owner && draft.areaId === areaId ? draft.ids : rawSelectedIds;

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
    window.history.pushState({ xtaraCareerPreview: career.id }, '', url);
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


  if (authLoading || (!accountError && (!hydrated || catalog.isPending || (owner && loadedOwner !== owner)))) {
    return <div className={styles.surface}><Header /><main role="status" className="site-frame flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />{text.loading}</main></div>;
  }

  if ((catalog.isError && !publicExplorer) || accountError) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6"><p role="alert">{assessmentCopy.ui.errorTitle}</p><Button onClick={() => { if (catalog.isError) void catalog.refetch(); if (accountError) setReload(value => value + 1); }}>{assessmentCopy.ui.retry}</Button></div>;
  }
  if (!direction) {
    return <EmptyState title={fallbackCatalog.ui.notFound} action={fallbackCatalog.ui.back} href="/assessment" />;
  }

  if (owner ? plan?.areaId !== areaId : !canAccessPursuedArea(storedResult, plan, areaId)) {
    return <EmptyState title={text.lockedTitle} description={text.lockedDescription} action={storedResult ? text.results : fallbackCatalog.ui.back} href={storedResult ? "/assessment/discovery" : "/assessment"} />;
  }

  const toggle = (careerId: string) => {
    if (saving || !plan) return;
    const removing = selectedIds.includes(careerId);
    if (!removing && selectedIds.length >= 3) return;
    const ids = removing ? selectedIds.filter(id => id !== careerId) : [...selectedIds, careerId];
    setError("");
    if (owner) setDraft({ owner, areaId, ids });
    else saveDirectionPlan(setDreamCareers(plan, ids));
  };

  const continueJourney = async () => {
    if (saving || !plan || (!owner && !selectedIds.length)) return;
    if (!owner) { router.push('/assessment/save'); return; }
    if (selectedIds.length === rawSelectedIds.length && selectedIds.every((id, index) => rawSelectedIds[index] === id)) { router.push('/dashboard'); return; }
    const scope = { ...currentScope.current };
    const isCurrent = () => currentScope.current.owner === scope.owner && currentScope.current.areaId === scope.areaId && currentScope.current.generation === scope.generation;
    setSaving(true);
    setError("");
    try {
      const saved = await saveDirectionToApi(setDreamCareers(plan, selectedIds), owner);
      if (!isCurrent()) return;
      markDiscoveryCacheOwner(owner);
      saveDirectionPlan(saved);
      setAccountPlan(saved);
      setDraft(null);
      router.push('/dashboard');
    } catch {
      if (isCurrent()) setError(text.saveFailed);
    } finally {
      if (isCurrent()) setSaving(false);
    }
  };

  const matches = careers.filter(career => `${career.title} ${career.englishTitle || ""} ${career.cardSummary || ""} ${career.summary}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const full = selectedIds.length >= 3;
  const journey = journeyCopy[locale];

  return (
    <div className={`${styles.surface} ${explorer.page}`}>
      <Header />
      <main className={`${explorer.explorer} ${design.shell} ${design.picker}`} style={sceneTone}>
        <div className="site-frame">
          {!owner && <JourneySteps step={2} locale={locale} />}
          <Link href={owner ? "/dashboard" : "/assessment/discovery"} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />{owner ? mvpNavigationCopy[locale].myDirection : text.results}
          </Link>

          <header className={design.chooserHeading}>
            <div>
              <p className={design.directionLabel}>{direction.title}</p>
              <h1 id="dream-careers-title" className={design.heading}>{text.pickerTitle}</h1>
              <p className={design.instructions}>{text.max}</p>
            </div>
            {direction?.illustration && <div className={design.chooserDirectionArt} aria-hidden="true">
              <ExplorerScene illustration={direction.illustration} placeholder="" decorative sizes="120px" />
            </div>}
          </header>
          <div className={design.pickerLayout}>
            <section aria-labelledby="dream-careers-title" className={design.options}>
              <label className={design.chooserSearch}>
                <span className="sr-only">{text.find}</span><Search aria-hidden="true" size={18}/>
                <Input type="search" value={query} placeholder={text.find} onChange={event => setQuery(event.target.value)} />
              </label>
              <ul className={design.choiceList}>
                {matches.map(career => {
                  const chosen = selectedIds.includes(career.id);
                  const { illustration, contextTitle } = artworkFor(career.id);
                        return <li key={career.id} className={design.choice} data-chosen={chosen}>
                    <div aria-hidden="true" className={design.choiceArt}><ExplorerScene illustration={illustration} contextTitle={contextTitle}
                        decorative placeholder={journey.illustration} sizes="80px" /></div>
                    <Button type="button" variant="surface" className={design.choiceToggle} aria-pressed={chosen}
                      aria-describedby={`career-summary-${career.id}`}
                      aria-label={(chosen ? text.remove : text.choose) + ' ' + career.title}
                      disabled={saving || (full && !chosen)} onClick={() => toggle(career.id)}>
                      <span className={design.choiceCopy}><strong>{career.title}</strong>
                        {locale !== 'en' && career.englishTitle && career.englishTitle !== career.title && <small>{career.englishTitle}</small>}
                        <span id={`career-summary-${career.id}`}>{career.cardSummary || career.summary}</span>
                      </span>
                      <span className={design.check} aria-hidden="true">{chosen && <Check size={16}/>}</span>
                    </Button>
                    <Button type="button" variant="link" disabled={saving} className={design.choiceDetail} aria-label={text.details + ' · ' + career.title}
                      onClick={event => { event.currentTarget.focus({ preventScroll: true }); openPreview(career); }}>
                      {text.details}<ArrowRight size={14} aria-hidden="true"/>
                    </Button>
                  </li>;
                })}
              </ul>
              {!matches.length && <p role="status" className="py-6 text-muted-foreground">{!careers.length ? ({
                en: 'No recommended careers are available for this direction yet.', ml: 'ഈ ദിശയിൽ ശുപാർശ ചെയ്ത കരിയറുകൾ ഇപ്പോൾ ലഭ്യമല്ല.',
                hi: 'इस दिशा के लिए सुझाए गए करियर अभी उपलब्ध नहीं हैं।', ta: 'இந்தத் திசையில் பரிந்துரைக்கப்பட்ட தொழில்கள் இன்னும் கிடைக்கவில்லை.',
              })[locale] : ({
                en: 'No careers found. Try another name.', ml: 'കരിയറുകൾ കണ്ടെത്താനായില്ല. മറ്റൊരു പേര് പരീക്ഷിക്കൂ.',
                hi: 'कोई करियर नहीं मिला। दूसरा नाम खोजें।', ta: 'தொழில்கள் கிடைக்கவில்லை. வேறு பெயரைத் தேடுங்கள்.',
              })[locale]}</p>}
            </section>
            <Card className={design.shortlist}>
              <div className={design.summaryContent}>
                <div className={design.shortlistHead}>
                  <h2>{text.shortlist}</h2><span aria-live="polite">{selectedIds.length} / 3</span>
                </div>
                <Button type="button" variant="surface" className={design.shortlistDisclosure}
                  aria-controls="shortlist-items" aria-expanded={shortlistOpen && selectedIds.length > 0} disabled={!selectedIds.length}
                  onClick={() => setShortlistOpen(open => !open)}>
                  <strong>{text.shortlist}</strong>
                  <span aria-live="polite">{selectedIds.length} / 3</span>
                  <ChevronDown aria-hidden="true" size={18} />
                </Button>
                <div id="shortlist-items" className={design.shortlistBody} data-open={shortlistOpen && selectedIds.length > 0}>
                  {selectedIds.length > 0 && <ul className={design.shortlistItems}>{selectedIds.map(id => {
                    const title = publicExplorer?.careers.find(career => career.id === id)?.title ?? id;
                    return <li key={id}>
                      <Button variant="surface" className={design.chip} disabled={saving}
                        aria-label={text.remove + ' ' + title + ' · ' + text.shortlist} onClick={() => toggle(id)}>
                        {title}<X size={15} aria-hidden="true" />
                      </Button>
                    </li>;
                  })}</ul>}
                  {full && <p className={design.shortlistHint}>{text.full}</p>}
                </div>
              </div>
              <div className={design.saveArea}>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button size="lg" disabled={saving || (!owner && !selectedIds.length)} onClick={() => void continueJourney()}>
                  {saving ? text.saving : owner ? text.save : text.continue}
                  {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <ArrowRight aria-hidden="true" />}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
      {preview ? <CareerPreviewDialog career={preview} {...artworkFor(preview.id)} tone={sceneTone} onClose={closePreview} /> : null}
      <Footer />
    </div>
  );
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
