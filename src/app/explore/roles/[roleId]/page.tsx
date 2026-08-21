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
import { XtaraApiError } from '@/lib/api/client';
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
  switchCareerDirection,
  toggleDreamCareer,
  type DirectionPlan,
} from '@/lib/direction';
import { getDirectionFromApi, saveDirectionToApi } from '@/lib/direction-api';
import type {
  CareerIdentityView,
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

const selectionCopy: Record<DreamCareerGuideLocale, {
  saveUnavailable: string;
  saveFailed: string;
  guideUnavailable: string;
}> = {
  en: {
    saveUnavailable: 'Saving is unavailable because this career does not match a saved Career Direction in your account.',
    saveFailed: 'We could not update My Dream Careers. Your saved state has not changed.',
    guideUnavailable: 'Student Guide is not available for this career yet.',
  },
  ml: {
    saveUnavailable: 'നിങ്ങളുടെ അക്കൗണ്ടിലെ സേവ് ചെയ്ത കരിയർ ദിശയുമായി ഈ കരിയർ യോജിക്കുന്നില്ല.',
    saveFailed: 'എന്റെ ഡ്രീം കരിയറുകൾ മാറ്റാൻ കഴിഞ്ഞില്ല. സേവ് ചെയ്ത നില മാറിയിട്ടില്ല.',
    guideUnavailable: 'ഈ കരിയറിന്റെ സ്റ്റുഡന്റ് ഗൈഡ് ഇതുവരെ ലഭ്യമല്ല.',
  },
  hi: {
    saveUnavailable: 'यह करियर आपके खाते में सेव Career Direction से मेल नहीं खाता, इसलिए सेव करना उपलब्ध नहीं है।',
    saveFailed: 'हम My Dream Careers को अपडेट नहीं कर सके। आपकी सेव की गई स्थिति नहीं बदली है।',
    guideUnavailable: 'इस करियर के लिए Student Guide अभी उपलब्ध नहीं है।',
  },
  ta: {
    saveUnavailable: 'உங்கள் கணக்கில் சேமிக்கப்பட்ட தொழில் திசையுடன் இந்தத் தொழில் பொருந்தவில்லை; எனவே சேமிக்க முடியாது.',
    saveFailed: 'My Dream Careers-ஐ மாற்ற முடியவில்லை. உங்கள் சேமிப்பு நிலை மாறவில்லை.',
    guideUnavailable: 'இந்தத் தொழிலுக்கான Student Guide இன்னும் கிடைக்கவில்லை.',
  },
};

export default function DreamCareerPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { user } = useAuth();
  const { locale } = useTranslations();
  const guideLocale = locale as DreamCareerGuideLocale;
  const text = pageCopy[guideLocale];
  const stateText = selectionCopy[guideLocale];
  const [response, setResponse] = useState<DreamCareerStudentGuideResponse | null>(null);
  const [missingGuideCareer, setMissingGuideCareer] = useState<CareerIdentityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [studentContext, setStudentContext] = useState<CareerStudentContextResponse | null>(null);
  const [remotePlan, setRemotePlan] = useState<DirectionPlan | null>(null);
  const [selectionUpdating, setSelectionUpdating] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [retryingRelationships, setRetryingRelationships] = useState<Partial<Record<CareerGuideRelationshipSubsection, boolean>>>({});
  const rawPlan = useSyncExternalStore(subscribeToDirection, getDirectionSnapshot, serverDirectionSnapshot);
  const plan = useMemo(() => parseDirectionPlan(rawPlan), [rawPlan]);

  const loadGuide = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadFailed(false);
    setMissingGuideCareer(null);
    try {
      const next = await getDreamCareerStudentGuide(roleId, { locale: guideLocale, signal });
      if (!signal?.aborted) setResponse(next);
    } catch (error) {
      if (!signal?.aborted) {
        setResponse(null);
        const identity = careerIdentityFromMissingGuide(error);
        if (identity) setMissingGuideCareer(identity);
        else setLoadFailed(true);
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
    setRemotePlan(null);
    if (!user || user.isAnonymous) return;
    const controller = new AbortController();
    Promise.all([
      getDreamCareerStudentContext(roleId, { signal: controller.signal }),
      getDirectionFromApi(),
    ])
      .then(([context, direction]) => {
        if (controller.signal.aborted) return;
        setStudentContext(context);
        setRemotePlan(direction);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [roleId, user]);

  const careerId = response?.career.id ?? roleId;
  const area = response?.career.primaryFutureDirectionId
    ? getCareerArea(locale, response.career.primaryFutureDirectionId)
    : null;
  const signedIn = Boolean(user && !user.isAnonymous);
  const isSelected = signedIn
    ? Boolean(studentContext?.saved)
    : Boolean(plan?.dreamCareerIds.includes(careerId));

  const updateSelection = async () => {
    setSelectionError('');
    if (!signedIn) {
      if (!plan) {
        setSelectionError(text.needsDirection);
        return;
      }
      if (!isSelected && plan.dreamCareerIds.length >= 3) {
        setSelectionError(text.max);
        return;
      }
      saveDirectionPlan(toggleDreamCareer(plan, careerId));
      return;
    }

    if (!response || !studentContext || !remotePlan) {
      setSelectionError(stateText.saveUnavailable);
      return;
    }
    const mutation = deriveSignedInSelectionMutation(
      remotePlan,
      careerId,
      response.career.futureDirectionIds,
      isSelected,
    );
    if (mutation.status === 'unavailable') {
      setSelectionError(stateText.saveUnavailable);
      return;
    }
    if (mutation.status === 'max') {
      setSelectionError(text.max);
      return;
    }

    setSelectionUpdating(true);
    try {
      const saved = await saveDirectionToApi(mutation.plan);
      const [readPlan, readContext] = await Promise.all([
        getDirectionFromApi(),
        getDreamCareerStudentContext(careerId),
      ]);
      if (!readPlan
        || !directionSelectionsMatch(readPlan, saved)
        || readContext.saved !== mutation.expectedSaved) {
        throw new Error('Direction readback did not match the saved selection');
      }
      setRemotePlan(readPlan);
      setStudentContext(readContext);
      saveDirectionPlan(readPlan);
    } catch {
      setSelectionError(stateText.saveFailed);
    } finally {
      setSelectionUpdating(false);
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
  if (missingGuideCareer) {
    return (
      <PageFrame>
        <section className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{text.overview}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-6xl">{missingGuideCareer.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{missingGuideCareer.summary}</p>
          <p className="mt-10 rounded-2xl border border-border bg-card p-6 text-foreground">{stateText.guideUnavailable}</p>
        </section>
      </PageFrame>
    );
  }
  if (loadFailed || !response) return <PageFrame><DreamCareerStudentGuideError locale={guideLocale} onRetry={() => void loadGuide()} /></PageFrame>;

  const guide = response.guide;
  const covered = (questionId: CareerGuideQuestionId) => {
    const status = response.coverage.byQuestion[questionId]?.status;
    return status === 'available' || status === 'partial';
  };
  const firstEarning = covered('earnings') ? guide.aboutCareer.earnings[0] : undefined;
  const conversationSlides = generateCareerConversationSlides({
    locale,
    directionTitle: area?.title ?? text.dreamCareer,
    careers: [{
      title: response.career.title,
      summary: response.career.summary,
      dailyWork: covered('whatYouDo')
        ? guide.aboutCareer.activities.map((activity) => activity.title)
        : [],
      workSetting: '',
      preparation: covered('educationRoutes')
        ? guide.howToGetThere.educationRoutes.map((route) => route.description).join(' ')
        : '',
      tryThis: covered('starterActivity')
        ? guide.whatYouCanDoNow.starterActivity?.description ?? ''
        : '',
      difficultParts: [],
      salaryRange: firstEarning ? `${firstEarning.amountMin}–${firstEarning.amountMax} ${firstEarning.currency} per ${firstEarning.period}` : undefined,
      growthOutlook: undefined,
    }],
    strengths: studentContext?.assessmentReasons.map((reason) => reason.label) ?? [],
    courses: covered('coursesAndColleges') && response.resolved.courseOptions.status === 'available'
      ? response.resolved.courseOptions.items.map((option) => option.courseTitle)
      : [],
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
            {covered('whyItMatters') && guide.aboutCareer.whyItMatters.trim() ? <p className="mt-7 max-w-2xl border-l-2 border-primary/35 pl-5 text-base leading-7 text-foreground">{guide.aboutCareer.whyItMatters}</p> : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full" variant={isSelected ? 'outline' : 'default'} disabled={selectionUpdating} onClick={() => void updateSelection()}>
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

function careerIdentityFromMissingGuide(error: unknown): CareerIdentityView | null {
  if (!(error instanceof XtaraApiError) || error.status !== 404) return null;
  const details = error.details;
  if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
  const career = (details as { career?: unknown }).career;
  if (!career || typeof career !== 'object' || Array.isArray(career)) return null;
  const value = career as Partial<CareerIdentityView>;
  if (typeof value.id !== 'string'
    || typeof value.title !== 'string'
    || typeof value.summary !== 'string'
    || (value.primaryFutureDirectionId !== null && typeof value.primaryFutureDirectionId !== 'string')
    || !Array.isArray(value.futureDirectionIds)
    || !value.futureDirectionIds.every((id) => typeof id === 'string')) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    summary: value.summary,
    primaryFutureDirectionId: value.primaryFutureDirectionId,
    futureDirectionIds: value.futureDirectionIds,
    ...(typeof value.imageUrl === 'string' ? { imageUrl: value.imageUrl } : {}),
  };
}

type SelectionMutation =
  | { status: 'ready'; plan: DirectionPlan; expectedSaved: boolean }
  | { status: 'max' }
  | { status: 'unavailable' };

function deriveSignedInSelectionMutation(
  plan: DirectionPlan,
  careerId: string,
  careerDirectionIds: string[],
  selected: boolean,
): SelectionMutation {
  const originalAreaId = plan.areaId;
  if (selected) {
    const containingDirections = Object.entries(plan.savedDirections)
      .filter(([, saved]) => saved.dreamCareerIds.includes(careerId))
      .map(([areaId]) => areaId);
    if (!containingDirections.length) return { status: 'unavailable' };
    let next = plan;
    for (const areaId of containingDirections) {
      next = switchCareerDirection(next, areaId);
      next = toggleDreamCareer(next, careerId);
    }
    if (next.areaId !== originalAreaId) next = switchCareerDirection(next, originalAreaId);
    return { status: 'ready', plan: next, expectedSaved: false };
  }

  const compatibleAreaId = [plan.areaId, ...careerDirectionIds]
    .find((areaId, index, values) => (
      values.indexOf(areaId) === index
      && careerDirectionIds.includes(areaId)
      && Boolean(plan.savedDirections[areaId])
    ));
  if (!compatibleAreaId) return { status: 'unavailable' };
  if (plan.savedDirections[compatibleAreaId].dreamCareerIds.length >= 3) return { status: 'max' };

  let next = switchCareerDirection(plan, compatibleAreaId);
  next = toggleDreamCareer(next, careerId);
  if (next.areaId !== originalAreaId) next = switchCareerDirection(next, originalAreaId);
  return { status: 'ready', plan: next, expectedSaved: true };
}

function directionSelectionsMatch(left: DirectionPlan, right: DirectionPlan): boolean {
  if (left.areaId !== right.areaId) return false;
  const areaIds = Array.from(new Set([
    ...Object.keys(left.savedDirections),
    ...Object.keys(right.savedDirections),
  ])).sort();
  return areaIds.every((areaId) => (
    left.savedDirections[areaId]?.dreamCareerIds.join('\u0000')
      === right.savedDirections[areaId]?.dreamCareerIds.join('\u0000')
  ));
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
