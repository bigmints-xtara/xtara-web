'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';

import type {
  CareerAdditionalTopic,
  CareerGuideQuestionId,
  CareerGuideRelationshipSubsection,
  DreamCareerGuideLocale,
  DreamCareerStudentGuideResponse,
} from '@/types/dream-career-student-guide';

type GuideLabels = {
  chapterNavigation: string;
  aboutCareer: string;
  aboutCareerIntro: string;
  howToGetThere: string;
  howToGetThereIntro: string;
  whatYouCanDoNow: string;
  whatYouCanDoNowIntro: string;
  whatYouDo: string;
  dayInLife: string;
  whyItMatters: string;
  earnings: string;
  notablePeople: string;
  relatedCareers: string;
  subjects: string;
  educationRoutes: string;
  coursesAndColleges: string;
  firstJobBridge: string;
  careerProgression: string;
  employers: string;
  opportunities: string;
  learningResources: string;
  skills: string;
  tools: string;
  entranceExams: string;
  starterActivity: string;
  seeAll: string;
  showLess: string;
  tryAgain: string;
  retryAccessiblePrefix: string;
  relationshipUnavailable: string;
  loading: string;
  unavailable: string;
  sources: string;
  verified: string;
  asOf: string;
  perMonth: string;
  perYear: string;
  closes: string;
  minutes: string;
};

const english: GuideLabels = {
  chapterNavigation: 'Career guide chapters',
  aboutCareer: 'About career',
  aboutCareerIntro: 'Understand the work, the people it helps, and what a working day can feel like.',
  howToGetThere: 'How to get there',
  howToGetThereIntro: 'See the subjects, study routes, and first steps that can lead from school to work.',
  whatYouCanDoNow: 'What I can do now',
  whatYouCanDoNowIntro: 'Start with practical learning, skills, tools, and experiences you can act on today.',
  whatYouDo: "What you'll do",
  dayInLife: 'A day in the life',
  whyItMatters: 'Why it matters',
  earnings: 'What you could earn',
  notablePeople: 'People to learn from',
  relatedCareers: 'Related careers',
  subjects: 'Subjects to focus on now',
  educationRoutes: 'Study routes',
  coursesAndColleges: 'Courses, colleges, cost',
  firstJobBridge: 'From graduation first job',
  careerProgression: 'Career progression',
  employers: 'Companies that hire for this career',
  opportunities: 'Internship opportunities',
  learningResources: 'Starter courses and online resources',
  skills: 'Skills to build',
  tools: 'Tools to learn',
  entranceExams: 'Entrance exams to consider',
  starterActivity: 'Try it week',
  seeAll: 'See all',
  showLess: 'Show less',
  tryAgain: 'Try again',
  retryAccessiblePrefix: 'Retry',
  relationshipUnavailable: 'This information is temporarily unavailable.',
  loading: 'Loading career guide',
  unavailable: 'This career guide is temporarily unavailable.',
  sources: 'Sources and evidence',
  verified: 'Verified',
  asOf: 'As of',
  perMonth: 'per month',
  perYear: 'per year',
  closes: 'Closes',
  minutes: 'minutes',
};

const labels: Record<DreamCareerGuideLocale, GuideLabels> = {
  en: english,
  ml: {
    ...english,
    chapterNavigation: 'കരിയർ ഗൈഡ് അധ്യായങ്ങൾ',
    aboutCareer: 'കരിയറിനെക്കുറിച്ച്',
    aboutCareerIntro: 'ജോലി എന്താണ്, ആരെ സഹായിക്കുന്നു, ഒരു സാധാരണ ദിവസം എങ്ങനെയായിരിക്കും എന്നിവ മനസ്സിലാക്കൂ.',
    howToGetThere: 'അവിടെ എങ്ങനെ എത്താം',
    howToGetThereIntro: 'സ്കൂളിൽ നിന്ന് ജോലിയിലേക്കുള്ള വിഷയങ്ങളും പഠനപാതകളും ആദ്യ ചുവടുകളും കാണൂ.',
    whatYouCanDoNow: 'ഇപ്പോൾ എനിക്ക് ചെയ്യാനാകുന്നത്',
    whatYouCanDoNowIntro: 'ഇന്ന് തന്നെ തുടങ്ങാവുന്ന പഠനം, കഴിവുകൾ, ഉപകരണങ്ങൾ, അനുഭവങ്ങൾ കണ്ടെത്തൂ.',
    whatYouDo: 'നിങ്ങൾ ചെയ്യുന്ന ജോലി',
    dayInLife: 'ഒരു ദിവസത്തെ ജോലി',
    whyItMatters: 'ഇത് എന്തുകൊണ്ട് പ്രധാനമാണ്',
    earnings: 'എത്ര സമ്പാദിക്കാം',
    notablePeople: 'പഠിക്കാവുന്ന ആളുകൾ',
    relatedCareers: 'ബന്ധപ്പെട്ട കരിയറുകൾ',
    subjects: 'ഇപ്പോൾ ശ്രദ്ധിക്കേണ്ട വിഷയങ്ങൾ',
    educationRoutes: 'പഠന പാതകൾ',
    coursesAndColleges: 'കോഴ്സുകൾ, കോളേജുകൾ, ചെലവ്',
    firstJobBridge: 'ബിരുദത്തിൽ നിന്ന് ആദ്യ ജോലിയിലേക്ക്',
    careerProgression: 'കരിയർ വളർച്ച',
    employers: 'ഈ കരിയറിലേക്ക് നിയമിക്കുന്ന കമ്പനികൾ',
    opportunities: 'ഇന്റേൺഷിപ്പ് അവസരങ്ങൾ',
    learningResources: 'തുടക്ക കോഴ്സുകളും ഓൺലൈൻ പഠനവും',
    skills: 'വളർത്തേണ്ട കഴിവുകൾ',
    tools: 'പഠിക്കേണ്ട ഉപകരണങ്ങൾ',
    entranceExams: 'പരിഗണിക്കേണ്ട പ്രവേശന പരീക്ഷകൾ',
    seeAll: 'എല്ലാം കാണൂ',
    showLess: 'കുറച്ച് കാണൂ',
    tryAgain: 'വീണ്ടും ശ്രമിക്കൂ',
    retryAccessiblePrefix: 'വീണ്ടും ശ്രമിക്കൂ:',
    starterActivity: 'ഈ ആഴ്ച ഇത് പരീക്ഷിക്കൂ',
    relationshipUnavailable: 'ഈ വിവരം ഇപ്പോൾ ലഭ്യമല്ല.',
    loading: 'കരിയർ ഗൈഡ് ലോഡ് ചെയ്യുന്നു',
    unavailable: 'ഈ കരിയർ ഗൈഡ് ഇപ്പോൾ ലഭ്യമല്ല.',
    sources: 'ഉറവിടങ്ങളും തെളിവുകളും',
    verified: 'പരിശോധിച്ചത്',
    asOf: 'തീയതി',
    perMonth: 'പ്രതി മാസം',
    perYear: 'പ്രതി വർഷം',
    closes: 'അവസാന തീയതി',
    minutes: 'മിനിറ്റ്',
  },
  hi: {
    ...english,
    chapterNavigation: 'करियर गाइड के अध्याय',
    aboutCareer: 'करियर के बारे में',
    aboutCareerIntro: 'काम, उससे लाभ पाने वाले लोगों और एक सामान्य कार्यदिवस को समझें।',
    howToGetThere: 'वहाँ तक कैसे पहुँचें',
    howToGetThereIntro: 'स्कूल से काम तक ले जाने वाले विषय, पढ़ाई के रास्ते और शुरुआती कदम देखें।',
    whatYouCanDoNow: 'अभी क्या कर सकता/सकती हूँ',
    whatYouCanDoNowIntro: 'आज से शुरू किए जा सकने वाले सीखने, कौशल, औज़ार और अनुभव चुनें।',
    whatYouDo: 'आप क्या करेंगे',
    dayInLife: 'एक दिन कैसा होता है',
    whyItMatters: 'यह क्यों मायने रखता है',
    earnings: 'आप कितना कमा सकते हैं',
    notablePeople: 'जिनसे सीख सकते हैं',
    relatedCareers: 'संबंधित करियर',
    subjects: 'अभी किन विषयों पर ध्यान दें',
    educationRoutes: 'पढ़ाई के रास्ते',
    coursesAndColleges: 'कोर्स, कॉलेज और लागत',
    firstJobBridge: 'ग्रेजुएशन से पहली नौकरी तक',
    careerProgression: 'करियर में आगे बढ़ना',
    employers: 'इस करियर के लिए भर्ती करने वाली कंपनियाँ',
    opportunities: 'इंटर्नशिप के अवसर',
    learningResources: 'शुरुआती कोर्स और ऑनलाइन संसाधन',
    skills: 'बनाने वाले कौशल',
    tools: 'सीखने वाले औज़ार',
    entranceExams: 'विचार करने योग्य प्रवेश परीक्षाएँ',
    seeAll: 'सभी देखें',
    showLess: 'कम दिखाएँ',
    tryAgain: 'फिर कोशिश करें',
    retryAccessiblePrefix: 'फिर कोशिश करें:',
    starterActivity: 'इस हफ़्ते इसे आज़माएँ',
    relationshipUnavailable: 'यह जानकारी अभी उपलब्ध नहीं है।',
    loading: 'करियर गाइड लोड हो रही है',
    unavailable: 'यह करियर गाइड अभी उपलब्ध नहीं है।',
    sources: 'स्रोत और प्रमाण',
    verified: 'जाँचा गया',
    asOf: 'तारीख',
    perMonth: 'प्रति माह',
    perYear: 'प्रति वर्ष',
    closes: 'अंतिम तारीख',
    minutes: 'मिनट',
  },
  ta: {
    ...english,
    chapterNavigation: 'தொழில் வழிகாட்டி அத்தியாயங்கள்',
    aboutCareer: 'தொழிலைப் பற்றி',
    aboutCareerIntro: 'வேலை, அது உதவும் மக்கள், ஒரு வழக்கமான வேலைநாள் ஆகியவற்றைப் புரிந்துகொள்ளுங்கள்.',
    howToGetThere: 'அங்கு எப்படி செல்வது',
    howToGetThereIntro: 'பள்ளியிலிருந்து வேலைக்குச் செல்ல உதவும் பாடங்கள், படிப்புப் பாதைகள், முதல் படிகளைப் பாருங்கள்.',
    whatYouCanDoNow: 'இப்போது நான் செய்யக்கூடியவை',
    whatYouCanDoNowIntro: 'இன்றே தொடங்கக்கூடிய படிப்பு, திறன்கள், கருவிகள், அனுபவங்களைத் தேர்வுசெய்யுங்கள்.',
    whatYouDo: 'நீங்கள் செய்யும் வேலை',
    dayInLife: 'ஒரு நாள் வாழ்க்கை',
    whyItMatters: 'இது ஏன் முக்கியம்',
    earnings: 'எவ்வளவு சம்பாதிக்கலாம்',
    notablePeople: 'கற்றுக்கொள்ளக்கூடிய நபர்கள்',
    relatedCareers: 'தொடர்புடைய தொழில்கள்',
    subjects: 'இப்போது கவனம் செலுத்த வேண்டிய பாடங்கள்',
    educationRoutes: 'படிப்புப் பாதைகள்',
    coursesAndColleges: 'படிப்புகள், கல்லூரிகள், செலவு',
    firstJobBridge: 'பட்டப்படிப்பிலிருந்து முதல் வேலை வரை',
    careerProgression: 'தொழில் முன்னேற்றம்',
    employers: 'இந்தத் தொழிலுக்கு ஆட்களை எடுக்கும் நிறுவனங்கள்',
    opportunities: 'பயிற்சி வாய்ப்புகள்',
    learningResources: 'தொடக்கப் படிப்புகள் மற்றும் ஆன்லைன் வளங்கள்',
    skills: 'வளர்க்க வேண்டிய திறன்கள்',
    tools: 'கற்றுக்கொள்ள வேண்டிய கருவிகள்',
    entranceExams: 'கருத்தில் கொள்ள வேண்டிய நுழைவுத் தேர்வுகள்',
    seeAll: 'அனைத்தையும் காண்க',
    showLess: 'குறைவாகக் காண்க',
    tryAgain: 'மீண்டும் முயற்சிக்கவும்',
    retryAccessiblePrefix: 'மீண்டும் முயற்சிக்கவும்:',
    starterActivity: 'இந்த வாரம் இதை முயற்சிக்கவும்',
    relationshipUnavailable: 'இந்தத் தகவல் இப்போது கிடைக்கவில்லை.',
    loading: 'தொழில் வழிகாட்டி ஏற்றப்படுகிறது',
    unavailable: 'இந்தத் தொழில் வழிகாட்டி இப்போது கிடைக்கவில்லை.',
    sources: 'ஆதாரங்களும் சான்றுகளும்',
    verified: 'சரிபார்க்கப்பட்டது',
    asOf: 'தேதி',
    perMonth: 'மாதத்திற்கு',
    perYear: 'ஆண்டிற்கு',
    closes: 'கடைசி நாள்',
    minutes: 'நிமிடங்கள்',
  },
};

export function DreamCareerStudentGuide({
  response,
  locale,
  onRetryRelationship,
  retryingRelationships = {},
}: {
  response: DreamCareerStudentGuideResponse;
  locale: DreamCareerGuideLocale;
  onRetryRelationship?: (subsection: CareerGuideRelationshipSubsection) => void;
  retryingRelationships?: Partial<Record<CareerGuideRelationshipSubsection, boolean>>;
}) {
  const text = labels[locale];
  const { guide, resolved } = response;
  const applicableExams = guide.whatYouCanDoNow.entranceExams.filter((exam) => exam.requirement !== 'notApplicable');
  const relationshipError = (subsection: CareerGuideRelationshipSubsection) => (
    response.relationshipErrors.find((error) => error.subsection === subsection)
  );
  const current = (questionId: CareerGuideQuestionId) => {
    const status = response.coverage.byQuestion[questionId]?.status;
    return status === 'available' || status === 'partial';
  };
  const subjectLabels = new Map(resolved.labels.subjects.map((item) => [item.id, item.label]));
  const skillLabels = new Map(resolved.labels.skills.map((item) => [item.id, item.label]));
  const toolLabels = new Map(resolved.labels.occupationalTools.map((item) => [item.id, item.label]));
  const subjects = guide.howToGetThere.subjects.flatMap((subject) => {
    const label = subjectLabels.get(subject.subjectId);
    return label ? [{ ...subject, label }] : [];
  });
  const skills = guide.whatYouCanDoNow.skills.flatMap((skill) => {
    const label = skillLabels.get(skill.skillId);
    return label ? [{ ...skill, label }] : [];
  });
  const tools = guide.whatYouCanDoNow.tools.flatMap((tool) => {
    const label = toolLabels.get(tool.toolId);
    return label ? [{ ...tool, label }] : [];
  });

  const relationFailure = (subsection: CareerGuideRelationshipSubsection, heading: string) => {
    const error = relationshipError(subsection);
    if (!error) return null;
    return (
      <RelationshipUnavailable
        label={heading}
        message={text.relationshipUnavailable}
        retryLabel={text.tryAgain}
        retryAccessiblePrefix={text.retryAccessiblePrefix}
        retrying={Boolean(retryingRelationships[subsection])}
        onRetry={onRetryRelationship ? () => onRetryRelationship(subsection) : undefined}
      />
    );
  };

  return (
    <div data-testid="dream-career-student-guide" className="min-w-0 bg-background text-foreground dark:bg-background">
      <nav
        aria-label={text.chapterNavigation}
        className="sticky top-0 z-20 overflow-x-auto border-y border-border/70 bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <div className="mx-auto flex w-max min-w-full max-w-5xl gap-2 py-3 sm:justify-center">
          <ChapterAnchor href="#about-career">{text.aboutCareer}</ChapterAnchor>
          <ChapterAnchor href="#how-to-get-there">{text.howToGetThere}</ChapterAnchor>
          <ChapterAnchor href="#what-you-can-do-now">{text.whatYouCanDoNow}</ChapterAnchor>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-5 pb-20">
        <GuideChapter id="about-career" title={text.aboutCareer} intro={text.aboutCareerIntro}>
          {current('whatYouDo') && (guide.aboutCareer.whatYouDo.trim() || guide.aboutCareer.activities.length) ? (
            <AnswerSection title={text.whatYouDo}>
              {guide.aboutCareer.whatYouDo.trim() ? <p>{guide.aboutCareer.whatYouDo}</p> : null}
              {guide.aboutCareer.activities.length ? (
                <ProgressiveList
                  items={guide.aboutCareer.activities}
                  labels={text}
                  renderItem={(activity) => <GuideItem title={activity.title}>{activity.description}</GuideItem>}
                />
              ) : null}
            </AnswerSection>
          ) : null}

          {current('dayInLife') && guide.aboutCareer.dayInLife.length ? (
            <AnswerSection title={text.dayInLife}>
              <ProgressiveList
                items={[...guide.aboutCareer.dayInLife].sort((left, right) => left.order - right.order)}
                labels={text}
                renderItem={(moment) => (
                  <GuideItem title={`${moment.timeLabel} · ${moment.title}`}>{moment.description}</GuideItem>
                )}
              />
            </AnswerSection>
          ) : null}

          {current('whyItMatters') && guide.aboutCareer.whyItMatters.trim() ? (
            <AnswerSection title={text.whyItMatters}><p>{guide.aboutCareer.whyItMatters}</p></AnswerSection>
          ) : null}

          {current('earnings') && guide.aboutCareer.earnings.length ? (
            <AnswerSection title={text.earnings}>
              <ProgressiveList
                items={guide.aboutCareer.earnings}
                labels={text}
                renderItem={(earning) => (
                  <GuideItem title={`${formatMoney(earning.amountMin, locale)}–${formatMoney(earning.amountMax, locale)} ${earning.period === 'month' ? text.perMonth : text.perYear}`}>
                    {enumLabel(earning.careerStage, locale)} · {earning.geography} · {text.asOf} {formatDate(earning.asOf, locale)}
                  </GuideItem>
                )}
              />
            </AnswerSection>
          ) : null}

          {current('notablePeople') && guide.aboutCareer.notablePeople.length ? (
            <AnswerSection title={text.notablePeople}>
              <ProgressiveList
                items={guide.aboutCareer.notablePeople}
                labels={text}
                renderItem={(person) => <GuideItem title={person.name}>{person.whyRelevant}</GuideItem>}
              />
            </AnswerSection>
          ) : null}

          {current('relatedCareers') && (resolved.relatedCareers.length || relationshipError('relatedCareers')) ? (
            <AnswerSection title={text.relatedCareers}>
              {resolved.relatedCareers.length ? (
                <ProgressiveList
                  items={resolved.relatedCareers}
                  labels={text}
                  renderItem={(career) => (
                    <GuideItem title={<Link className="text-primary underline-offset-4 hover:underline" href={`/explore/roles/${encodeURIComponent(career.id)}`}>{career.title}</Link>}>
                      {career.summary}
                    </GuideItem>
                  )}
                />
              ) : null}
              {relationFailure('relatedCareers', text.relatedCareers)}
            </AnswerSection>
          ) : null}

          <AdditionalTopics topics={guide.additionalTopics.filter((topic) => topic.chapter === 'aboutCareer')} response={response} labels={text} />
        </GuideChapter>

        <GuideChapter id="how-to-get-there" title={text.howToGetThere} intro={text.howToGetThereIntro}>
          {current('subjects') && subjects.length ? (
            <AnswerSection title={text.subjects}>
              <ProgressiveList
                items={subjects}
                labels={text}
                renderItem={(subject) => (
                  <GuideItem title={subject.label} meta={`${enumLabel(subject.importance, locale)} · ${subject.gradeIds.map((grade) => formatGrade(grade, locale)).join(' · ')}`}>{subject.guidance}</GuideItem>
                )}
              />
            </AnswerSection>
          ) : null}

          {current('educationRoutes') && guide.howToGetThere.educationRoutes.length ? (
            <AnswerSection title={text.educationRoutes}>
              <ProgressiveList
                items={guide.howToGetThere.educationRoutes}
                labels={text}
                renderItem={(route) => <GuideItem title={route.title} meta={enumLabel(route.routeType, locale)}>{route.description}</GuideItem>}
              />
            </AnswerSection>
          ) : null}

          {current('coursesAndColleges') && (resolved.courseOptions.length || relationshipError('courseOptions')) ? (
            <AnswerSection title={text.coursesAndColleges}>
              {resolved.courseOptions.length ? (
                <ProgressiveList
                  items={resolved.courseOptions}
                  labels={text}
                  renderItem={(option) => {
                    const location = [option.institution.city, option.institution.state, option.institution.country].filter(Boolean).join(', ');
                    return (
                      <GuideItem title={option.courseTitle} meta={location || undefined}>
                        <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/colleges/${encodeURIComponent(option.institution.id)}`}>
                          {option.institution.name}
                        </Link>
                      </GuideItem>
                    );
                  }}
                />
              ) : null}
              {relationFailure('courseOptions', text.coursesAndColleges)}
            </AnswerSection>
          ) : null}

          {current('firstJobBridge') && guide.howToGetThere.firstJobBridge.length ? (
            <AnswerSection title={text.firstJobBridge}>
              <OrderedGuideItems items={guide.howToGetThere.firstJobBridge} labels={text} />
            </AnswerSection>
          ) : null}

          {current('careerProgression') && guide.howToGetThere.careerProgression.length ? (
            <AnswerSection title={text.careerProgression}>
              <ProgressiveList
                items={[...guide.howToGetThere.careerProgression].sort((left, right) => left.order - right.order)}
                labels={text}
                renderItem={(stage) => <GuideItem title={stage.title} meta={enumLabel(stage.level, locale)}>{stage.description}</GuideItem>}
              />
            </AnswerSection>
          ) : null}

          {current('employers') && (resolved.employers.length || relationshipError('employers')) ? (
            <AnswerSection title={text.employers}>
              {resolved.employers.length ? (
                <ProgressiveList
                  items={resolved.employers}
                  labels={text}
                  renderItem={(employer) => (
                    <GuideItem
                      title={employer.website ? <a className="text-primary underline-offset-4 hover:underline" href={employer.website} target="_blank" rel="noreferrer">{employer.name}</a> : employer.name}
                      meta={`${employer.geography} · ${text.verified} ${formatDate(employer.verifiedAt, locale)}`}
                    />
                  )}
                />
              ) : null}
              {relationFailure('employers', text.employers)}
            </AnswerSection>
          ) : null}

          {current('opportunities') && (resolved.opportunities.length || relationshipError('opportunities')) ? (
            <AnswerSection title={text.opportunities}>
              {resolved.opportunities.length ? (
                <ProgressiveList
                  items={resolved.opportunities}
                  labels={text}
                  renderItem={(opportunity) => (
                    <GuideItem
                      title={opportunity.title}
                      meta={[opportunity.providerName, enumLabel(opportunity.kind, locale), opportunity.closesAt ? `${text.closes} ${formatDate(opportunity.closesAt, locale)}` : ''].filter(Boolean).join(' · ')}
                    />
                  )}
                />
              ) : null}
              {relationFailure('opportunities', text.opportunities)}
            </AnswerSection>
          ) : null}

          <AdditionalTopics topics={guide.additionalTopics.filter((topic) => topic.chapter === 'howToGetThere')} response={response} labels={text} />
        </GuideChapter>

        <GuideChapter id="what-you-can-do-now" title={text.whatYouCanDoNow} intro={text.whatYouCanDoNowIntro}>
          {current('learningResources') && (resolved.learningResources.length || relationshipError('learningResources')) ? (
            <AnswerSection title={text.learningResources}>
              {resolved.learningResources.length ? (
                <ProgressiveList
                  items={resolved.learningResources}
                  labels={text}
                  renderItem={(resource) => (
                    <GuideItem title={<a className="text-primary underline-offset-4 hover:underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>} meta={`${resource.providerName} · ${enumLabel(resource.level, locale)} · ${enumLabel(resource.cost, locale)}`} />
                  )}
                />
              ) : null}
              {relationFailure('learningResources', text.learningResources)}
            </AnswerSection>
          ) : null}

          {current('skills') && skills.length ? (
            <AnswerSection title={text.skills}>
              <ProgressiveList
                items={skills}
                labels={text}
                renderItem={(skill) => <GuideItem title={skill.label} meta={enumLabel(skill.importance, locale)}>{skill.howUsed}</GuideItem>}
              />
            </AnswerSection>
          ) : null}

          {current('tools') && tools.length ? (
            <AnswerSection title={text.tools}>
              <ProgressiveList
                items={tools}
                labels={text}
                renderItem={(tool) => <GuideItem title={tool.label} meta={enumLabel(tool.importance, locale)}>{tool.whyLearn}</GuideItem>}
              />
            </AnswerSection>
          ) : null}

          {current('entranceExams') && applicableExams.length ? (
            <AnswerSection title={text.entranceExams}>
              <ProgressiveList
                items={applicableExams}
                labels={text}
                renderItem={(exam) => <GuideItem title={<a className="text-primary underline-offset-4 hover:underline" href={exam.officialUrl} target="_blank" rel="noreferrer">{exam.name}</a>} meta={enumLabel(exam.requirement, locale)} />}
              />
            </AnswerSection>
          ) : null}

          {current('starterActivity') && guide.whatYouCanDoNow.starterActivity ? (
            <AnswerSection title={text.starterActivity}>
              <GuideItem title={guide.whatYouCanDoNow.starterActivity.title} meta={`${guide.whatYouCanDoNow.starterActivity.estimatedMinutes} ${text.minutes}`}>
                {guide.whatYouCanDoNow.starterActivity.description}
              </GuideItem>
            </AnswerSection>
          ) : null}

          <AdditionalTopics topics={guide.additionalTopics.filter((topic) => topic.chapter === 'whatYouCanDoNow')} response={response} labels={text} />
        </GuideChapter>

        {guide.sources.some((source) => source.reviewStatus === 'reviewed') ? (
          <details className="mt-12 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground open:shadow-sm sm:p-7">
            <summary className="cursor-pointer font-semibold text-foreground">{text.sources}</summary>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {guide.sources.filter((source) => source.reviewStatus === 'reviewed').map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border p-4 hover:border-primary/40">
                  <span className="font-medium text-foreground">{source.label}</span>
                  <span className="mt-1 block">{source.organization}</span>
                  {source.lastVerifiedAt ? <span className="mt-2 block text-xs">{text.verified} {formatDate(source.lastVerifiedAt, locale)}</span> : null}
                </a>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export function DreamCareerStudentGuideLoading({ locale }: { locale: DreamCareerGuideLocale }) {
  return (
    <div role="status" className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-muted-foreground">
      <span className="mx-auto mb-4 block h-7 w-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden />
      {labels[locale].loading}
    </div>
  );
}

export function DreamCareerStudentGuideError({ locale, onRetry }: { locale: DreamCareerGuideLocale; onRetry: () => void }) {
  const text = labels[locale];
  return (
    <div role="alert" className="mx-auto my-16 max-w-xl rounded-2xl border border-border bg-card px-6 py-8 text-center">
      <p className="text-base text-foreground">{text.unavailable}</p>
      <button type="button" className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onRetry}>
        {text.tryAgain}
      </button>
    </div>
  );
}

function ChapterAnchor({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</a>;
}

function GuideChapter({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-b border-border py-14 last:border-b-0 sm:py-20">
      <header className="max-w-3xl">
        <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-5xl">{title}</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{intro}</p>
      </header>
      <div className="mt-10 divide-y divide-border/80">{children}</div>
    </section>
  );
}

function AnswerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 py-8 first:pt-0 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] sm:gap-10 sm:py-10">
      <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">{title}</h3>
      <div className="min-w-0 text-sm leading-7 text-muted-foreground sm:text-base">{children}</div>
    </section>
  );
}

function GuideItem({ title, meta, children }: { title: ReactNode; meta?: string; children?: ReactNode }) {
  return (
    <div className="border-l-2 border-primary/20 pl-4 sm:pl-5">
      <div className="font-semibold text-foreground">{title}</div>
      {meta ? <div className="mt-1 text-xs font-medium text-muted-foreground">{meta}</div> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function ProgressiveList<Item>({ items, renderItem, labels: text, initialCount = 3 }: { items: Item[]; renderItem: (item: Item, index: number) => ReactNode; labels: GuideLabels; initialCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initialCount);
  return (
    <div>
      <div className="space-y-5">{visible.map((item, index) => <div key={itemKey(item, index)}>{renderItem(item, index)}</div>)}</div>
      {items.length > initialCount ? (
        <button type="button" className="mt-5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setExpanded((value) => !value)}>
          {expanded ? text.showLess : text.seeAll}
        </button>
      ) : null}
    </div>
  );
}

function OrderedGuideItems({ items, labels: text }: { items: Array<{ id: string; order: number; title: string; description: string }>; labels: GuideLabels }) {
  return (
    <ProgressiveList
      items={[...items].sort((left, right) => left.order - right.order)}
      labels={text}
      renderItem={(item) => <GuideItem title={`${item.order}. ${item.title}`}>{item.description}</GuideItem>}
    />
  );
}

function RelationshipUnavailable({ label, message, retryLabel, retryAccessiblePrefix, retrying, onRetry }: { label: string; message: string; retryLabel: string; retryAccessiblePrefix: string; retrying: boolean; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" aria-label={`${retryAccessiblePrefix} ${label.toLocaleLowerCase()}`} disabled={retrying} className="mt-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function AdditionalTopics({ topics, response, labels: text }: { topics: CareerAdditionalTopic[]; response: DreamCareerStudentGuideResponse; labels: GuideLabels }) {
  if (!topics.length) return null;
  const resources = new Map(
    response.coverage.byQuestion.learningResources?.status === 'stale'
      ? []
      : response.resolved.learningResources.map((resource) => [resource.id, resource]),
  );
  return <>{topics.map((topic) => (
    <AnswerSection key={topic.id} title={topic.title}>
      {topic.summary.trim() ? <p>{topic.summary}</p> : null}
      <div className="mt-4 space-y-4">
        {topic.blocks.map((block, index) => {
          if (block.type === 'paragraph') return <p key={`${topic.id}-${index}`}>{block.text}</p>;
          if (block.type === 'bullets') return <ul key={`${topic.id}-${index}`} className="list-disc space-y-2 pl-5">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
          const linked = block.resourceIds.flatMap((id) => resources.get(id) ?? []);
          if (!linked.length) return null;
          return <ProgressiveList key={`${topic.id}-${index}`} items={linked} labels={text} renderItem={(resource) => <GuideItem title={<a className="text-primary underline-offset-4 hover:underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>} meta={resource.providerName} />} />;
        })}
      </div>
    </AnswerSection>
  ))}</>;
}

function itemKey(item: unknown, index: number) {
  if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') return item.id;
  if (item && typeof item === 'object' && 'subjectId' in item && typeof item.subjectId === 'string') return item.subjectId;
  if (item && typeof item === 'object' && 'skillId' in item && typeof item.skillId === 'string') return item.skillId;
  if (item && typeof item === 'object' && 'toolId' in item && typeof item.toolId === 'string') return item.toolId;
  return index;
}

function sentenceCase(value: string) {
  const spaced = value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const localizedEnumLabels: Record<Exclude<DreamCareerGuideLocale, 'en'>, Record<string, string>> = {
  ml: {
    intern: 'ഇന്റേൺ', trainee: 'ട്രെയിനി', junior: 'ജൂനിയർ', associate: 'അസോസിയേറ്റ്', midLevel: 'മിഡ് ലെവൽ', senior: 'സീനിയർ', lead: 'ലീഡ്', manager: 'മാനേജർ', director: 'ഡയറക്ടർ', independent: 'സ്വതന്ത്രം', varies: 'വ്യത്യാസപ്പെടാം',
    core: 'പ്രധാനപ്പെട്ടത്', helpful: 'സഹായകരം', optional: 'ഐച്ഛികം', important: 'പ്രധാന്യം', useful: 'ഉപകാരപ്രദം',
    diploma: 'ഡിപ്ലോമ', degree: 'ഡിഗ്രി', vocational: 'തൊഴിൽപരിശീലനം', postgraduate: 'ബിരുദാനന്തര പഠനം', portfolio: 'പോർട്ട്ഫോളിയോ', regulated: 'നിയന്ത്രിത പാത', apprenticeship: 'അപ്രന്റിസ്ഷിപ്പ്', other: 'മറ്റൊരു പാത',
    internship: 'ഇന്റേൺഷിപ്പ്', placement: 'പ്ലേസ്‌മെന്റ്', beginner: 'തുടക്കനില', intermediate: 'ഇടത്തരം', advanced: 'ഉന്നതനില', free: 'സൗജന്യം', paid: 'പണമടയ്ക്കണം', required: 'നിർബന്ധം', onePossibleRoute: 'സാധ്യമായ ഒരു പാത',
  },
  hi: {
    intern: 'इंटर्न', trainee: 'प्रशिक्षु', junior: 'जूनियर', associate: 'एसोसिएट', midLevel: 'मध्य स्तर', senior: 'सीनियर', lead: 'लीड', manager: 'मैनेजर', director: 'डायरेक्टर', independent: 'स्वतंत्र', varies: 'अलग हो सकता है',
    core: 'मुख्य', helpful: 'सहायक', optional: 'वैकल्पिक', important: 'महत्वपूर्ण', useful: 'उपयोगी',
    diploma: 'डिप्लोमा', degree: 'डिग्री', vocational: 'व्यावसायिक', postgraduate: 'स्नातकोत्तर', portfolio: 'पोर्टफोलियो', regulated: 'नियमित मार्ग', apprenticeship: 'अप्रेंटिसशिप', other: 'अन्य मार्ग',
    internship: 'इंटर्नशिप', placement: 'प्लेसमेंट', beginner: 'शुरुआती', intermediate: 'मध्यम', advanced: 'उन्नत', free: 'मुफ़्त', paid: 'सशुल्क', required: 'ज़रूरी', onePossibleRoute: 'एक संभावित रास्ता',
  },
  ta: {
    intern: 'பயிற்சியாளர்', trainee: 'பயிற்சி நிலை', junior: 'ஜூனியர்', associate: 'அசோசியேட்', midLevel: 'இடைநிலை', senior: 'சீனியர்', lead: 'லீட்', manager: 'மேலாளர்', director: 'இயக்குநர்', independent: 'சுயாதீனம்', varies: 'மாறுபடும்',
    core: 'முக்கியம்', helpful: 'உதவிகரம்', optional: 'விருப்பம்', important: 'முக்கியமானது', useful: 'பயனுள்ளது',
    diploma: 'டிப்ளமா', degree: 'பட்டம்', vocational: 'தொழிற்கல்வி', postgraduate: 'முதுநிலை', portfolio: 'போர்ட்ஃபோலியோ', regulated: 'ஒழுங்குமுறை பாதை', apprenticeship: 'தொழிற்பயிற்சி', other: 'மற்ற பாதை',
    internship: 'பயிற்சி', placement: 'வேலைவாய்ப்பு', beginner: 'தொடக்கநிலை', intermediate: 'இடைநிலை', advanced: 'மேம்பட்ட', free: 'இலவசம்', paid: 'கட்டணம்', required: 'கட்டாயம்', onePossibleRoute: 'ஒரு சாத்தியமான பாதை',
  },
};

function enumLabel(value: string, locale: DreamCareerGuideLocale) {
  if (locale === 'en') return sentenceCase(value);
  return localizedEnumLabels[locale][value] ?? sentenceCase(value);
}

function formatGrade(value: string, locale: DreamCareerGuideLocale) {
  const number = value.replace('grade', '');
  if (locale === 'ml') return `ക്ലാസ് ${number}`;
  if (locale === 'hi') return `कक्षा ${number}`;
  if (locale === 'ta') return `வகுப்பு ${number}`;
  return `Grade ${number}`;
}

function formatMoney(value: number, locale: DreamCareerGuideLocale) {
  const language = locale === 'ml' ? 'ml-IN' : locale === 'hi' ? 'hi-IN' : locale === 'ta' ? 'ta-IN' : 'en-IN';
  return new Intl.NumberFormat(language, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string, locale: DreamCareerGuideLocale) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const language = locale === 'ml' ? 'ml-IN' : locale === 'hi' ? 'hi-IN' : locale === 'ta' ? 'ta-IN' : 'en-IN';
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}
