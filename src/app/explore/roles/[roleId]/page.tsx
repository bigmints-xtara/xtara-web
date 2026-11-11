'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, GraduationCap, MessageCircleMore, Plus, X } from 'lucide-react';

import SlideshowOverlay from '@/components/career-path/SlideshowOverlay';
import {
  DreamCareerStudentGuide,
  DreamCareerStudentGuideError,
  DreamCareerStudentGuideLoading,
} from '@/components/careers/DreamCareerStudentGuide';
import launchpad from '@/components/launchpad/launchpad.module.css';
import DirectionImage from '@/components/journey/DirectionImage';
import styles from '@/components/journey/journey.module.css';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studyOptionsCopy } from '@/components/careers/study-options-copy';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { XtaraApiError } from '@/lib/api/client';
import { getCareerArea } from '@/lib/career-knowledge';
import { careerConversationFromGuides } from '@/lib/career-conversation-data';
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
import { loadDiscoveryResult } from '@/lib/assessment-v2';
import { MVP_NAVIGATION_ENABLED } from '@/lib/mvp-navigation';
import { markDiscoveryCacheOwner } from '@/lib/discovery-cache-owner';
import { isStudyOptionsCareer, studyOptionsHref } from '@/lib/study-options';
import type {
  CareerIdentityView,
  CareerGuideQuestionId,
  CareerGuideRelationshipSubsection,
  CareerStudentContextResponse,
  DreamCareerGuideLocale,
  DreamCareerStudentGuideResponse,
} from '@/types/dream-career-student-guide';

const journeyCopy = {
  en: { selected: 'Selected', remove: 'Remove', add: 'Choose this career', continue: 'Continue', overview: 'Career overview' },
  ml: { selected: 'തിരഞ്ഞെടുത്തു', remove: 'നീക്കൂ', add: 'ഈ കരിയർ തിരഞ്ഞെടുക്കൂ', continue: 'തുടരൂ', overview: 'കരിയർ പരിചയം' },
  hi: { selected: 'चुना गया', remove: 'हटाएँ', add: 'यह करियर चुनें', continue: 'आगे बढ़ें', overview: 'करियर परिचय' },
  ta: { selected: 'தேர்ந்தெடுக்கப்பட்டது', remove: 'நீக்குக', add: 'இந்தத் தொழிலைத் தேர்ந்தெடுக்கவும்', continue: 'தொடர்க', overview: 'தொழில் அறிமுகம்' },
} as const;

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
  return <Suspense fallback={<div aria-busy="true" className="min-h-screen bg-background" />}><DreamCareerContent /></Suspense>;
}

function DreamCareerContent() {
  const { roleId } = useParams<{ roleId: string }>();
  const from = useSearchParams().get('from');
  const { user, loading: authLoading } = useAuth();
  const currentOwner = useRef(user?.uid);
  const selectionGeneration = useRef(0);
  currentOwner.current = user?.uid;
  const { locale } = useTranslations();
  const guideLocale = locale as DreamCareerGuideLocale;
  const text = pageCopy[guideLocale];
  const stateText = selectionCopy[guideLocale];
  const journeyText = journeyCopy[guideLocale];
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
      const next = await getDreamCareerStudentGuide(roleId, { locale: guideLocale, location: studentContext?.location, signal });
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
  }, [guideLocale, roleId, studentContext?.location]);

  useEffect(() => {
    const controller = new AbortController();
    void loadGuide(controller.signal);
    return () => controller.abort();
  }, [loadGuide]);

  const contextUserId = user?.uid;
  const contextAnonymous = user?.isAnonymous;
  useEffect(() => {
    selectionGeneration.current += 1;
    setStudentContext(null);
    setRemotePlan(null);
    setSelectionUpdating(false);
    setSelectionError('');
    if (!contextUserId || contextAnonymous) return;
    const controller = new AbortController();
    Promise.all([
      getDreamCareerStudentContext(roleId, { signal: controller.signal, expectedUserId: contextUserId }),
      getDirectionFromApi(contextUserId),
    ])
      .then(([context, direction]) => {
        if (controller.signal.aborted) return;
        setStudentContext(context);
        setRemotePlan(direction);
      })
      .catch(() => undefined);
    return () => { controller.abort(); selectionGeneration.current += 1; };
  }, [roleId, contextUserId, contextAnonymous]);

  const careerId = response?.career.id ?? roleId;
  const studyLink = isStudyOptionsCareer(careerId) && (
    <Button asChild size="lg" variant="outline" className="w-fit rounded-lg">
      <Link href={studyOptionsHref(
        careerId,
        from === 'dashboard'
          ? `/dream-careers/${encodeURIComponent(careerId)}?from=dashboard`
          : `/explore/roles/${encodeURIComponent(careerId)}${from === 'explore' ? '?from=explore' : ''}`,
      )}>
        <GraduationCap aria-hidden="true" />
        {studyOptionsCopy[locale].action}
      </Link>
    </Button>
  );
  const area = response?.career.primaryFutureDirectionId
    ? getCareerArea(locale, response.career.primaryFutureDirectionId)
    : null;
  const signedIn = Boolean(user && !user.isAnonymous);
  const activePlan = signedIn ? remotePlan : plan;
  const careerIdentity = response?.career ?? missingGuideCareer;
  const compatibleWithActiveDirection = Boolean(activePlan && (
    careerIdentity?.futureDirectionIds.length
      ? careerIdentity.futureDirectionIds.includes(activePlan.areaId)
      : !signedIn && (() => {
        const catalog = loadDiscoveryResult()?.catalogSnapshot;
        return catalog?.roles.some((career) => career.id === careerId && career.futureDirectionIds.includes(activePlan.areaId))
          && catalog.directions.some((direction) => direction.id === activePlan.areaId && direction.roleIds.includes(careerId));
      })()
  ));
  const returnAreaId = activePlan && compatibleWithActiveDirection
    ? activePlan.areaId : null;
  const backHref = from === 'explore' ? '/explore'
    : from === 'dashboard' && signedIn ? '/dashboard'
    : returnAreaId ? `/assessment/careers/${encodeURIComponent(returnAreaId)}` : '/explore';
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
      if (!isSelected && !compatibleWithActiveDirection) {
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
    const owner = user!.uid;
    const generation = selectionGeneration.current;
    const isCurrent = () => currentOwner.current === owner && selectionGeneration.current === generation;
    try {
      const saved = await saveDirectionToApi(mutation.plan, owner);
      if (!isCurrent()) return;
      const [readPlan, readContext] = await Promise.all([
        getDirectionFromApi(owner),
        getDreamCareerStudentContext(careerId, { expectedUserId: owner }),
      ]);
      if (!isCurrent()) return;
      if (!readPlan
        || !directionSelectionsMatch(readPlan, saved)
        || readContext.saved !== mutation.expectedSaved) {
        throw new Error('Direction readback did not match the saved selection');
      }
      setRemotePlan(readPlan);
      setStudentContext(readContext);
      markDiscoveryCacheOwner(owner);
      saveDirectionPlan(readPlan);
    } catch {
      if (!isCurrent()) return;
      setSelectionError(stateText.saveFailed);
    } finally {
      if (isCurrent()) setSelectionUpdating(false);
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

  if (authLoading || (loading && !response)) return <PageFrame><DreamCareerStudentGuideLoading locale={guideLocale} /></PageFrame>;
  if (missingGuideCareer) {
    return (
      <PageFrame>
        <section className="bg-muted/20 px-4 py-10 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10 lg:p-12">
            <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="h-4 w-4" />{text.back}</Link>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{text.overview}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-primary sm:text-4xl">{missingGuideCareer.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{missingGuideCareer.summary}</p>
            {studyLink && <div className="mt-6">{studyLink}</div>}
            <p className="mt-8 max-w-2xl rounded-2xl bg-muted/55 px-5 py-4 text-foreground sm:px-6">{stateText.guideUnavailable}</p>
          </div>
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
  const conversationSlides = careerConversationFromGuides([response], locale);
  const hasReviewedGuidance = (covered('whatYouDo') && guide.aboutCareer.activities.length > 0)
    || (covered('educationRoutes') && guide.howToGetThere.educationRoutes.length > 0)
    || (covered('starterActivity') && Boolean(guide.whatYouCanDoNow.starterActivity?.description));
  const editorialImage = hasReviewedGuidance ? response.career.imageUrl ?? null : null;
  const editorialCaption = covered('whatYouDo') ? guide.aboutCareer.activities[0]?.title : undefined;

  return (
    <div className={styles.surface}>
      <Header />
      <main>
        <section className="border-b border-border px-6 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ArrowLeft className="h-4 w-4" />{text.back}
            </Link>
            <div className={MVP_NAVIGATION_ENABLED ? launchpad.careerHero : "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-16"}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  {area ? <Badge variant="secondary">{area.title}</Badge> : null}
                  {!MVP_NAVIGATION_ENABLED && isSelected ? <Badge className="bg-emerald-700 text-white hover:bg-emerald-700"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{journeyText.selected}</Badge> : null}
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{hasReviewedGuidance ? text.overview : journeyText.overview}</p>
                <h1 className="mt-3 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-primary sm:text-4xl lg:text-5xl">{response.career.title}</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{response.career.summary}</p>
                {((MVP_NAVIGATION_ENABLED && hasReviewedGuidance) || studyLink) && <div className="mt-6 flex flex-wrap gap-3">
                  {MVP_NAVIGATION_ENABLED && hasReviewedGuidance ? <Button size="lg" className="w-fit rounded-lg" onClick={() => setConversationOpen(true)}><MessageCircleMore className="mr-2 h-4 w-4" />{text.conversation}</Button> : null}
                  {studyLink}
                </div>}
              </div>

              {MVP_NAVIGATION_ENABLED && area ? <DirectionImage directionId={area.id} /> : null}
                {!MVP_NAVIGATION_ENABLED ? <div className="flex flex-col gap-3 lg:pb-1">
              {returnAreaId && from !== 'explore' && from !== 'dashboard' ? <Button asChild size="lg" className="rounded-full"><Link href={backHref}>{journeyText.continue}</Link></Button> : null}
                <Button size="lg" className="rounded-full" variant={isSelected ? 'outline' : 'default'} disabled={selectionUpdating} onClick={() => void updateSelection()}>
                  {isSelected ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{isSelected ? journeyText.remove : journeyText.add}
                </Button>
                {hasReviewedGuidance ? <Button size="lg" variant="ghost" className="rounded-full" onClick={() => setConversationOpen(true)}>
                  <MessageCircleMore className="mr-2 h-4 w-4" />{text.conversation}
                </Button> : null}

                {selectionError ? <p role="alert" className="text-sm font-medium text-destructive">{selectionError}</p> : null}
              </div> : null}
            </div>
          </div>
        </section>
        {editorialImage ? (
          <figure className="border-b border-border bg-muted/20">
            <div className="relative h-64 overflow-hidden sm:h-80 lg:h-[22rem]">
              <Image unoptimized fill priority alt="" src={editorialImage} sizes="100vw" className="object-cover object-center" />
            </div>
            {editorialCaption ? (
              <figcaption className="mx-auto max-w-7xl px-4 py-3 text-sm leading-6 text-muted-foreground sm:px-6">
                {editorialCaption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
        <DreamCareerStudentGuide response={response} locale={guideLocale} showCourseOptions={!studyLink} onRetryRelationship={(subsection) => void retryRelationship(subsection)} retryingRelationships={retryingRelationships} />
      </main>
      <Footer />
      <SlideshowOverlay isOpen={conversationOpen} onClose={() => setConversationOpen(false)} slides={conversationSlides} />
    </div>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className={styles.surface}><Header /><main>{children}</main><Footer /></div>;
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
