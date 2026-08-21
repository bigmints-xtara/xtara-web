'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, MessageCircleMore, Plus, X } from 'lucide-react';

import SlideshowOverlay from '@/components/career-path/SlideshowOverlay';
import {
  DreamCareerStudentGuide,
  DreamCareerStudentGuideError,
  DreamCareerStudentGuideLoading,
} from '@/components/careers/DreamCareerStudentGuide';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { getCareerArea } from '@/lib/career-knowledge';
import { generateCareerConversationSlides } from '@/lib/career-slides-utils';
import {
  getDreamCareerStudentContext,
  getDreamCareerStudentGuide,
} from '@/lib/dream-career-student-guide-api';
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  subscribeToDirection,
  toggleDreamCareer,
} from '@/lib/direction';
import { saveDirectionToApi } from '@/lib/direction-api';
import type {
  CareerGuideQuestionId,
  CareerGuideRelationshipSubsection,
  CareerStudentContextResponse,
  DreamCareerGuideLocale,
  DreamCareerStudentGuideResponse,
} from '@/types/dream-career-student-guide';

const serverDirectionSnapshot = () => null;

const pageCopy = {
  en: {
    back: 'Back to Dream Careers', overview: 'Dream Career guide', selected: 'In My Dream Careers',
    add: 'Add to My Dream Careers', remove: 'Remove from My Dream Careers',
    max: 'You already selected three Dream Careers. Remove one before adding another.',
    needsDirection: 'You can read this guide now. Complete your Career Directions before saving it.',
    conversation: 'Start Career Conversation', conversationHelp: 'Use this guide with a parent, teacher, or counsellor.', dreamCareer: 'Dream Career',
  },
  ml: {
    back: 'ഡ്രീം കരിയറുകളിലേക്ക് മടങ്ങാം', overview: 'ഡ്രീം കരിയർ ഗൈഡ്', selected: 'എന്റെ ഡ്രീം കരിയറുകളിൽ ചേർത്തു',
    add: 'എന്റെ ഡ്രീം കരിയറുകളിൽ ചേർക്കൂ', remove: 'എന്റെ ഡ്രീം കരിയറുകളിൽ നിന്ന് നീക്കൂ',
    max: 'മൂന്ന് ഡ്രീം കരിയറുകൾ തിരഞ്ഞെടുത്തിട്ടുണ്ട്. മറ്റൊന്ന് ചേർക്കാൻ ആദ്യം ഒന്ന് നീക്കൂ.',
    needsDirection: 'ഈ ഗൈഡ് ഇപ്പോൾ വായിക്കാം. സേവ് ചെയ്യാൻ കരിയർ ദിശകൾ പൂർത്തിയാക്കൂ.',
    conversation: 'കരിയർ സംഭാഷണം തുടങ്ങാം', conversationHelp: 'മാതാപിതാവിനോ അധ്യാപകനോ കൗൺസിലറോ കൂടെ ഈ ഗൈഡ് ഉപയോഗിക്കൂ.', dreamCareer: 'ഡ്രീം കരിയർ',
  },
  hi: {
    back: 'Dream Careers पर वापस जाएँ', overview: 'Dream Career गाइड', selected: 'मेरे Dream Careers में',
    add: 'मेरे Dream Careers में जोड़ें', remove: 'मेरे Dream Careers से हटाएँ',
    max: 'आपने तीन Dream Careers चुन लिए हैं। दूसरा जोड़ने से पहले एक हटाएँ।',
    needsDirection: 'आप यह गाइड अभी पढ़ सकते हैं। इसे सेव करने से पहले Career Directions पूरी करें।',
    conversation: 'करियर बातचीत शुरू करें', conversationHelp: 'इस गाइड को माता-पिता, शिक्षक या काउंसलर के साथ इस्तेमाल करें।', dreamCareer: 'Dream Career',
  },
  ta: {
    back: 'கனவுத் தொழில்களுக்குத் திரும்புக', overview: 'கனவுத் தொழில் வழிகாட்டி', selected: 'என் கனவுத் தொழில்களில் உள்ளது',
    add: 'என் கனவுத் தொழில்களில் சேர்க்கவும்', remove: 'என் கனவுத் தொழில்களில் இருந்து நீக்கவும்',
    max: 'நீங்கள் மூன்று கனவுத் தொழில்களைத் தேர்ந்தெடுத்துள்ளீர்கள். இன்னொன்றைச் சேர்க்க ஒன்றை நீக்கவும்.',
    needsDirection: 'இந்த வழிகாட்டியை இப்போது படிக்கலாம். சேமிப்பதற்கு முன் தொழில் திசைகளை முடிக்கவும்.',
    conversation: 'தொழில் உரையாடலைத் தொடங்குக', conversationHelp: 'பெற்றோர், ஆசிரியர் அல்லது ஆலோசகருடன் இந்த வழிகாட்டியைப் பயன்படுத்தவும்.', dreamCareer: 'கனவுத் தொழில்',
  },
} as const;

export default function DreamCareerPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { user } = useAuth();
  const { locale } = useTranslations();
  const guideLocale = locale as DreamCareerGuideLocale;
  const text = pageCopy[guideLocale];
  const [response, setResponse] = useState<DreamCareerStudentGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [studentContext, setStudentContext] = useState<CareerStudentContextResponse | null>(null);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [retryingRelationships, setRetryingRelationships] = useState<Partial<Record<CareerGuideRelationshipSubsection, boolean>>>({});
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, serverDirectionSnapshot);
  const plan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);

  const loadGuide = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const next = await getDreamCareerStudentGuide(roleId, { locale: guideLocale, signal });
      if (!signal?.aborted) setResponse(next);
    } catch {
      if (!signal?.aborted) {
        setResponse(null);
        setLoadFailed(true);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [guideLocale, roleId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadGuide(controller.signal);
    return () => controller.abort();
  }, [loadGuide]);

  useEffect(() => {
    setStudentContext(null);
    if (!user || user.isAnonymous) return;
    const controller = new AbortController();
    getDreamCareerStudentContext(roleId, { signal: controller.signal })
      .then((context) => { if (!controller.signal.aborted) setStudentContext(context); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [roleId, user]);

  const careerId = response?.career.id ?? roleId;
  const area = response?.career.futureDirectionIds.map((directionId) => getCareerArea(locale, directionId)).find(Boolean) ?? null;
  const isSelected = studentContext?.saved ?? Boolean(plan?.dreamCareerIds.includes(careerId));

  const updateSelection = async () => {
    setSelectionError('');
    if (!plan) {
      setSelectionError(text.needsDirection);
      return;
    }
    if (!isSelected && plan.dreamCareerIds.length >= 3) {
      setSelectionError(text.max);
      return;
    }
    const next = toggleDreamCareer(plan, careerId);
    saveDirectionPlan(next);
    setStudentContext((current) => current ? { ...current, saved: next.dreamCareerIds.includes(careerId) } : current);
    if (user && !user.isAnonymous) {
      try {
        const saved = await saveDirectionToApi(next);
        saveDirectionPlan(saved);
        setStudentContext((current) => current ? { ...current, saved: saved.dreamCareerIds.includes(careerId) } : current);
      } catch {
        // Canonical reading and local continuity do not depend on the signed-in overlay.
      }
    }
  };

  const retryRelationship = async (subsection: CareerGuideRelationshipSubsection) => {
    setRetryingRelationships((current) => ({ ...current, [subsection]: true }));
    try {
      const next = await getDreamCareerStudentGuide(roleId, { locale: guideLocale, location: studentContext?.location });
      setResponse((current) => current ? mergeRelationshipSubsection(current, next, subsection) : next);
    } catch {
      // Keep the existing canonical narrative and retry state for this subsection.
    } finally {
      setRetryingRelationships((current) => ({ ...current, [subsection]: false }));
    }
  };

  if (loading && !response) return <PageFrame><DreamCareerStudentGuideLoading locale={guideLocale} /></PageFrame>;
  if (loadFailed || !response) return <PageFrame><DreamCareerStudentGuideError locale={guideLocale} onRetry={() => void loadGuide()} /></PageFrame>;

  const guide = response.guide;
  const firstEarning = guide.aboutCareer.earnings[0];
  const conversationSlides = generateCareerConversationSlides({
    locale,
    directionTitle: area?.title ?? text.dreamCareer,
    careers: [{
      title: response.career.title,
      summary: response.career.summary,
      dailyWork: guide.aboutCareer.activities.map((activity) => activity.title),
      workSetting: '',
      preparation: guide.howToGetThere.educationRoutes.map((route) => route.description).join(' '),
      tryThis: guide.whatYouCanDoNow.starterActivity?.description ?? '',
      difficultParts: [],
      salaryRange: firstEarning ? `${firstEarning.amountMin}–${firstEarning.amountMax} ${firstEarning.currency} per ${firstEarning.period}` : undefined,
      growthOutlook: undefined,
    }],
    strengths: studentContext?.assessmentReasons.map((reason) => reason.label) ?? [],
    courses: response.resolved.courseOptions.map((option) => option.courseTitle),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-primary/10 bg-gradient-to-br from-secondary/25 via-card to-background px-5 py-14 sm:py-20">
          {response.career.imageUrl ? <>
            <div aria-hidden className="absolute inset-y-0 right-0 w-full bg-cover bg-center opacity-20 lg:w-1/2 lg:opacity-90" style={{ backgroundImage: `url(${response.career.imageUrl})` }} />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" />
          </> : null}
          <div className="relative mx-auto max-w-6xl">
            <Link href={area ? `/explore/areas/${area.id}` : '/explore'} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ArrowLeft className="h-4 w-4" />{text.back}
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {area ? <Badge variant="secondary">{area.title}</Badge> : null}
              {isSelected ? <Badge className="bg-emerald-700 text-white hover:bg-emerald-700"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{text.selected}</Badge> : null}
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.overview}</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-primary sm:text-7xl">{response.career.title}</h1>
            <p className="mt-7 max-w-3xl text-xl leading-9 text-muted-foreground">{response.career.summary}</p>
            {guide.aboutCareer.whyItMatters.trim() ? <p className="mt-7 max-w-2xl border-l-2 border-primary/35 pl-5 text-base leading-7 text-foreground">{guide.aboutCareer.whyItMatters}</p> : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full" variant={isSelected ? 'outline' : 'default'} onClick={() => void updateSelection()}>
                {isSelected ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{isSelected ? text.remove : text.add}
              </Button>
              <Button size="lg" variant="secondary" className="rounded-full" onClick={() => setConversationOpen(true)}>
                <MessageCircleMore className="mr-2 h-4 w-4" />{text.conversation}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{text.conversationHelp}</p>
            {selectionError ? <p role="alert" className="mt-3 text-sm font-medium text-destructive">{selectionError}</p> : null}
          </div>
        </section>
        <DreamCareerStudentGuide response={response} locale={guideLocale} onRetryRelationship={(subsection) => void retryRelationship(subsection)} retryingRelationships={retryingRelationships} />
      </main>
      <Footer />
      <SlideshowOverlay isOpen={conversationOpen} onClose={() => setConversationOpen(false)} slides={conversationSlides} />
    </div>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground"><Header /><main>{children}</main><Footer /></div>;
}

const relationshipQuestion: Record<CareerGuideRelationshipSubsection, CareerGuideQuestionId> = {
  relatedCareers: 'relatedCareers', courseOptions: 'coursesAndColleges', employers: 'employers',
  opportunities: 'opportunities', learningResources: 'learningResources',
};

function mergeRelationshipSubsection(current: DreamCareerStudentGuideResponse, next: DreamCareerStudentGuideResponse, subsection: CareerGuideRelationshipSubsection): DreamCareerStudentGuideResponse {
  const questionId = relationshipQuestion[subsection];
  const nextCoverage = next.coverage.byQuestion[questionId];
  const resolved = { ...current.resolved, [subsection]: next.resolved[subsection] } as DreamCareerStudentGuideResponse['resolved'];
  return {
    ...current,
    resolved,
    relationshipErrors: [
      ...current.relationshipErrors.filter((error) => error.subsection !== subsection),
      ...next.relationshipErrors.filter((error) => error.subsection === subsection),
    ],
    coverage: nextCoverage ? {
      items: current.coverage.items.map((item) => item.questionId === questionId ? nextCoverage : item),
      byQuestion: { ...current.coverage.byQuestion, [questionId]: nextCoverage },
    } : current.coverage,
  };
}
