"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Compass, Loader2, Plus } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { assessmentV2StorageKey, parseDiscoveryResult } from "@/lib/assessment-v2";
import { getCareerArea, getCareerKnowledgeCatalog, getCareerRolesByArea } from "@/lib/career-knowledge";
import { getPublishedCareerCatalog } from "@/lib/curated-career-api";
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  setDreamCareers,
  subscribeToDirection,
} from "@/lib/direction";
import { saveDirectionToApi } from "@/lib/direction-api";
import { canAccessPursuedArea } from "@/lib/exploration-access";
import type { CareerAreaId } from "@/types/career-knowledge";
import type { CuratedDreamCareer } from "@/types/curated-career";

const serverSnapshot = () => null;
const subscribeToHydration = () => () => undefined;

const copy = {
  "en": {
    "lockedTitle": "Choose a Career Direction from your results first",
    "lockedDescription": "Complete the assessment, then choose one of the Career Directions suggested for you.",
    "results": "Back to my Career Directions",
    "selectedDirection": "Selected Career Direction",
    "title": "Choose your Dream Careers",
    "description": "Choose one to three careers you want to understand better. You can change these choices at any time.",
    "selected": "selected",
    "max": "You can choose up to three Dream Careers.",
    "details": "View career details",
    "build": "Build My Career Path",
    "chooseOne": "Choose at least one Dream Career to continue.",
    "saving": "Saving…",
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
  const { user } = useAuth();
  const { locale } = useTranslations();
  const text = copy[locale];
  const fallbackCatalog = getCareerKnowledgeCatalog(locale);
  const rawResult = useSyncExternalStore(subscribeToAssessment, () => localStorage.getItem(assessmentV2StorageKey), serverSnapshot);
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, serverSnapshot);
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const plan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);
  const direction = getCareerArea(locale, areaId);
  const [curatedCareers, setCuratedCareers] = useState<CuratedDreamCareer[]>([]);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [loading, setLoading] = useState(true);
  const [selectionOverride, setSelectionOverride] = useState<string[] | null>(null);
  const selectedIds = selectionOverride ?? (plan?.areaId === areaId ? plan.dreamCareerIds : []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getPublishedCareerCatalog()
      .then(({ roles }) => { if (active) setCuratedCareers(roles); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const careers = useMemo(() => {
    const dynamic = curatedCareers
      .filter((career) => career.futureDirectionIds.includes(areaId))
      .map((career) => localizeCareer(career, locale));
    if (dynamic.length) return dynamic;
    if (!direction) return [];
    return getCareerRolesByArea(locale, direction.id as CareerAreaId)
      .map((career) => ({
        id: career.id,
        title: career.title,
        englishTitle: career.englishTitle,
        summary: career.summary,
        workSetting: career.workSetting,
        salaryRange: undefined,
      }));
  }, [areaId, curatedCareers, direction, locale]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!direction) {
    return <EmptyState title={fallbackCatalog.ui.notFound} action={fallbackCatalog.ui.back} href="/assessment" />;
  }

  if (!canAccessPursuedArea(storedResult, plan, areaId)) {
    return <EmptyState title={text.lockedTitle} description={text.lockedDescription} action={storedResult ? text.results : fallbackCatalog.ui.back} href={storedResult ? "/assessment/discovery" : "/assessment"} />;
  }

  const toggle = (careerId: string) => {
    setError("");
    setSelectionOverride((override) => {
      const current = override ?? (plan?.areaId === areaId ? plan.dreamCareerIds : []);
      if (current.includes(careerId)) return current.filter((id) => id !== careerId);
      if (current.length >= 3) {
        setError(text.max);
        return current;
      }
      return [...current, careerId];
    });
  };

  const buildCareerPath = async () => {
    if (!selectedIds.length || !plan) {
      setError(text.chooseOne);
      return;
    }
    setSaving(true);
    const nextPlan = setDreamCareers(plan, selectedIds);
    saveDirectionPlan(nextPlan);
    if (user && !user.isAnonymous) {
      try { saveDirectionPlan(await saveDirectionToApi(nextPlan)); } catch { /* Keep the local choice for retry. */ }
    }
    router.push(user && !user.isAnonymous ? "/dashboard" : "/assessment/pathway");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <Header />
      <main className="px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <Link href="/assessment/discovery" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />{text.results}
          </Link>

          <section className="mt-7 flex items-center gap-4 rounded-2xl border bg-white px-4 py-4 sm:px-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary">
              <Compass className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/70">{text.selectedDirection}</p>
              <h1 className="mt-1 text-xl font-semibold leading-tight text-primary sm:text-2xl">{direction.title}</h1>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="dream-careers-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="dream-careers-title" className="text-2xl font-semibold text-primary sm:text-3xl">{text.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{text.max}</p>
              </div>
              <Badge variant="secondary" className="w-fit rounded-full px-4 py-2 text-sm">{selectedIds.length} / 3 {text.selected}</Badge>
            </div>

            {loading && !careers.length ? <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text.loading}</p> : null}
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {careers.map((career) => {
                const selected = selectedIds.includes(career.id);
                return (
                  <Card key={career.id} className={`overflow-hidden shadow-none transition ${selected ? "border-primary bg-primary/[0.035] ring-2 ring-primary/10" : "border-border hover:border-primary/35"}`}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <Link href={`/dream-careers/${career.id}`} className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-primary text-white" : "bg-primary/5 text-primary"}`}>
                          {selected ? <Check className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold leading-snug text-primary">{career.title}</span>
                          {locale !== "en" && career.englishTitle ? <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{career.englishTitle}</span> : null}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-primary/45 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                      <Button
                        type="button"
                        size="icon"
                        variant={selected ? "default" : "outline"}
                        className="h-11 w-11 shrink-0 rounded-full"
                        onClick={() => toggle(career.id)}
                        aria-pressed={selected}
                        aria-label={`${selected ? "Remove" : "Choose"} ${career.title}`}
                      >
                        {selected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="sticky bottom-4 z-20 mt-8 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-5">
              <p className="font-semibold text-primary">{selectedIds.length} / 3 {text.selected}</p>
              <Button size="lg" className="mt-4 w-full rounded-xl sm:mt-0 sm:w-auto" disabled={saving || !selectedIds.length} onClick={buildCareerPath}>
                {saving ? text.saving : text.build}{saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            {error ? <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
          </section>
        </div>
      </main>
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
  return <div className="min-h-screen bg-slate-50"><Header /><main className="mx-auto max-w-xl px-5 py-20 text-center"><Compass className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-semibold text-primary">{title}</h1>{description ? <p className="mt-3 leading-7 text-muted-foreground">{description}</p> : null}<Button asChild className="mt-6 rounded-full"><Link href={href}>{action}</Link></Button></main></div>;
}

function subscribeToAssessment(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("xtara:assessment-result-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("xtara:assessment-result-changed", onChange);
  };
}
