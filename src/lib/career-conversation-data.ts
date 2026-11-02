import type { CareerSlideData, SlideContent } from '@/types/career';
import type { CareerGuideQuestionId, DreamCareerGuideLocale, DreamCareerStudentGuideResponse } from '@/types/dream-career-student-guide';

const copy = {
  en: { overview: 'Careers to talk about', intro: 'Which of these would you like to know more about?', work: 'What would you do?', workHelp: 'Which tasks sound interesting to you?', study: 'What would you study?', studyHelp: 'Which of these subjects or study routes would you like to explore?', skills: 'Skills you would use', skillsHelp: 'Which skill would you like to practise?', pay: 'What could you earn?', payHelp: 'Compare the place, experience level and date before comparing amounts.', activity: 'Something to try', activityHelp: 'Which activity would you like to try, and who could help?', missing: 'More details are not available yet.', next: 'Next', close: 'Close conversation', grades: 'Classes', month: 'month', year: 'year' },
  ml: { overview: 'സംസാരിക്കാനുള്ള കരിയറുകൾ', intro: 'ഇവയിൽ ഏതിനെയാണ് കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്നത്?', work: 'എന്ത് ജോലിയാണ് ചെയ്യുക?', workHelp: 'ഏത് ജോലികളാണ് നിങ്ങൾക്ക് ഇഷ്ടമാകുന്നത്?', study: 'എന്താണ് പഠിക്കേണ്ടത്?', studyHelp: 'ഏത് വിഷയമോ പഠനവഴിയോ കൂടുതൽ അറിയണം?', skills: 'ജോലിയിൽ ഉപയോഗിക്കുന്ന കഴിവുകൾ', skillsHelp: 'ഏത് കഴിവാണ് പരിശീലിക്കാൻ ആഗ്രഹിക്കുന്നത്?', pay: 'എത്ര വരുമാനം ലഭിക്കാം?', payHelp: 'തുകകൾ താരതമ്യം ചെയ്യുന്നതിന് മുമ്പ് സ്ഥലവും അനുഭവനിലയും തീയതിയും നോക്കൂ.', activity: 'ചെയ്തുനോക്കാൻ ഒരു പ്രവർത്തനം', activityHelp: 'ഏത് പ്രവർത്തനം ചെയ്യണം? ആരുടെ സഹായം തേടാം?', missing: 'കൂടുതൽ വിവരങ്ങൾ ഇപ്പോൾ ലഭ്യമല്ല.', next: 'അടുത്തത്', close: 'സംഭാഷണം അടയ്ക്കുക', grades: 'ക്ലാസുകൾ', month: 'മാസം', year: 'വർഷം' },
  hi: { overview: 'इन करियर पर बात करें', intro: 'आप किसके बारे में और जानना चाहते हैं?', work: 'आप क्या काम करेंगे?', workHelp: 'कौन-से काम आपको दिलचस्प लगते हैं?', study: 'क्या पढ़ना होगा?', studyHelp: 'किस विषय या पढ़ाई के रास्ते के बारे में और जानना चाहते हैं?', skills: 'काम में इस्तेमाल होने वाले कौशल', skillsHelp: 'आप किस कौशल का अभ्यास करना चाहते हैं?', pay: 'कितनी कमाई हो सकती है?', payHelp: 'रकम की तुलना से पहले जगह, अनुभव और तारीख देखें।', activity: 'कुछ करके देखें', activityHelp: 'आप कौन-सी गतिविधि करना चाहेंगे और कौन मदद कर सकता है?', missing: 'अधिक जानकारी अभी उपलब्ध नहीं है।', next: 'अगला', close: 'बातचीत बंद करें', grades: 'कक्षाएँ', month: 'माह', year: 'वर्ष' },
  ta: { overview: 'பேசுவதற்கான தொழில்கள்', intro: 'எதைப் பற்றி மேலும் அறிய விரும்புகிறீர்கள்?', work: 'என்ன வேலை செய்வீர்கள்?', workHelp: 'எந்தப் பணிகள் உங்களுக்கு ஆர்வமாக உள்ளன?', study: 'என்ன படிக்க வேண்டும்?', studyHelp: 'எந்தப் பாடம் அல்லது படிப்புப் பாதையை மேலும் அறிய விரும்புகிறீர்கள்?', skills: 'வேலையில் பயன்படும் திறன்கள்', skillsHelp: 'எந்தத் திறனைப் பயிற்சி செய்ய விரும்புகிறீர்கள்?', pay: 'எவ்வளவு வருமானம் கிடைக்கலாம்?', payHelp: 'தொகைகளை ஒப்பிடும் முன் இடம், அனுபவம் மற்றும் தேதியைப் பாருங்கள்.', activity: 'செய்து பார்க்க ஒரு செயல்', activityHelp: 'எதைச் செய்து பார்க்க விரும்புகிறீர்கள்? யார் உதவ முடியும்?', missing: 'மேலும் விவரங்கள் இன்னும் கிடைக்கவில்லை.', next: 'அடுத்து', close: 'உரையாடலை மூடு', grades: 'வகுப்புகள்', month: 'மாதம்', year: 'ஆண்டு' },
};
const stageLabels = {
  en: ['Intern','Trainee','Junior','Associate','Mid-career','Senior','Lead','Manager','Independent','Varies'],
  ml: ['ഇന്റേൺ','പരിശീലനത്തിൽ','തുടക്കനില','അസോസിയേറ്റ്','ഇടത്തരം അനുഭവം','സീനിയർ','ലീഡ്','മാനേജർ','സ്വതന്ത്ര ജോലി','വ്യത്യാസപ്പെടും'],
  hi: ['इंटर्न','प्रशिक्षु','शुरुआती','सहयोगी','मध्यम अनुभव','वरिष्ठ','प्रमुख','प्रबंधक','स्वतंत्र','अलग-अलग'],
  ta: ['பயிற்சிப் பணி','பயிற்சியாளர்','தொடக்க நிலை','இணை நிலை','நடுத்தர அனுபவம்','மூத்த நிலை','தலைமை','மேலாளர்','சுயதொழில்','மாறுபடும்'],
};
const stages = ['intern','trainee','junior','associate','midLevel','senior','lead','manager','independent','varies'];

/** Presentation of published guide fields only; no ranking, inferred fit or bundled career fallback. */
export function careerConversationFromGuides(responses: DreamCareerStudentGuideResponse[], locale: DreamCareerGuideLocale): CareerSlideData[] {
  const text = copy[locale];
  const work: SlideContent[] = [], study: SlideContent[] = [], skills: SlideContent[] = [], pay: SlideContent[] = [], activities: SlideContent[] = [];
  const overview: SlideContent[] = [];
  for (const response of responses) {
    const { career, guide, resolved, coverage } = response;
    const available = (id: CareerGuideQuestionId) => ['available','partial'].includes(coverage.byQuestion[id]?.status);
    const sources = (ids: string[]) => guide.sources.filter((source) => ids.includes(source.id) && source.reviewStatus === 'reviewed' && /^https?:\/\//i.test(source.url) && (!source.staleAfter || Date.parse(source.staleAfter) > Date.now())).map(({label,url}) => ({label,url}));
    const add = (target: SlideContent[], title: string, body: string, ids: string[] = []) => {
      if (body.trim()) target.push({ title: `${career.title} · ${title}`, subtitle: body, icon: 'BookOpen', sources: sources(ids) });
    };
    overview.push({title: career.title, subtitle: career.summary || text.missing, icon: 'BriefcaseBusiness'});
    if (available('whatYouDo')) {
      add(work, text.work, guide.aboutCareer.whatYouDo, coverage.byQuestion.whatYouDo?.evidence.sourceIds);
      guide.aboutCareer.activities.forEach((item) => add(work, item.title, item.description, item.sourceIds));
    }
    if (available('dayInLife')) guide.aboutCareer.dayInLife.forEach((item) => add(work, item.title, item.description, item.sourceIds));
    if (available('subjects')) guide.howToGetThere.subjects.forEach((item) => {
      const label = resolved.labels.subjects.find((entry) => entry.id === item.subjectId)?.label;
      if (label && item.guidance.trim()) add(study, label, `${item.guidance}${item.gradeIds.length ? `\n${text.grades}: ${item.gradeIds.map((grade) => grade.replace('grade','')).join(', ')}` : ''}`, item.sourceIds);
    });
    if (available('educationRoutes')) guide.howToGetThere.educationRoutes.forEach((item) => add(study, item.title, item.description, item.sourceIds));
    if (available('skills')) guide.whatYouCanDoNow.skills.forEach((item) => {
      const label = resolved.labels.skills.find((entry) => entry.id === item.skillId)?.label;
      if (label) add(skills, label, item.howUsed, item.sourceIds);
    });
    if (available('earnings')) guide.aboutCareer.earnings.forEach((item) => {
      if (!sources(item.sourceIds).length || !item.geography || !item.asOf || !Number.isFinite(item.amountMin) || !Number.isFinite(item.amountMax)) return;
      const stage = stageLabels[locale][stages.indexOf(item.careerStage)];
      if (!stage) return;
      add(pay, `${stage} · ${item.geography} · ${item.asOf}`, `${item.amountMin.toLocaleString('en-IN')}–${item.amountMax.toLocaleString('en-IN')} ${item.currency} / ${item.period === 'month' ? text.month : text.year}`, item.sourceIds);
    });
    if (available('starterActivity') && guide.whatYouCanDoNow.starterActivity) {
      const item = guide.whatYouCanDoNow.starterActivity; add(activities, item.title, item.description, item.sourceIds);
    }
  }
  const slide = (title: string, subtitle: string, content: SlideContent[]): CareerSlideData => ({ type:'meetDreamCareer',title,subtitle,content,slideIcon:'MessagesSquare',visualization:'list',buttonLabel:text.next });
  return [slide(text.overview,text.intro,overview),slide(text.work,text.workHelp,work),slide(text.study,text.studyHelp,study),slide(text.skills,text.skillsHelp,skills),slide(text.pay,text.payHelp,pay),slide(text.activity,text.activityHelp,activities)].filter((item) => item.content.length);
}
