"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  Compass,
  ExternalLink,
  GraduationCap,
  IndianRupee,
  Loader2,
  MapPin,
  MessageCircleMore,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

import SlideshowOverlay from "@/components/career-path/SlideshowOverlay";
import DreamCareerProfileCards from "@/components/careers/DreamCareerProfileCards";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { assessmentV2StorageKey, localizeDiscoveryResult, parseDiscoveryResult } from "@/lib/assessment-v2";
import { getCareerArea, getCareerKnowledgeCatalog, getCareerRole, getCareerSources } from "@/lib/career-knowledge";
import { generateCareerConversationSlides } from "@/lib/career-slides-utils";
import { getPublishedDreamCareer } from "@/lib/curated-career-api";
import { getDirectionSnapshot, parseDirectionPlan, saveDirectionPlan, subscribeToDirection, toggleDreamCareer } from "@/lib/direction";
import { saveDirectionToApi } from "@/lib/direction-api";
import { canAccessPursuedRole } from "@/lib/exploration-access";
import { getDirectionCourseQueries } from "@/lib/pathway-recommendations";
import { CollegeService, type CollegeInfo } from "@/lib/firebase/college-service";
import type { CareerRoleContent } from "@/types/career-knowledge";
import type { CuratedDreamCareer } from "@/types/curated-career";

const serverSnapshot = () => null;
const subscribeToHydration = () => () => undefined;

const copy = {
  "en": {
    "lockedTitle": "Choose this Career Direction before opening its Dream Careers",
    "lockedDescription": "Return to your assessment results, choose the Career Direction, and then compare the Dream Careers inside it.",
    "results": "See my Career Directions",
    "back": "Back to Dream Careers",
    "selected": "In My Dream Careers",
    "add": "Add to My Dream Careers",
    "remove": "Remove from My Dream Careers",
    "max": "You already selected three Dream Careers. Remove one before adding another.",
    "conversation": "Start a Career Conversation",
    "conversationHelp": "Use this guide with a parent, teacher, or counsellor.",
    "overview": "Dream Career overview",
    "salary": "Salary guide",
    "salaryMissing": "A verified India salary range has not been published for this career yet.",
    "outlook": "Job outlook",
    "outlookMissing": "Opportunity changes by location, sector, skills, and time. Check current sources before deciding.",
    "dailyWork": "What the work involves",
    "workSetting": "Where the work happens",
    "prepare": "How to prepare",
    "courses": "Relevant course searches",
    "colleges": "Colleges for this Dream Career",
    "collegesDescription": "These colleges have accepted course offerings mapped to this career. Check current admissions and eligibility with the college before applying.",
    "collegesLoading": "Finding mapped colleges…",
    "collegesEmpty": "No verified college mappings are available for this career yet.",
    "viewCollege": "View college",
    "specializations": "Ways to specialize",
    "tryThis": "Try it now",
    "difficult": "What may be difficult",
    "sources": "Sources and review",
    "sourceNote": "Salary, education, and regulation information can change. Use these sources as a starting point and verify current requirements.",
    "reviewed": "Content checked"
  },
  "ml": {
    "lockedTitle": "ആദ്യം ഈ കരിയർ മേഖല തിരഞ്ഞെടുക്കൂ",
    "lockedDescription": "അസസ്‌മെന്റ് ഫലത്തിലേക്ക് മടങ്ങി ഈ മേഖല തിരഞ്ഞെടുക്കൂ. അതിനുശേഷം ഇതിലെ ജോലികൾ താരതമ്യം ചെയ്യാം.",
    "results": "എന്റെ ഫലം കാണാം",
    "back": "കരിയറുകളിലേക്ക് മടങ്ങാം",
    "selected": "എന്റെ കരിയറുകളിൽ ചേർത്തു",
    "add": "എന്റെ കരിയറുകളിൽ ചേർക്കൂ",
    "remove": "എന്റെ കരിയറുകളിൽ നിന്ന് നീക്കൂ",
    "max": "മൂന്ന് കരിയറുകൾ തിരഞ്ഞെടുത്തിട്ടുണ്ട്. മറ്റൊന്ന് ചേർക്കാൻ ആദ്യം ഒന്ന് നീക്കൂ.",
    "conversation": "ഈ കരിയറിനെക്കുറിച്ച് സംസാരിക്കാം",
    "conversationHelp": "വീട്ടുകാരനോ അധ്യാപകനോ കൗൺസിലറോ കൂടെ ഈ ഗൈഡ് നോക്കൂ.",
    "overview": "ഈ ജോലിയെക്കുറിച്ച്",
    "salary": "ശമ്പള വിവരങ്ങൾ",
    "salaryMissing": "ഈ ജോലിയുടെ വിശ്വസിക്കാവുന്ന ഇന്ത്യൻ ശമ്പളവിവരം ഇതുവരെ ലഭ്യമല്ല.",
    "outlook": "ജോലി സാധ്യത",
    "outlookMissing": "സ്ഥലം, മേഖല, സ്കിൽ, സമയം എന്നിവ അനുസരിച്ച് അവസരം മാറും. തീരുമാനിക്കും മുമ്പ് പുതിയ വിവരങ്ങൾ പരിശോധിക്കൂ.",
    "dailyWork": "ദിവസവും എന്താണ് ചെയ്യുന്നത്?",
    "workSetting": "എവിടെയാണ് ജോലി?",
    "prepare": "എന്ത് പഠിക്കണം?",
    "courses": "തിരയാവുന്ന കോഴ്‌സുകൾ",
    "colleges": "ഈ ഡ്രീം കരിയറിനുള്ള കോളേജുകൾ",
    "collegesDescription": "ഈ കരിയറുമായി ബന്ധപ്പെടുത്തിയ അംഗീകരിച്ച കോഴ്സുകൾ ഉള്ള കോളേജുകളാണിവ. അപേക്ഷിക്കുന്നതിന് മുമ്പ് പുതിയ പ്രവേശന-യോഗ്യത വിവരങ്ങൾ കോളേജിൽ പരിശോധിക്കൂ.",
    "collegesLoading": "ബന്ധപ്പെടുത്തിയ കോളേജുകൾ കണ്ടെത്തുന്നു…",
    "collegesEmpty": "ഈ കരിയറിന് പരിശോധിച്ച കോളേജ് മാപ്പിംഗുകൾ ഇതുവരെ ലഭ്യമല്ല.",
    "viewCollege": "കോളേജ് കാണൂ",
    "specializations": "സ്പെഷ്യലൈസേഷനുകൾ",
    "tryThis": "ചെയ്തു നോക്കാം",
    "difficult": "എന്തൊക്കെ ബുദ്ധിമുട്ടാകാം?",
    "sources": "വിവരങ്ങളുടെ ഉറവിടങ്ങൾ",
    "sourceNote": "ശമ്പളവും പഠനയോഗ്യതയും നിയമങ്ങളും മാറാം. പുതിയ നിബന്ധനകൾ ഔദ്യോഗികമായി പരിശോധിക്കൂ.",
    "reviewed": "ഉള്ളടക്കം പരിശോധിച്ചത്"
  },
  "hi": {
    "lockedTitle": "Dream Careers खोलने से पहले यह Career Direction चुनें",
    "lockedDescription": "यह role उस direction से जुड़ा है जिसे आपने अभी choose नहीं किया है। पहले direction save करें।",
    "results": "मेरे results देखें",
    "back": "Back",
    "selected": "Selected",
    "add": "Add to My Dream Careers",
    "remove": "Remove",
    "max": "Explore करने के लिए up to three Dream Careers चुनें।",
    "conversation": "Start a Career Conversation",
    "conversationHelp": "इस career को parent, teacher या counsellor के साथ discuss करने के लिए short slides बनाएँ।",
    "overview": "Dream Career overview",
    "salary": "Salary guide",
    "salaryMissing": "Salary details अभी verify हो रही हैं।",
    "outlook": "Growth outlook",
    "outlookMissing": "Growth outlook अभी verify हो रहा है।",
    "dailyWork": "Daily work",
    "workSetting": "Work setting",
    "prepare": "How to prepare",
    "courses": "Relevant course searches",
    "colleges": "इस Dream Career के colleges",
    "collegesDescription": "इन colleges में इस career से mapped accepted course offerings हैं। Apply करने से पहले current admission और eligibility college से check करें।",
    "collegesLoading": "Mapped colleges खोजे जा रहे हैं…",
    "collegesEmpty": "इस career के verified college mappings अभी available नहीं हैं।",
    "viewCollege": "College देखें",
    "specializations": "Specializations",
    "tryThis": "Try this",
    "difficult": "What may be difficult",
    "sources": "Sources",
    "sourceNote": "Eligibility, courses और rules official sources से verify करें।",
    "reviewed": "Content checked"
  },
  "ta": {
    "lockedTitle": "இதனுடன் தொடர்புடைய Dream Careers-ஐத் திறப்பதற்கு முன் இந்த Career Direction-ஐத் தேர்வுசெய்யுங்கள்",
    "lockedDescription": "உங்கள் மதிப்பீட்டு முடிவுகளுக்குத் திரும்பி, தொழில் திசையைத் தேர்ந்தெடுத்து, பின்னர் அதில் உள்ள கனவு தொழில்களை ஒப்பிட்டுப் பாருங்கள்.",
    "results": "எனது தொழில் வழிகாட்டுதல்களைப் பாருங்கள்.",
    "back": "கனவுத் தொழில்களுக்குத் திரும்புதல்",
    "selected": "என் கனவுத் தொழில்கள்",
    "add": "என் கனவு வேலைகளுடன் சேருங்கள்",
    "remove": "எனது கனவு வேலை வாய்ப்புகளிலிருந்து நீக்கு",
    "max": "நீங்கள் ஏற்கனவே மூன்று கனவு வேலைகளைத் தேர்ந்தெடுத்துவிட்டீர்கள். ஒன்றை நீக்கிவிட்டு இன்னொருதைச் சேர்க்கவும்.",
    "conversation": "தொழில் தொடர்பான உரையாடலைத் தொடங்குங்கள்",
    "conversationHelp": "இந்த வழிகாட்டியை பெற்றோர், ஆசிரியர் அல்லது ஆலோசகருடன் பயன்படுத்தவும்.",
    "overview": "கனவு தொழில் கண்ணோட்டம்",
    "salary": "சம்பள வழிகாட்டி",
    "salaryMissing": "இந்த வேலைக்கு சரிபார்க்கப்பட்ட இந்திய சம்பள வரம்பு இன்னும் வெளியிடப்படவில்லை.",
    "outlook": "வேலை வாய்ப்பு",
    "outlookMissing": "இடம், துறை, திறன்கள் மற்றும் காலத்தைப் பொறுத்து வாய்ப்புகள் மாறும். முடிவெடுப்பதற்கு முன் தற்போதைய ஆதாரங்களைச் சரிபாருங்கள்.",
    "dailyWork": "வேலையில் என்ன அடங்கும்",
    "workSetting": "வேலை நடக்கும் இடம்",
    "prepare": "தயாரிப்பது எப்படி",
    "courses": "தொடர்புடைய பாடத் தேடல்கள்",
    "colleges": "கனவுத் தொழிலுக்குக் கல்லூரிகள்",
    "collegesDescription": "இந்தக் கல்லூரிகள் இந்தத் தொழில் சார்ந்த பாடத்திட்டங்களை ஏற்றுக்கொண்டுள்ளன. விண்ணப்பிக்கும் முன் கல்லூரியுடன் தற்போதைய சேர்க்கை மற்றும் தகுதி குறித்து சரிபார்க்கவும்.",
    "collegesLoading": "வரைபடமாக்கப்பட்ட கல்லூரிகளைக் கண்டறிதல்...",
    "collegesEmpty": "இந்த தொழில்முறைக்கு சரிபார்க்கப்பட்ட கல்லூரி மேப்பிங் எதுவும் இன்னும் கிடைக்கவில்லை.",
    "viewCollege": "கல்லூரி விவரங்களைக் காண்க",
    "specializations": "சிறப்புப் பெறுவதற்கான வழிகள்",
    "tryThis": "இப்போதே முயற்சி செய்து பாருங்கள்",
    "difficult": "என்ன கடினமாக இருக்கலாம்",
    "sources": "மூலங்களும் மதிப்பாய்வும்",
    "sourceNote": "சம்பளம், கல்வி மற்றும் ஒழுங்குமுறைத் தகவல்கள் மாறக்கூடும். இந்த ஆதாரங்களைத் தொடக்கமாகப் பயன்படுத்தி, தற்போதைய தேவைகளைச் சரிபாருங்கள்.",
    "reviewed": "உள்ளடக்கம் சரிபார்க்கப்பட்டது"
  }
} as const;

type DreamCareerView = CareerRoleContent & { salaryRange?: string; growthOutlook?: string; sourceIds: string[] };

export default function DreamCareerPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { user } = useAuth();
  const { locale } = useTranslations();
  const text = copy[locale];
  const catalog = getCareerKnowledgeCatalog(locale);
  const [liveCareer, setLiveCareer] = useState<CuratedDreamCareer | null>(null);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [collegeResult, setCollegeResult] = useState<{ roleId: string; items: CollegeInfo[] } | null>(null);
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, serverSnapshot);
  const rawResult = useSyncExternalStore(subscribeToAssessment, () => localStorage.getItem(assessmentV2StorageKey), serverSnapshot);
  const plan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);
  const storedResult = useMemo(() => parseDiscoveryResult(rawResult), [rawResult]);
  const result = useMemo(() => storedResult ? localizeDiscoveryResult(storedResult, locale) : null, [locale, storedResult]);

  useEffect(() => {
    let active = true;
    getPublishedDreamCareer(roleId).then((career) => {
      if (active) setLiveCareer(career);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [roleId]);

  useEffect(() => {
    let active = true;
    CollegeService.searchCollegesByCareer(roleId, 6)
      .then((colleges) => { if (active) setCollegeResult({ roleId, items: colleges }); })
      .catch(() => { if (active) setCollegeResult({ roleId, items: [] }); });
    return () => { active = false; };
  }, [roleId]);

  const snapshotCareer = storedResult?.catalogSnapshot?.roles.find((career) => career.id === roleId || career.slug === roleId) ?? null;
  const staticCareer = getCareerRole(locale, roleId);
  const curatedCareer = liveCareer || snapshotCareer;
  const role = buildCareerView(roleId, plan?.areaId, staticCareer, curatedCareer, locale);
  const area = role ? getCareerArea(locale, role.areaId) : null;
  const sources = role ? getCareerSources(locale, role.sourceIds) : [];
  const isSelected = Boolean(plan?.dreamCareerIds.includes(roleId));
  const collegesLoading = collegeResult?.roleId !== roleId;
  const mappedColleges = collegesLoading ? [] : collegeResult.items;

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!role || !area) return <EmptyState title={catalog.ui.notFound} action={catalog.ui.back} href="/assessment" />;
  if (!canAccessPursuedRole(storedResult, plan, role.areaId, role.id)) return <EmptyState title={text.lockedTitle} description={text.lockedDescription} action={text.results} href={storedResult ? "/assessment/discovery" : "/assessment"} />;

  const updateSelection = async () => {
    if (!plan) return;
    setSelectionError("");
    if (!isSelected && plan.dreamCareerIds.length >= 3) {
      setSelectionError(text.max);
      return;
    }
    const next = toggleDreamCareer(plan, role.id);
    saveDirectionPlan(next);
    if (user && !user.isAnonymous) {
      try { saveDirectionPlan(await saveDirectionToApi(next)); } catch { /* Preserve local selection. */ }
    }
  };

  const courseQueries = curatedCareer?.courseQueries?.length
    ? curatedCareer.courseQueries.slice(0, 4)
    : storedResult ? getDirectionCourseQueries(storedResult, role.areaId).slice(0, 4) : [];
  const conversationSlides = generateCareerConversationSlides({
    locale,
    directionTitle: area.title,
    careers: [{
      title: role.title,
      summary: role.summary,
      dailyWork: role.dailyWork,
      workSetting: role.workSetting,
      preparation: role.pathway,
      tryThis: role.tryThis,
      difficultParts: role.tradeoffs,
      salaryRange: role.salaryRange,
      growthOutlook: role.growthOutlook,
    }],
    strengths: result?.signals.map((signal) => signal.title) ?? [],
    courses: courseQueries,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-primary/10 bg-gradient-to-br from-secondary/25 via-card to-background px-5 py-14 sm:py-20">
          {curatedCareer?.imageUrl ? <><div aria-hidden className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-25 lg:w-1/2 lg:opacity-90" style={{ backgroundImage: `url(${curatedCareer.imageUrl})` }} /><div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" /></> : null}
          <div className="relative mx-auto max-w-6xl">
            <Link href={`/explore/areas/${area.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />{text.back}</Link>
            <div className="mt-8 flex flex-wrap items-center gap-3"><Badge variant="secondary">{area.title}</Badge>{isSelected ? <Badge className="bg-emerald-700 text-white hover:bg-emerald-700"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{text.selected}</Badge> : null}</div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.overview}</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-primary sm:text-7xl">{role.title}</h1>
            {locale !== "en" ? <p className="mt-2 text-sm text-muted-foreground">{role.englishTitle}</p> : null}
            <p className="mt-7 max-w-3xl text-xl leading-9 text-muted-foreground">{role.summary}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full" variant={isSelected ? "outline" : "default"} onClick={updateSelection}>{isSelected ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{isSelected ? text.remove : text.add}</Button>
              <Button size="lg" variant="secondary" className="rounded-full" onClick={() => setConversationOpen(true)}><MessageCircleMore className="mr-2 h-4 w-4" />{text.conversation}</Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{text.conversationHelp}</p>
            {selectionError ? <p role="alert" className="mt-3 text-sm font-medium text-destructive">{selectionError}</p> : null}
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <CareerHighlights role={role} profile={curatedCareer?.detailProfile} text={text} />
            <CoursesToLearn courseQueries={curatedCareer?.detailProfile?.courseQueries.length ? curatedCareer.detailProfile.courseQueries : courseQueries} pathways={curatedCareer?.detailProfile?.educationPathways.map((pathway) => pathway.title) || []} colleges={mappedColleges} loading={collegesLoading} text={text} />
            <div className="mt-16 grid gap-0 lg:grid-cols-3">
              {curatedCareer?.detailProfile ? <DreamCareerProfileCards profile={curatedCareer.detailProfile} locale={locale} /> : <>
                <Card className="rounded-none border-0 border-t border-primary/15 bg-transparent shadow-none lg:col-span-2"><CardContent className="p-6 py-10 sm:p-10"><SectionTitle icon={GraduationCap} title={text.prepare} /><p className="mt-5 text-base leading-8 text-muted-foreground">{role.pathway}</p></CardContent></Card>
                <Card className="rounded-none border-0 border-t border-primary/15 bg-transparent shadow-none"><CardContent className="p-6 py-10"><SectionTitle icon={BookOpen} title={text.specializations} /><div className="mt-5 flex flex-wrap gap-2">{role.specializations.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div></CardContent></Card>
                <Card className="border-primary/10 bg-card shadow-none lg:col-span-3"><CardContent className="p-6 sm:p-8"><SectionTitle icon={CircleHelp} title={text.difficult} /><div className="mt-5 grid gap-3 md:grid-cols-2">{role.tradeoffs.map((item) => <div key={item} className="rounded-2xl bg-muted/40 p-5 text-sm leading-6 text-foreground">{item}</div>)}</div></CardContent></Card>
                <Card className="border-amber-200 bg-amber-50/70 shadow-none dark:border-amber-800/50 dark:bg-amber-950/25 lg:col-span-3"><CardContent className="p-6 sm:p-8"><SectionTitle icon={ShieldCheck} title={text.sources} /><p className="mt-4 max-w-3xl text-sm leading-6 text-amber-950/75 dark:text-amber-100/75">{text.sourceNote}</p><p className="mt-4 text-xs font-medium text-amber-950/70 dark:text-amber-100/70">{text.reviewed}: {role.lastReviewed}</p><div className="mt-5 flex flex-wrap gap-3">{sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">{source.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div></CardContent></Card>
              </>}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SlideshowOverlay isOpen={conversationOpen} onClose={() => setConversationOpen(false)} slides={conversationSlides} />
    </div>
  );
}

type CareerCopy = { [Key in keyof typeof copy.en]: string };

function CareerHighlights({ role, profile, text }: { role: DreamCareerView; profile?: CuratedDreamCareer["detailProfile"]; text: CareerCopy }) {
  const highlights = profile ? [
    { icon: Sparkles, title: "Why it matters", body: profile.work.whyItMatters, points: [] },
    { icon: BriefcaseBusiness, title: text.dailyWork, body: profile.work.summary, points: profile.work.activities.slice(0, 3).map((item) => item.title) },
    ...(profile.work.settings[0] ? [{ icon: MapPin, title: text.workSetting, body: profile.work.settings[0].environment, points: [profile.work.settings[0].description] }] : []),
    ...(profile.outlook[0] ? [{ icon: TrendingUp, title: text.outlook, body: profile.outlook[0].summary, points: [`${profile.outlook[0].geography} · ${profile.outlook[0].fromYear}–${profile.outlook[0].toYear}`] }] : []),
    { icon: Sparkles, title: profile.tryThis.title, body: profile.tryThis.purpose, points: [`${profile.tryThis.durationMinutes} minutes · ${profile.tryThis.cost.replaceAll("_", " ")}`] },
  ] : [
    { icon: BriefcaseBusiness, title: text.dailyWork, body: role.dailyWork[0] || role.summary, points: role.dailyWork.slice(1, 4) },
    { icon: MapPin, title: text.workSetting, body: role.workSetting, points: [] },
    ...(role.growthOutlook ? [{ icon: TrendingUp, title: text.outlook, body: role.growthOutlook, points: [] }] : []),
    ...(role.salaryRange ? [{ icon: IndianRupee, title: text.salary, body: role.salaryRange, points: [] }] : []),
    { icon: Sparkles, title: text.tryThis, body: role.tryThis, points: [] },
  ];

  return <section aria-labelledby="career-highlights-title">
    <div className="flex flex-wrap items-end justify-between gap-2"><h2 id="career-highlights-title" className="text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl">Highlights</h2><p className="text-sm font-medium text-muted-foreground">Swipe or scroll to explore</p></div>
    <div className="-mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
      {highlights.map((item, index) => <article key={`${item.title}-${index}`} className="min-h-80 min-w-[86%] snap-start rounded-[2rem] bg-gradient-to-br from-secondary/35 via-card to-muted/40 p-7 sm:min-w-[55%] lg:min-w-[34%]">
        <div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-primary"><item.icon className="h-5 w-5" /></span><span className="text-xs font-bold text-primary/70">{String(index + 1).padStart(2, "0")} / {String(highlights.length).padStart(2, "0")}</span></div>
        <h3 className="mt-10 text-2xl font-semibold tracking-[-0.025em] text-primary">{item.title}</h3><p className="mt-4 leading-7 text-muted-foreground">{item.body}</p>
        {item.points.length ? <ul className="mt-5 space-y-2">{item.points.map((point) => <li className="flex gap-3 text-sm leading-6 text-foreground" key={point}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{point}</li>)}</ul> : null}
      </article>)}
    </div>
  </section>;
}

function CoursesToLearn({ courseQueries, pathways, colleges, loading, text }: { courseQueries: string[]; pathways: string[]; colleges: CollegeInfo[]; loading: boolean; text: CareerCopy }) {
  const actualCourses = Array.from(new Set(colleges.flatMap((college) => college.courses.map((course) => course.course || course.name).filter(Boolean))));
  const courses = [...actualCourses, ...courseQueries.filter((query) => query && !actualCourses.some((course) => courseNamesOverlap(course, query)))];

  return <section aria-labelledby="courses-to-learn-title" className="mt-16">
    <div><span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary"><GraduationCap className="h-5 w-5" /></span><h2 id="courses-to-learn-title" className="mt-6 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl">Courses to learn</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Swipe or scroll through study options. Every course follows the same pattern, with colleges kept as supporting references.</p></div>
    {courses.length ? <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 sm:mx-0 sm:px-0">{courses.map((course, index) => {
      const matchingColleges = colleges.filter((college) => college.courses.some((offering) => courseNamesOverlap(offering.course || offering.name, course)));
      return <article className="flex min-h-[25rem] min-w-[86%] snap-start flex-col rounded-[2rem] bg-primary p-7 text-primary-foreground sm:min-w-[52%] lg:min-w-[34%]" key={course}>
        <p className="text-xs font-bold tracking-[0.16em] text-secondary">{String(index + 1).padStart(2, "0")} / {String(courses.length).padStart(2, "0")}</p>
        <h3 className="mt-7 text-3xl font-semibold leading-tight tracking-[-0.04em]">{course}</h3>
        <div className="mt-7 h-0.5 w-12 bg-secondary" />
        {loading ? <div className="mt-6 flex items-center gap-3 text-sm text-primary-foreground/60"><Loader2 className="h-4 w-4 animate-spin" />{text.collegesLoading}</div> : matchingColleges.length ? <div className="mt-5"><p className="text-xs font-semibold text-primary-foreground/50">{matchingColleges.length} {matchingColleges.length === 1 ? "place" : "places"} mapped to this course</p><div className="mt-3 border-t border-primary-foreground/10">{matchingColleges.slice(0, 2).map((college) => <Link className="flex items-center justify-between gap-4 border-b border-primary-foreground/10 py-4 text-sm text-primary-foreground/75 transition hover:text-primary-foreground" href={`/colleges/${encodeURIComponent(college.id)}`} key={college.id}><span>{college.name}{college.city ? ` · ${college.city}` : ""}</span><ArrowRight className="h-4 w-4 shrink-0 text-secondary" /></Link>)}</div>{matchingColleges.length > 2 ? <p className="mt-3 text-xs text-primary-foreground/40">+ {matchingColleges.length - 2} more mapped places</p> : null}</div> : <p className="mt-6 text-sm leading-6 text-primary-foreground/50">{text.collegesEmpty}</p>}
      </article>;
    })}</div> : null}
    {pathways.length ? <div className="mt-5 border-t border-primary/15 pt-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Possible routes</p><p className="mt-3 text-sm leading-7 text-muted-foreground">{pathways.slice(0, 2).join(" · ")}</p></div> : null}
  </section>;
}

function courseNamesOverlap(first: string, second: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const a = normalize(first);
  const b = normalize(second);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function buildCareerView(id: string, areaId: string | undefined, fallback: CareerRoleContent | null, curated: CuratedDreamCareer | null, locale: "en" | "ml" | "hi" | "ta"): DreamCareerView | null {
  const translation = curated?.translations[locale] || curated?.translations.en;
  const englishTranslation = curated?.translations.en;
  const resolvedAreaId = curated?.primaryFutureDirectionId || fallback?.areaId || areaId;
  if (!resolvedAreaId || (!fallback && !translation)) return null;
  const fallbackList = (...options: Array<string[] | undefined>) => options.find((items) => items?.length) || [];
  const fallbackText = (...options: Array<string | undefined>) => options.find((value) => value?.trim()) || "";
  return {
    id,
    areaId: resolvedAreaId as CareerRoleContent["areaId"],
    title: fallbackText(translation?.title, englishTranslation?.title, fallback?.title, id),
    englishTitle: fallbackText(englishTranslation?.title, fallback?.englishTitle, translation?.title, id),
    summary: fallbackText(translation?.summary, englishTranslation?.summary, fallback?.summary),
    dailyWork: fallbackList(translation?.dailyWork, englishTranslation?.dailyWork, fallback?.dailyWork),
    workSetting: fallbackText(translation?.workSetting, englishTranslation?.workSetting, fallback?.workSetting),
    pathway: fallbackText(translation?.pathway, englishTranslation?.pathway, fallback?.pathway),
    tradeoffs: fallbackList(translation?.tradeoffs, englishTranslation?.tradeoffs, fallback?.tradeoffs),
    specializations: fallbackList(translation?.specializations, englishTranslation?.specializations, fallback?.specializations),
    tryThis: fallbackText(translation?.tryThis, englishTranslation?.tryThis, fallback?.tryThis),
    sourceIds: Array.from(new Set([...(curated?.sourceIds || []), ...(fallback?.sourceIds || [])])),
    reviewStatus: fallback?.reviewStatus || "pilot",
    lastReviewed: curated?.review.reviewedAt?.slice(0, 10) || fallback?.lastReviewed || "Not yet reviewed",
    salaryRange: curated?.salaryRange || fallback?.salaryRange,
    growthOutlook: curated?.growthOutlook || fallback?.growthOutlook,
  };
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Compass; title: string }) {
  return <div className="flex items-center gap-3 text-primary"><Icon className="h-5 w-5" /><h2 className="text-lg font-semibold">{title}</h2></div>;
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
