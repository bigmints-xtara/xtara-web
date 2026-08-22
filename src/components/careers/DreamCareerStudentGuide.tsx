'use client';

import { useEffect, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react';
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
  sparseGuide: string;
};

type GuideQuestion = {
  id: string;
  title: string;
  content: ReactNode;
};

type GuideChapterModel = {
  id: string;
  number: string;
  title: string;
  intro: string;
  questions: GuideQuestion[];
};

const english: GuideLabels = {
  chapterNavigation: 'Career guide chapters',
  aboutCareer: 'About this career',
  aboutCareerIntro: 'Understand the work, the people it helps, and what a working day can feel like.',
  howToGetThere: 'How to get there',
  howToGetThereIntro: 'See the subjects, study routes, and first steps that can lead from school to work.',
  whatYouCanDoNow: 'What I can do now',
  whatYouCanDoNowIntro: 'Start with practical learning, skills, tools, and experiences you can act on today.',
  whatYouDo: 'What will I do?',
  dayInLife: 'What is a day like?',
  whyItMatters: 'Why does it matter?',
  earnings: 'How much can I earn?',
  notablePeople: 'Who can I learn from?',
  relatedCareers: 'What related careers can I pursue?',
  subjects: 'What subjects should I learn now?',
  educationRoutes: 'What can I study?',
  coursesAndColleges: 'Which courses and colleges are available?',
  firstJobBridge: 'How do I move from graduation to employment?',
  careerProgression: 'How can my career grow?',
  employers: 'Which companies hire for this career?',
  opportunities: 'Where can I find an internship?',
  learningResources: 'What other courses and online resources can I take?',
  skills: 'What skills should I develop?',
  tools: 'What tools should I learn?',
  entranceExams: 'What entrance exams should I consider?',
  starterActivity: 'What can I try this week?',
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
  sparseGuide: 'More reviewed guidance for this career is being prepared.',
};

const labels: Record<DreamCareerGuideLocale, GuideLabels> = {
  en: english,
  ml: {
    ...english,
    chapterNavigation: 'കരിയർ ഗൈഡ് അധ്യായങ്ങൾ',
    aboutCareer: 'ഈ കരിയറിനെക്കുറിച്ച്',
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
    coursesAndColleges: 'കോഴ്സുകളും കോളേജുകളും',
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
    sparseGuide: 'ഈ കരിയറിനായുള്ള കൂടുതല് പരിശോധിച്ച മാർഗ്ഗനിർദ്ദേശം തയ്യാറാക്കുന്നു.',
  },
  hi: {
    ...english,
    chapterNavigation: 'करियर गाइड के अध्याय',
    aboutCareer: 'इस करियर के बारे में',
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
    coursesAndColleges: 'कोर्स और कॉलेज',
    firstJobBridge: 'ग्रेजुएशन से पहली नौकरी तक',
    careerProgression: 'करियर में आगे बढ़ना',
    employers: 'इस करियर के लिए भर्ती करने वाली कंपनियाँ',
    opportunities: 'इंटर्नशिप के अवसर',
    learningResources: 'शुरुआती कोर्स और ऑनलाइन संसाधन',
    skills: 'विकसित करने योग्य कौशल',
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
    sparseGuide: 'इस करियर के लिए और सत्यापित मार्गदर्शन तैयार किया जा रहा है।',
  },
  ta: {
    ...english,
    chapterNavigation: 'தொழில் வழிகாட்டி அத்தியாயங்கள்',
    aboutCareer: 'இந்தத் தொழிலைப் பற்றி',
    aboutCareerIntro: 'வேலை, அது உதவும் மக்கள், ஒரு வழக்கமான வேலைநாள் ஆகியவற்றைப் புரிந்துகொள்ளுங்கள்.',
    howToGetThere: 'அங்கு எப்படி செல்வது',
    howToGetThereIntro: 'பள்ளியிலிருந்து வேலைக்குச் செல்ல உதவும் பாடங்கள், படிப்புப் பாதைகள், முதல் படிகளைப் பாருங்கள்.',
    whatYouCanDoNow: 'இப்போது நான் செய்யக்கூடியவை',
    whatYouCanDoNowIntro: 'இன்றே தொடங்கக்கூடிய படிப்பு, திறன்கள், கருவிகள், அனுபவங்களைத் தேர்வுசெய்யுங்கள்.',
    whatYouDo: 'நீங்கள் செய்யும் வேலை',
    dayInLife: 'வேலையில் ஒரு நாள்',
    whyItMatters: 'இது ஏன் முக்கியம்',
    earnings: 'எவ்வளவு சம்பாதிக்கலாம்',
    notablePeople: 'கற்றுக்கொள்ளக்கூடிய நபர்கள்',
    relatedCareers: 'தொடர்புடைய தொழில்கள்',
    subjects: 'இப்போது கவனம் செலுத்த வேண்டிய பாடங்கள்',
    educationRoutes: 'படிப்புப் பாதைகள்',
    coursesAndColleges: 'படிப்புகள் மற்றும் கல்லூரிகள்',
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
    sparseGuide: 'இந்தத் தொழிலுக்கான மேலும் சரிபார்க்கப்பட்ட வழிகாட்டுதல் தயாராக்கப்படுகிறது.',
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

  const aboutQuestions: GuideQuestion[] = [];
  const pathQuestions: GuideQuestion[] = [];
  const nowQuestions: GuideQuestion[] = [];

  if (current('whatYouDo') && (guide.aboutCareer.whatYouDo.trim() || guide.aboutCareer.activities.length)) {
    aboutQuestions.push({
      id: 'what-you-do',
      title: text.whatYouDo,
      content: (
        <>
          {guide.aboutCareer.whatYouDo.trim() ? <p>{guide.aboutCareer.whatYouDo}</p> : null}
          {guide.aboutCareer.activities.length ? (
            <ProgressiveList
              items={guide.aboutCareer.activities}
              labels={text}
              renderItem={(activity) => <GuideItem title={activity.title}>{activity.description}</GuideItem>}
            />
          ) : null}
        </>
      ),
    });
  }

  if (current('dayInLife') && guide.aboutCareer.dayInLife.length) {
    aboutQuestions.push({
      id: 'day-in-life',
      title: text.dayInLife,
      content: (
        <ProgressiveList
          items={[...guide.aboutCareer.dayInLife].sort((left, right) => left.order - right.order)}
          labels={text}
          renderItem={(moment) => (
            <GuideItem title={`${moment.timeLabel} · ${moment.title}`}>{moment.description}</GuideItem>
          )}
        />
      ),
    });
  }

  if (current('whyItMatters') && guide.aboutCareer.whyItMatters.trim()) {
    aboutQuestions.push({ id: 'why-it-matters', title: text.whyItMatters, content: <p>{guide.aboutCareer.whyItMatters}</p> });
  }

  if (current('earnings') && guide.aboutCareer.earnings.length) {
    aboutQuestions.push({
      id: 'earnings',
      title: text.earnings,
      content: (
        <ProgressiveList
          items={guide.aboutCareer.earnings}
          labels={text}
          renderItem={(earning) => (
            <GuideItem title={`${formatMoney(earning.amountMin, locale)}–${formatMoney(earning.amountMax, locale)} ${earning.period === 'month' ? text.perMonth : text.perYear}`}>
              {enumLabel(earning.careerStage, locale)} · {earning.geography} · {text.asOf} {formatDate(earning.asOf, locale)}
            </GuideItem>
          )}
        />
      ),
    });
  }

  if (current('notablePeople') && guide.aboutCareer.notablePeople.length) {
    aboutQuestions.push({
      id: 'notable-people',
      title: text.notablePeople,
      content: (
        <ProgressiveList
          items={guide.aboutCareer.notablePeople}
          labels={text}
          renderItem={(person) => <GuideItem title={person.name}>{person.whyRelevant}</GuideItem>}
        />
      ),
    });
  }

  if ((current('relatedCareers') && resolved.relatedCareers.length) || relationshipError('relatedCareers')) {
    aboutQuestions.push({
      id: 'related-careers',
      title: text.relatedCareers,
      content: (
        <>
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
        </>
      ),
    });
  }

  if (current('subjects') && subjects.length) {
    pathQuestions.push({
      id: 'subjects',
      title: text.subjects,
      content: (
        <ProgressiveList
          items={subjects}
          labels={text}
          renderItem={(subject) => (
            <GuideItem title={subject.label} meta={`${enumLabel(subject.importance, locale)} · ${subject.gradeIds.map((grade) => formatGrade(grade, locale)).join(' · ')}`}>{subject.guidance}</GuideItem>
          )}
        />
      ),
    });
  }

  if (current('educationRoutes') && guide.howToGetThere.educationRoutes.length) {
    pathQuestions.push({
      id: 'education-routes',
      title: text.educationRoutes,
      content: (
        <ProgressiveList
          items={guide.howToGetThere.educationRoutes}
          labels={text}
          renderItem={(route) => <GuideItem title={route.title} meta={enumLabel(route.routeType, locale)}>{route.description}</GuideItem>}
        />
      ),
    });
  }

  if ((current('coursesAndColleges') && resolved.courseOptions.items.length) || relationshipError('courseOptions')) {
    pathQuestions.push({
      id: 'courses-and-colleges',
      title: text.coursesAndColleges,
      content: (
        <>
          {resolved.courseOptions.items.length ? (
            <ProgressiveList
              items={resolved.courseOptions.items}
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
        </>
      ),
    });
  }

  if (current('firstJobBridge') && guide.howToGetThere.firstJobBridge.length) {
    pathQuestions.push({ id: 'first-job-bridge', title: text.firstJobBridge, content: <OrderedGuideItems items={guide.howToGetThere.firstJobBridge} labels={text} /> });
  }

  if (current('careerProgression') && guide.howToGetThere.careerProgression.length) {
    pathQuestions.push({
      id: 'career-progression',
      title: text.careerProgression,
      content: (
        <ProgressiveList
          items={[...guide.howToGetThere.careerProgression].sort((left, right) => left.order - right.order)}
          labels={text}
          renderItem={(stage) => <GuideItem title={stage.title} meta={enumLabel(stage.level, locale)}>{stage.description}</GuideItem>}
        />
      ),
    });
  }

  if ((current('employers') && resolved.employers.length) || relationshipError('employers')) {
    pathQuestions.push({
      id: 'employers',
      title: text.employers,
      content: (
        <>
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
        </>
      ),
    });
  }

  if ((current('opportunities') && resolved.opportunities.length) || relationshipError('opportunities')) {
    pathQuestions.push({
      id: 'opportunities',
      title: text.opportunities,
      content: (
        <>
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
        </>
      ),
    });
  }

  if ((current('learningResources') && resolved.learningResources.length) || relationshipError('learningResources')) {
    nowQuestions.push({
      id: 'learning-resources',
      title: text.learningResources,
      content: (
        <>
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
        </>
      ),
    });
  }

  if (current('skills') && skills.length) {
    nowQuestions.push({
      id: 'skills',
      title: text.skills,
      content: <ProgressiveList items={skills} labels={text} renderItem={(skill) => <GuideItem title={skill.label} meta={enumLabel(skill.importance, locale)}>{skill.howUsed}</GuideItem>} />,
    });
  }

  if (current('tools') && tools.length) {
    nowQuestions.push({
      id: 'tools',
      title: text.tools,
      content: <ProgressiveList items={tools} labels={text} renderItem={(tool) => <GuideItem title={tool.label} meta={enumLabel(tool.importance, locale)}>{tool.whyLearn}</GuideItem>} />,
    });
  }

  if (current('entranceExams') && applicableExams.length) {
    nowQuestions.push({
      id: 'entrance-exams',
      title: text.entranceExams,
      content: (
        <ProgressiveList
          items={applicableExams}
          labels={text}
          renderItem={(exam) => <GuideItem title={<a className="text-primary underline-offset-4 hover:underline" href={exam.officialUrl} target="_blank" rel="noreferrer">{exam.name}</a>} meta={enumLabel(exam.requirement, locale)} />}
        />
      ),
    });
  }

  if (current('starterActivity') && guide.whatYouCanDoNow.starterActivity) {
    nowQuestions.push({
      id: 'starter-activity',
      title: text.starterActivity,
      content: (
        <GuideItem title={guide.whatYouCanDoNow.starterActivity.title} meta={`${guide.whatYouCanDoNow.starterActivity.estimatedMinutes} ${text.minutes}`}>
          {guide.whatYouCanDoNow.starterActivity.description}
        </GuideItem>
      ),
    });
  }

  appendAdditionalTopics(aboutQuestions, 'aboutCareer', guide.additionalTopics, response, text);
  appendAdditionalTopics(pathQuestions, 'howToGetThere', guide.additionalTopics, response, text);
  appendAdditionalTopics(nowQuestions, 'whatYouCanDoNow', guide.additionalTopics, response, text);

  const chapters: GuideChapterModel[] = [
    { id: 'about-career', number: '01', title: text.aboutCareer, intro: text.aboutCareerIntro, questions: aboutQuestions },
    { id: 'how-to-get-there', number: '02', title: text.howToGetThere, intro: text.howToGetThereIntro, questions: pathQuestions },
    { id: 'what-you-can-do-now', number: '03', title: text.whatYouCanDoNow, intro: text.whatYouCanDoNowIntro, questions: nowQuestions },
  ].filter((chapter) => chapter.questions.length > 0);

  const reviewedSources = guide.sources.filter((source) => source.reviewStatus === 'reviewed');
  const questionEntries = chapters.flatMap((chapter) => chapter.questions.map((question) => ({ chapter, question })));
  const questionSignature = questionEntries.map(({ question }) => question.id).join('|');
  const [selectedQuestionId, setSelectedQuestionId] = useState(readQuestionHash);
  const compactLayout = useSyncExternalStore(subscribeCompactLayout, getCompactLayout, getServerCompactLayout);

  useEffect(() => {
    const syncHash = () => {
      const next = readQuestionHash();
      if (next && questionSignature.split('|').includes(next)) setSelectedQuestionId(next);
    };
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [questionSignature]);

  const selectedEntry = questionEntries.find(({ question }) => question.id === selectedQuestionId) ?? questionEntries[0];
  const activeQuestionId = selectedEntry?.question.id ?? '';
  const selectQuestion = (event: MouseEvent<HTMLAnchorElement>, questionId: string) => {
    event.preventDefault();
    setSelectedQuestionId(questionId);
    window.history.replaceState(null, '', `#guide-question-${questionId}`);
  };

  const sourcesPanel = reviewedSources.length ? (
    <details className="border-t border-border pt-6 text-sm text-muted-foreground">
      <summary className="cursor-pointer font-semibold text-foreground">{text.sources}</summary>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {reviewedSources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="border-l-2 border-border py-1 pl-4 hover:border-primary">
            <span className="font-medium text-foreground">{source.label}</span>
            <span className="mt-1 block">{source.organization}</span>
            {source.lastVerifiedAt ? <span className="mt-2 block text-xs">{text.verified} {formatDate(source.lastVerifiedAt, locale)}</span> : null}
          </a>
        ))}
      </div>
    </details>
  ) : null;

  if (!chapters.length) {
    return (
      <div data-testid="dream-career-student-guide" className="min-w-0 bg-background px-4 py-12 text-foreground dark:bg-background sm:px-6 sm:py-16">
        <p role="status" className="mx-auto max-w-3xl border-l-2 border-accent px-5 text-base leading-7 text-muted-foreground">
          {text.sparseGuide}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="dream-career-student-guide" className="min-w-0 scroll-smooth bg-background text-foreground motion-reduce:scroll-auto dark:bg-background">
      {compactLayout ? (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14" data-testid="compact-question-reader">
          <main className="min-w-0 space-y-14 sm:space-y-18">
            {chapters.map((chapter) => <GuideChapter key={chapter.id} chapter={chapter} />)}
            {sourcesPanel}
          </main>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-14 lg:py-16">
          <nav aria-label={text.chapterNavigation} className="min-w-0" data-testid="desktop-question-navigation">
            <div className="sticky top-24 space-y-8 border-r border-border/80 pr-7">
              {chapters.map((chapter) => (
                <section id={chapter.id} key={chapter.id} className="scroll-mt-24">
                  <h2 className="text-base font-semibold text-foreground">
                    <a href={`#${chapter.id}`} onClick={(event) => selectQuestion(event, chapter.questions[0].id)} className="group flex items-center gap-3 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span aria-hidden className="text-xs font-bold tracking-[0.14em] text-primary/70">{chapter.number}</span>
                      <span>{chapter.title}</span>
                    </a>
                  </h2>
                  <div className="mt-3 space-y-1 border-l border-border pl-4">
                    {chapter.questions.map((question) => (
                      <a
                        key={question.id}
                        href={`#guide-question-${question.id}`}
                        aria-current={question.id === activeQuestionId ? 'location' : undefined}
                        onClick={(event) => selectQuestion(event, question.id)}
                        className={`block rounded-lg border-l-2 px-3 py-2 text-sm leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${question.id === activeQuestionId ? 'border-primary bg-primary/5 font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        {question.title}
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <main className="min-w-0" data-testid="desktop-question-reader">
            {selectedEntry ? (
              <div data-testid="active-question-pane">
                <p className="text-xs font-bold tracking-[0.16em] text-primary/70">{selectedEntry.chapter.number} · {selectedEntry.chapter.title}</p>
                <QuestionSection question={selectedEntry.question} idSuffix="pane" />
              </div>
            ) : null}
            {sourcesPanel ? <div className="mt-14">{sourcesPanel}</div> : null}
          </main>
        </div>
      )}
    </div>
  );
}

export function DreamCareerStudentGuideLoading({ locale }: { locale: DreamCareerGuideLocale }) {
  return (
    <div role="status" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <span className="mb-6 block h-7 w-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden />
        <p className="text-sm font-semibold text-foreground">{labels[locale].loading}</p>
        <div aria-hidden className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function DreamCareerStudentGuideError({ locale, onRetry }: { locale: DreamCareerGuideLocale; onRetry: () => void }) {
  const text = labels[locale];
  return (
    <div role="alert" className="mx-auto my-12 max-w-xl px-4 sm:my-20">
      <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
      <p className="text-lg font-semibold text-foreground">{text.unavailable}</p>
      <button type="button" className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onRetry}>
        {text.tryAgain}
      </button>
      </div>
    </div>
  );
}

function GuideChapter({ chapter }: { chapter: GuideChapterModel }) {
  return (
    <section id={chapter.id} tabIndex={-1} aria-labelledby={`${chapter.id}-title`} className="scroll-mt-24 first:pt-0">
      <header className="border-b border-border pb-7">
        <p aria-hidden className="text-xs font-bold tracking-[0.16em] text-primary/70">{chapter.number}</p>
        <h2 id={`${chapter.id}-title`} className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl">{chapter.title}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{chapter.intro}</p>
      </header>
      <div className="divide-y divide-border/80">
        {chapter.questions.map((question) => <QuestionSection key={question.id} question={question} />)}
      </div>
    </section>
  );
}

function QuestionSection({ question, idSuffix = '' }: { question: GuideQuestion; idSuffix?: string }) {
  const id = `guide-question-${question.id}${idSuffix ? `-${idSuffix}` : ''}`;
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-title`} className="scroll-mt-24 py-7 sm:py-9">
      <h3 id={`${id}-title`} className="text-xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-2xl">{question.title}</h3>
      <div className="mt-4 min-w-0 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{question.content}</div>
    </section>
  );
}

function GuideItem({ title, meta, children }: { title: ReactNode; meta?: string; children?: ReactNode }) {
  return (
    <div className="border-l-2 border-border py-1 pl-4 transition-colors hover:border-primary/50">
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
      <div className="space-y-3">{visible.map((item, index) => <div key={itemKey(item, index)}>{renderItem(item, index)}</div>)}</div>
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
    <div className="border-l-2 border-muted-foreground/40 py-1 pl-4">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" aria-label={`${retryAccessiblePrefix} ${label.charAt(0).toLocaleLowerCase()}${label.slice(1)}`} disabled={retrying} className="mt-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function appendAdditionalTopics(
  questions: GuideQuestion[],
  chapter: CareerAdditionalTopic['chapter'],
  topics: CareerAdditionalTopic[],
  response: DreamCareerStudentGuideResponse,
  text: GuideLabels,
) {
  const resources = new Map(
    response.coverage.byQuestion.learningResources?.status === 'stale'
      ? []
      : response.resolved.learningResources.map((resource) => [resource.id, resource]),
  );

  for (const topic of topics.filter((item) => item.chapter === chapter)) {
    const blocks = topic.blocks.flatMap((block, index) => {
      if (block.type === 'paragraph') return block.text.trim() ? [<p key={`${topic.id}-${index}`}>{block.text}</p>] : [];
      if (block.type === 'bullets') {
        const items = block.items.filter((item) => item.trim());
        return items.length ? [<ul key={`${topic.id}-${index}`} className="list-disc space-y-2 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul>] : [];
      }
      const linked = block.resourceIds.flatMap((id) => resources.get(id) ?? []);
      if (!linked.length) return [];
      return [<ProgressiveList key={`${topic.id}-${index}`} items={linked} labels={text} renderItem={(resource) => <GuideItem title={<a className="text-primary underline-offset-4 hover:underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>} meta={resource.providerName} />} />];
    });
    if (!topic.summary.trim() && !blocks.length) continue;
    questions.push({
      id: `additional-${chapterSlug(chapter)}-${slug(topic.id)}`,
      title: topic.title,
      content: (
        <>
          {topic.summary.trim() ? <p>{topic.summary}</p> : null}
          {blocks.length ? <div className="mt-4 space-y-4">{blocks}</div> : null}
        </>
      ),
    });
  }
}

function chapterSlug(chapter: CareerAdditionalTopic['chapter']) {
  if (chapter === 'aboutCareer') return 'about';
  if (chapter === 'howToGetThere') return 'path';
  return 'now';
}

function slug(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'topic';
}

const compactLayoutQuery = '(max-width: 1023px)';

function subscribeCompactLayout(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  const media = window.matchMedia(compactLayoutQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getCompactLayout() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(compactLayoutQuery).matches
    : false;
}

function getServerCompactLayout() {
  return false;
}

function readQuestionHash() {
  if (typeof window === 'undefined') return '';
  const match = window.location.hash.match(/^#guide-question-(.+)$/);
  return match?.[1] ?? '';
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
