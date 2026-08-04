import { CareerSlideData } from "@/types/career";

export interface CareerConversationCareer {
    title: string;
    summary: string;
    dailyWork: string[];
    workSetting: string;
    preparation: string;
    tryThis: string;
    difficultParts: string[];
    salaryRange?: string;
    growthOutlook?: string;
}

export interface CareerConversationInput {
    directionTitle: string;
    careers: CareerConversationCareer[];
    strengths: string[];
    courses: string[];
    locale?: "en" | "ml" | "hi" | "ta";
}

const conversationCopy = {
    en: {
        next: "Next", title: "My Career Conversation", guide: (direction: string) => `A guide for discussing ${direction} with a parent, teacher, or counsellor.`, start: "Start the conversation",
        hypotheses: "These are careers to understand and test—not permanent decisions.", why: "Why this Career Direction?", whyHelp: "Start with what the assessment noticed, then check whether it sounds accurate.",
        strengthPrompt: "Ask for a real example of when this strength showed up at school, home, or in an activity.", noticed: "What have we noticed?", noticedHelp: "Discuss interests, strengths, and experiences that may connect to this direction.",
        work: "What do these careers involve?", workHelp: "Compare the actual work, not only the job titles.", day: (career: string) => `A day in ${career}`,
        reality: "Salary, opportunity, and reality", realityHelp: "Use current, sourced information and discuss what could change over time.", salary: (career: string) => `${career}: salary`, salaryMissing: "A verified regional salary range has not been published yet.", outlook: (career: string) => `${career}: outlook`, outlookMissing: "Opportunity depends on skills, location, sector, and current demand.",
        prepare: "How could I prepare?", prepareHelp: "For Grade 8, begin with subjects, curiosity, and small experiences—not a fixed degree decision.", courseHelp: "A possible later study route to compare and verify.",
        test: "What should we test first?", testHelp: "Small activities give the family better evidence than job-title preference alone.", tryCareer: (career: string) => `Try ${career}`,
        questions: "Questions to discuss together", questionsHelp: "There is no final decision today. Agree on what to learn, try, and review next.", return: "Return to My Career Path",
        interesting: "What sounds interesting?", interestingHelp: (career: string) => `Which part of ${career} would you like to understand better?`, difficult: "What may be difficult?", difficultHelp: "Discuss time, cost, responsibility, and the kind of work involved.", try: "What will we try?", tryHelp: "Choose one lesson, game, challenge, conversation, or small project.", review: "When will we review?", reviewHelp: "Set a date to discuss what changed after gaining more experience.",
    },
    ta: {
        next: "அடுத்து", title: "என் தொழில் உரையாடல்", guide: (direction: string) => `${direction} பற்றி பெற்றோர், ஆசிரியர் அல்லது ஆலோசகருடன் கலந்துரையாடுவதற்கான வழிகாட்டி.`, start: "உரையாடலைத் தொடங்குங்கள்",
        hypotheses: "இவை நிரந்தரமான முடிவுகள் அல்ல, புரிந்து கொண்டு சோதித்துப் பார்க்க வேண்டிய தொழில் வாய்ப்புகள்.", why: "ஏன் இந்த தொழில் திசை?", whyHelp: "மதிப்பீட்டில் கண்டறியப்பட்ட விஷயத்திலிருந்து தொடங்குங்கள், பின்னர் அது சரியானதாக உள்ளதா என்று சரிபார்க்கவும்.",
        strengthPrompt: "பள்ளி, வீடு அல்லது ஒரு செயல்பாட்டில் இந்த வலிமை எப்போது வெளிப்பட்டது என்பதற்கான உண்மையான உதாரணத்தைக் கேளுங்கள்.", noticed: "நாம் என்ன கவனித்திருக்கிறோம்?", noticedHelp: "இந்தத் திசையுடன் தொடர்புடைய ஆர்வங்கள், பலங்கள் மற்றும் அனுபவங்களைப் பற்றி கலந்துரையாடுங்கள்.",
        work: "இந்த வேலைகளில் என்னென்ன அடங்கும்?", workHelp: "பதவிப் பெயர்களை மட்டும் அல்லாமல், உண்மையான அன்றாடப் பணியையும் ஒப்பிட்டுப் பாருங்கள்.", day: (career: string) => `ஒரு நாள் ${career}`,
        reality: "சம்பளம், வாய்ப்பும், யதார்த்தமும்", realityHelp: "தற்போதைய ஆதாரத் தகவல்களைப் பயன்படுத்தி, காலப்போக்கில் என்ன மாறக்கூடும் என்பதைப் பற்றி விவாதிக்கவும்.", salary: (career: string) => `${career}: சம்பளம்`, salaryMissing: "சரிபார்க்கப்பட்ட பிராந்திய சம்பள வரம்பு இன்னும் வெளியிடப்படவில்லை.", outlook: (career: string) => `${career}: கண்ணோட்டம்`, outlookMissing: "வாய்ப்பு என்பது திறன்கள், இருப்பிடம், துறை மற்றும் தற்போதைய தேவை ஆகியவற்றைப் பொறுத்தது.",
        prepare: "நான் எப்படித் தயாராக முடியும்?", prepareHelp: "8ஆம் வகுப்புக்கு, பாடங்கள், ஆர்வம் மற்றும் சிறிய அனுபவங்கள் ஆகியவற்றிலிருந்து தொடங்குங்கள்-ஒரு நிலையான தர முடிவு அல்ல.", courseHelp: "பின்னர் ஒப்பிட்டுச் சரிபார்க்கக்கூடிய ஒரு படிப்பு வழி.",
        test: "நாம் முதலில் எதைச் சோதிக்க வேண்டும்?", testHelp: "பதவிப் பெயருக்கான விருப்பத்தைவிட, சிறிய செயல்பாடுகள் குடும்பத்திற்கு பயனுள்ள ஆதாரங்களை வழங்கும்.", tryCareer: (career: string) => `${career}-ஐ முயன்று பாருங்கள்`,
        questions: "ஒன்றாகக் கலந்துரையாட வேண்டிய கேள்விகள்", questionsHelp: "இன்று இறுதி முடிவு எடுக்க வேண்டியதில்லை. அடுத்து எதைக் கற்க, முயன்று பார்க்க, மறுபரிசீலனை செய்ய வேண்டும் என்பதை ஒன்றாகத் தீர்மானியுங்கள்.", return: "எனது தொழில் பாதைக்குத் திரும்பு",
        interesting: "எது சுவாரஸ்யமாகத் தோன்றுகிறது?", interestingHelp: (career: string) => `${career} இன் எந்தப் பகுதியை நீங்கள் நன்றாகப் புரிந்து கொள்ள விரும்புகிறீர்கள்?`, difficult: "என்ன கடினமாக இருக்கலாம்?", difficultHelp: "நேரம், செலவு, பொறுப்பு மற்றும் அதில் அடங்கியுள்ள வேலைகள் குறித்து விவாதிக்கவும்.", try: "நாம் என்ன முயற்சி செய்யப் போகிறோம்?", tryHelp: "ஒரு பாடம், விளையாட்டு, சவால், உரையாடல் அல்லது சிறிய திட்டத்தைத் தேர்ந்தெடுக்கவும்.", review: "நாம் எப்போது மதிப்பாய்வு செய்வோம்?", reviewHelp: "அதிக அனுபவம் பெற்ற பிறகு என்ன மாற்றங்கள் ஏற்பட்டன என்பதைப் பற்றி விவாதிக்க ஒரு தேதியை நிர்ணயித்துக் கொள்ளுங்கள்.",
    },
    ml: {
        next: "അടുത്തത്", title: "എന്റെ കരിയർ സംഭാഷണം", guide: (direction: string) => `${direction} മേഖലയെക്കുറിച്ച് വീട്ടുകാരനോടോ അധ്യാപകനോടോ കൗൺസിലറോടോ സംസാരിക്കാനുള്ള ഗൈഡ്.`, start: "സംഭാഷണം തുടങ്ങുക",
        hypotheses: "ഇവ കൂടുതൽ അറിയാനും ചെയ്തു നോക്കാനുമുള്ള കരിയറുകളാണ്. അന്തിമ തീരുമാനങ്ങളല്ല.", why: "എന്തുകൊണ്ട് ഈ മേഖല?", whyHelp: "അസസ്‌മെന്റിൽ കണ്ട കാര്യങ്ങൾ ശരിയാണോ എന്ന് ആദ്യം നോക്കൂ.",
        strengthPrompt: "സ്കൂളിലോ വീട്ടിലോ മറ്റെവിടെയെങ്കിലുമോ ഈ കഴിവ് കാണിച്ച ഒരു യഥാർത്ഥ സംഭവം പറയൂ.", noticed: "നമ്മൾ എന്താണ് കണ്ടത്?", noticedHelp: "ഈ മേഖലയുമായി ചേരുന്ന ഇഷ്ടങ്ങളും കഴിവുകളും അനുഭവങ്ങളും ചർച്ച ചെയ്യൂ.",
        work: "ഈ ജോലികളിൽ എന്താണ് ചെയ്യുന്നത്?", workHelp: "ജോലിയുടെ പേര് മാത്രം നോക്കാതെ ദിവസവും ചെയ്യുന്ന കാര്യങ്ങൾ താരതമ്യം ചെയ്യൂ.", day: (career: string) => `${career}യുടെ ഒരു ദിവസം`,
        reality: "ശമ്പളവും ജോലി സാധ്യതയും", realityHelp: "പുതിയതും വിശ്വസിക്കാവുന്നതുമായ വിവരങ്ങൾ നോക്കൂ. കാലത്തിനനുസരിച്ച് എന്ത് മാറാം എന്നും ചർച്ച ചെയ്യൂ.", salary: (career: string) => `${career}: ശമ്പളം`, salaryMissing: "ഈ പ്രദേശത്തെ വിശ്വസിക്കാവുന്ന ശമ്പളവിവരം ഇതുവരെ ലഭ്യമല്ല.", outlook: (career: string) => `${career}: ജോലി സാധ്യത`, outlookMissing: "സ്കിൽ, സ്ഥലം, മേഖല, ഇപ്പോഴത്തെ ആവശ്യം എന്നിവ അനുസരിച്ച് അവസരം മാറും.",
        prepare: "എന്ത് പഠിക്കണം?", prepareHelp: "എട്ടാം ക്ലാസിൽ തന്നെ ഒരു ഡിഗ്രി തീരുമാനിക്കേണ്ട. ഇഷ്ടമുള്ള വിഷയങ്ങളും ചെറിയ അനുഭവങ്ങളും കൊണ്ട് തുടങ്ങൂ.", courseHelp: "പിന്നീട് താരതമ്യം ചെയ്ത് നോക്കാവുന്ന ഒരു പഠനവഴി.",
        test: "ആദ്യം എന്ത് ചെയ്തു നോക്കാം?", testHelp: "ജോലിയുടെ പേര് ഇഷ്ടപ്പെടുന്നതിനെക്കാൾ, ചെറിയൊരു കാര്യം ചെയ്തു നോക്കുന്നത് കൂടുതൽ മനസ്സിലാക്കാൻ സഹായിക്കും.", tryCareer: (career: string) => `${career} ചെയ്തു നോക്കാം`,
        questions: "ഒരുമിച്ച് സംസാരിക്കാം", questionsHelp: "ഇന്ന് അന്തിമ തീരുമാനം വേണ്ട. ഇനി എന്ത് പഠിക്കണം, ചെയ്തു നോക്കണം, വീണ്ടും പരിശോധിക്കണം എന്ന് തീരുമാനിക്കൂ.", return: "എന്റെ കരിയർ വഴിയിലേക്ക് മടങ്ങുക",
        interesting: "എന്താണ് ഇഷ്ടപ്പെട്ടത്?", interestingHelp: (career: string) => `${career}യിലെ ഏത് ഭാഗമാണ് കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്നത്?`, difficult: "എന്താണ് ബുദ്ധിമുട്ടാകുന്നത്?", difficultHelp: "സമയം, ചെലവ്, ഉത്തരവാദിത്തം, ജോലിയുടെ രീതി എന്നിവ ചർച്ച ചെയ്യൂ.", try: "നമ്മൾ എന്ത് ചെയ്തു നോക്കും?", tryHelp: "ഒരു പാഠമോ ഗെയിമോ ചലഞ്ചോ സംഭാഷണമോ ചെറിയ പ്രോജക്ടോ തിരഞ്ഞെടുക്കൂ.", review: "വീണ്ടും എപ്പോൾ നോക്കും?", reviewHelp: "കൂടുതൽ അനുഭവം കിട്ടിയ ശേഷം എന്ത് മാറിയെന്ന് സംസാരിക്കാൻ ഒരു ദിവസം തീരുമാനിക്കൂ.",
    },
    hi: {
        next: "Next",
        title: "My Career Conversation",
        guide: (direction: string) => `${direction} पर parent, teacher या counsellor से बात करने की guide.`,
        start: "Conversation शुरू करें",
        hypotheses: "ये careers समझने और test करने के लिए हैं, permanent decisions नहीं।",
        why: "यह Career Direction क्यों?",
        whyHelp: "Assessment ने interests, strengths और context में जो patterns notice किए।",
        strengthPrompt: "पूछें कि यह strength school, home या activity में कब दिखी थी।",
        noticed: "हमने क्या notice किया?",
        noticedHelp: "Interests, strengths और experiences calmly discuss करें।",
        work: "इन careers में क्या होता है?",
        workHelp: "Daily work, setting और trade-offs compare करें।",
        day: (career: string) => `${career} में एक दिन`,
        reality: "Salary, opportunity और reality",
        realityHelp: "Salary और opportunities skills, location और demand से बदलती हैं।",
        salary: (career: string) => `${career}: salary`,
        salaryMissing: "Verified regional salary range अभी published नहीं है।",
        outlook: (career: string) => `${career}: outlook`,
        outlookMissing: "Opportunity skills, location, sector और demand पर depend करती है।",
        prepare: "तैयारी कैसे करें?",
        prepareHelp: "Subjects, courses, skills और छोटे projects पर बात करें।",
        courseHelp: "Courses compare करें, लेकिन current eligibility official sources से verify करें।",
        test: "इसे कैसे test करें?",
        testHelp: "छोटा activity, project या conversation चुनें।",
        tryCareer: (career: string) => `${career} try करें`,
        questions: "पूछने लायक questions",
        questionsHelp: "Final answer लेने के बजाय better questions लेकर निकलें।",
        return: "My Career Path पर लौटें",
        interesting: "क्या interesting लगा?",
        interestingHelp: (career: string) => `${career} का कौन-सा part energy देता है?`,
        difficult: "क्या difficult लग सकता है?",
        difficultHelp: "Trade-offs पहले से समझना pressure कम करता है।",
        try: "क्या try करें?",
        tryHelp: "एक छोटा next step choose करें।",
        review: "कब review करें?",
        reviewHelp: "कुछ नया सीखने या try करने के बाद plan update करें।",
    },} as const;

/**
 * Builds a deterministic, curated conversation aid. It never calls AI and uses
 * only content already approved for the student's Career Direction and Dream Careers.
 */
export function generateCareerConversationSlides(input: CareerConversationInput): CareerSlideData[] {
    const careerNames = input.careers.map((career) => career.title).join(", ");
    const firstCareer = input.careers[0];
    const text = conversationCopy[input.locale || "en"];
    const next = text.next;
    return [
        {
            type: "meetDreamCareer",
            title: text.title,
            subtitle: text.guide(input.directionTitle),
            slideIcon: "MessagesSquare",
            buttonLabel: text.start,
            visualization: "intro",
            content: [{
                title: careerNames || input.directionTitle,
                subtitle: text.hypotheses,
                icon: "Compass",
            }],
        },
        {
            type: "whyCareerFits",
            title: text.why,
            subtitle: text.whyHelp,
            slideIcon: "Sparkles",
            buttonLabel: next,
            visualization: "bento",
            content: input.strengths.length ? input.strengths.slice(0, 4).map((strength) => ({
                title: strength,
                subtitle: text.strengthPrompt,
                icon: "CheckCircle2",
            })) : [{ title: text.noticed, subtitle: text.noticedHelp, icon: "CircleHelp" }],
        },
        {
            type: "meetDreamCareer",
            title: text.work,
            subtitle: text.workHelp,
            slideIcon: "BriefcaseBusiness",
            buttonLabel: next,
            visualization: "bento",
            content: input.careers.flatMap((career) => [{
                title: career.title,
                subtitle: career.summary,
                icon: "BriefcaseBusiness",
            }, {
                title: text.day(career.title),
                subtitle: career.dailyWork.slice(0, 3).join(" • ") || career.workSetting,
                icon: "ClipboardList",
            }]).slice(0, 6),
        },
        {
            type: "whyItMatters",
            title: text.reality,
            subtitle: text.realityHelp,
            slideIcon: "IndianRupee",
            buttonLabel: next,
            visualization: "bento",
            content: input.careers.flatMap((career) => [{
                title: text.salary(career.title),
                subtitle: career.salaryRange || text.salaryMissing,
                icon: "IndianRupee",
            }, {
                title: text.outlook(career.title),
                subtitle: career.growthOutlook || text.outlookMissing,
                icon: "TrendingUp",
            }]).slice(0, 6),
        },
        {
            type: "careerPath",
            title: text.prepare,
            subtitle: text.prepareHelp,
            slideIcon: "GraduationCap",
            buttonLabel: next,
            visualization: "bento",
            content: [
                ...input.careers.map((career) => ({ title: career.title, subtitle: career.preparation, icon: "Route" })),
                ...input.courses.slice(0, 3).map((course) => ({ title: course, subtitle: text.courseHelp, icon: "BookOpen" })),
            ].slice(0, 6),
        },
        {
            type: "realWorldExperience",
            title: text.test,
            subtitle: text.testHelp,
            slideIcon: "Gamepad2",
            buttonLabel: next,
            visualization: "bento",
            content: input.careers.map((career) => ({
                title: text.tryCareer(career.title),
                subtitle: career.tryThis,
                icon: "Puzzle",
            })),
        },
        {
            type: "futureToolkit",
            title: text.questions,
            subtitle: text.questionsHelp,
            slideIcon: "Users",
            buttonLabel: text.return,
            visualization: "bento",
            content: [
                { title: text.interesting, subtitle: text.interestingHelp(firstCareer?.title || input.directionTitle), icon: "Heart" },
                { title: text.difficult, subtitle: input.careers.flatMap((career) => career.difficultParts).slice(0, 3).join(" • ") || text.difficultHelp, icon: "TriangleAlert" },
                { title: text.try, subtitle: text.tryHelp, icon: "CheckCircle2" },
                { title: text.review, subtitle: text.reviewHelp, icon: "CalendarDays" },
            ],
        },
    ];
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy career documents have several historical, unversioned shapes. */
export const generateSlidesFromCareer = (career: any): CareerSlideData[] => {
    // Helper to safely get list
    const getList = (path: string, obj: any = career) => {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return [];
            }
        }
        return Array.isArray(current) ? current : [];
    };

    const getString = (path: string, def: string = "", obj: any = career) => {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return def;
            }
        }
        return typeof current === 'string' ? current : def;
    };

    const careerTitle = career.title || "Selected Professional";
    const matchReasoning = getString('matchReasoning', "This role appeared from signals in your earlier answers. Treat it as a question to investigate, not a verdict.");
    const traits = getList('primaryCareer.traits');
    const archetypeTags = getList('primaryCareer.archetypeTags');
    const whatYouDo = getString('whatYouDo', "You will work on important projects that grow your skills and help society.");
    const courses = getList('primaryCareer.courses');
    const relatedCareers = getList('relatedCareers');
    const notablePeople = getList('notablePeople');

    const notablePersonContext = (person: any): string => {
        const name = typeof person?.name === 'string' && person.name.trim()
            ? person.name.trim()
            : 'This public example';
        const relationship = typeof person?.relationship === 'string'
            ? person.relationship.trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
            : '';

        switch (relationship) {
            case 'same_role':
                return `${name} is listed as a public example in this role.`;
            case 'field_leader':
                return `${name} is listed as a field leader connected to this work.`;
            case 'public_service_leader':
                return `${name} is listed as a public-service leader connected to this field.`;
            case 'founder':
                return `${name} is listed as a founder connected to this field.`;
            case 'researcher':
            case 'academic':
            case 'professor':
                return `${name} is listed as a researcher or academic connected to this field, not as proof that they practise this exact role.`;
            case 'adjacent_role':
                return `${name} is listed in an adjacent role connected to this field.`;
            default:
                return `${name} is one public example to review. Check their profile to understand how their work relates to this role.`;
        }
    };

    const slides: CareerSlideData[] = [
        // 0. Key Recommendation (Intro + Confetti)
        {
            type: 'whyCareerFits',
            title: 'A role to investigate',
            subtitle: `${careerTitle} is one possibility worth learning about—not a final answer.`,
            slideIcon: 'Trophy',
            buttonLabel: 'Learn Why',
            visualization: 'intro',
            content: [
                {
                    title: `Explore ${careerTitle}`,
                    subtitle: 'Understand the daily work, test the idea, and decide what evidence you still need.',
                    icon: 'Trophy'
                }
            ]
        },
        // 1. Why this career? (Bento)
        {
            type: 'whyCareerFits',
            title: 'Why did this role appear?',
            subtitle: 'Review the signals, then decide whether they sound accurate.',
            slideIcon: 'Target',
            buttonLabel: 'Learn More',
            visualization: 'bento',
            content: [
                {
                    title: 'Signals from your answers',
                    subtitle: matchReasoning,
                    icon: 'Target'
                },
                ...(traits.length > 0 ? [{
                    title: 'Capabilities to examine',
                    subtitle: `${traits.slice(0, 3).join(', ')}${traits.length > 3 ? ` and ${traits.length - 3} more` : ''} appeared in your profile. Real activities can show whether they matter for this role.`,
                    icon: 'Sparkles'
                }] : []),
                ...(archetypeTags.length > 0 ? [{
                    title: 'Your Work Style',
                    subtitle: `${archetypeTags.slice(0,2).join(' and ')} were recorded as work-style clues. They are revisable, not permanent labels.`,
                    icon: 'Users'
                }] : [])
            ]
        },
        // 2. What will you do? (Bento)
        {
            type: 'meetDreamCareer',
            title: 'What will you do?',
            subtitle: `A simple overview of your work as a ${careerTitle}.`,
            slideIcon: 'Briefcase',
            buttonLabel: 'See Path',
            visualization: 'bento',
            content: [
                {
                    title: 'Your Mission',
                    subtitle: whatYouDo,
                    icon: 'ClipboardList'
                },
                ...(notablePeople.length > 0 ? [{
                    title: 'People to learn from',
                    subtitle: notablePersonContext(notablePeople[0]),
                    icon: 'Star'
                }] : [])
            ]
        },
        // 3. Earnings & Cost (Bento)
        {
            type: 'whyItMatters',
            title: 'Evidence to verify',
            subtitle: 'Important time-sensitive facts need a source, geography, and review date.',
            slideIcon: 'CircleDollarSign',
            buttonLabel: 'Learn What to Study',
            visualization: 'bento',
            content: [
                {
                    title: 'Salary evidence',
                    subtitle: 'Not shown until Xtara has a current, role-specific, regional source.',
                    icon: 'TrendingUp'
                },
                {
                    title: 'Opportunity outlook',
                    subtitle: 'Demand varies by role, skills, sector, location, and time. Verify it with current evidence.',
                    icon: 'ShieldCheck'
                },
                {
                    title: 'Education commitment',
                    subtitle: 'Check current entry requirements, duration, costs, and alternative routes before planning.',
                    icon: 'GraduationCap'
                }
            ]
        },
        // 4. What to study? (Grid) - Focused on Degrees with specializations
        {
            type: 'careerPath',
            title: 'What to study?',
            subtitle: 'Possible preparation routes to verify against current official requirements.',
            slideIcon: 'GraduationCap',
            buttonLabel: 'Find Colleges',
            visualization: 'bento',
            content: courses.length > 0 ? courses.flatMap((c: any) => {
                const streams = c.stream;
                const results: any[] = [];
                
                if (streams && Array.isArray(streams) && streams.length > 0) {
                    // If course has streams, create entry for each stream with specialization
                    streams.forEach((stream: any) => {
                        const streamName = stream.name || stream.display_course_name || stream.course_name;
                        const courseName = c.course || c.name || c.title || 'Degree Program';
                        
                        // Use streamName as specialization if available
                        const specialization = streamName;
                        const degreeWithSpec = specialization ? `${courseName} (${specialization})` : courseName;
                        
                        results.push({
                            title: degreeWithSpec,
                            subtitle: `${c.level} level • ${c.duration_year} years`,
                            icon: 'BookOpen'
                        });
                    });
                } else {
                    // No streams, just show the course
                    results.push({
                        title: c.course || 'Degree Program',
                        subtitle: `${c.level} level • ${c.duration_year} years`,
                        icon: 'BookOpen'
                    });
                }
                
                return results;
            }).slice(0, 4) : [
                { title: 'Pathway review needed', subtitle: 'Check current official eligibility and course information for your location.', icon: 'BookOpen' }
            ]
        },
        // 5. Other careers (Bento Grid)
        {
            type: 'whyItMatters',
            title: 'Other careers to consider',
            subtitle: 'You might also be interested in these similar paths.',
            slideIcon: 'Compass',
            buttonLabel: 'Next',
            visualization: 'bento',
            content: relatedCareers.length > 0 ? relatedCareers.slice(0, 3).map((rc: any) => {
                const description = rc.description || rc.summary || rc.why || 'A related role worth comparing by daily work and preparation route.';
                
                return {
                    title: rc.title || 'Related Career',
                    subtitle: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
                    icon: 'Briefcase'
                };
            }) : [
                { title: 'Compare a neighbouring role', subtitle: 'Look for a role in the same area with different daily work or preparation.', icon: 'Briefcase' }
            ]
        },
        // 6. How xTara helps you (Bento)
        {
            type: 'xtaraHelps',
            title: "How Xtara helps you",
            subtitle: 'Turn a career idea into questions, evidence, and a useful next step.',
            slideIcon: 'Share2',
            buttonLabel: 'Start Your Journey',
            visualization: 'bento',
            content: [
                { title: 'Explore', subtitle: 'Understand career areas and concrete roles.', icon: 'Search' },
                { title: 'Test', subtitle: 'Try a small activity before making a high-stakes choice.', icon: 'Zap' },
                { title: 'Discuss', subtitle: 'Take useful questions to a trusted adult or professional.', icon: 'Users' },
                { title: 'Review', subtitle: 'Revisit your direction when your evidence changes.', icon: 'Trophy' }
            ]
        }
    ];

    return slides;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
