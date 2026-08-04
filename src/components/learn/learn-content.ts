import type { Story, StorySlide } from "@/lib/firebase/firestore-service";
import type { MyCareerPathExperience } from "@/lib/experience-api";

export const ROOT_SHELF_LIMIT = 5;
export const LEARN_LIBRARY_LIMIT = 30;

export type LearnSectionId = "stories" | "sparks" | "games" | "challenges" | "reads";

export type LearnItem = {
  id: string;
  contentId: string;
  title: string;
  kind: string;
  href?: string;
  story?: Story;
  opensDownload?: boolean;
  meta?: string;
  image?: string;
};

export type LearnShelf = {
  id: LearnSectionId;
  title: string;
  description: string;
  items: LearnItem[];
};

export const learnCopy = {
  en: {
    eyebrow: "My Career Path",
    title: "Learn and play",
    description: "Stories, quick lessons, games, and challenges for your goals.",
    progress: "Your learning",
    progressHelp: "Complete activities to build your learning record.",
    continue: "Continue",
    stories: "Stories for you",
    storiesHelp: "Small stories with big ideas.",
    sparks: "Sparks",
    sparksHelp: "Learn one useful idea at a time.",
    games: "Games",
    gamesHelp: "Practise skills while you play.",
    challenges: "Reading challenges",
    challengesHelp: "Try a goal and finish it.",
    reads: "Good reads",
    readsHelp: "Interesting things worth reading.",
    viewAll: "View all",
    open: "Open",
    back: "Back to Learn",
    empty: "There is nothing new here yet.",
    emptyHelp: "Try another section or check again later.",
    loadError: "We could not load this right now.",
    retry: "Try again",
  },
  ml: {
    eyebrow: "എന്റെ കരിയർ വഴി",
    title: "പഠിക്കാം, കളിക്കാം",
    description: "നിങ്ങളുടെ ലക്ഷ്യങ്ങൾക്കുള്ള കഥകൾ, ചെറിയ പാഠങ്ങൾ, ഗെയിമുകൾ, ചലഞ്ചുകൾ.",
    progress: "നിങ്ങളുടെ പഠനം",
    progressHelp: "നിങ്ങളുടെ പഠന രേഖ വളർത്താൻ പ്രവർത്തനങ്ങൾ പൂർത്തിയാക്കൂ.",
    continue: "തുടരൂ",
    stories: "നിങ്ങൾക്കുള്ള കഥകൾ",
    storiesHelp: "ചെറിയ കഥകൾ, വലിയ ആശയങ്ങൾ.",
    sparks: "സ്പാർക്സ്",
    sparksHelp: "ഓരോ തവണയും ഒരു ഉപകാരപ്രദമായ ആശയം പഠിക്കൂ.",
    games: "ഗെയിമുകൾ",
    gamesHelp: "കളിച്ചുകൊണ്ട് കഴിവുകൾ പരിശീലിക്കൂ.",
    challenges: "വായനാ ചലഞ്ചുകൾ",
    challengesHelp: "ഒരു ലക്ഷ്യം തിരഞ്ഞെടുത്ത് പൂർത്തിയാക്കൂ.",
    reads: "നല്ല വായനകൾ",
    readsHelp: "വായിക്കാൻ രസകരമായ കാര്യങ്ങൾ.",
    viewAll: "എല്ലാം കാണൂ",
    open: "തുറക്കൂ",
    back: "പഠനത്തിലേക്ക് മടങ്ങൂ",
    empty: "ഇവിടെ ഇപ്പോൾ പുതിയത് ഒന്നുമില്ല.",
    emptyHelp: "മറ്റൊരു ഭാഗം നോക്കൂ അല്ലെങ്കിൽ പിന്നീട് വീണ്ടും വരൂ.",
    loadError: "ഇത് ഇപ്പോൾ തുറക്കാനായില്ല.",
    retry: "വീണ്ടും ശ്രമിക്കൂ",
  },
  hi: {
    eyebrow: "मेरा करियर पथ",
    title: "सीखें और खेलें",
    description: "आपके लक्ष्यों के लिए कहानियाँ, छोटे पाठ, गेम और चुनौतियाँ।",
    progress: "आपकी सीख",
    progressHelp: "अपना लर्निंग रिकॉर्ड बनाने के लिए गतिविधियाँ पूरी करें।",
    continue: "जारी रखें",
    stories: "आपके लिए कहानियाँ",
    storiesHelp: "छोटी कहानियाँ, बड़े विचार।",
    sparks: "स्पार्क्स",
    sparksHelp: "एक बार में एक उपयोगी बात सीखें।",
    games: "गेम्स",
    gamesHelp: "खेलते हुए कौशल का अभ्यास करें।",
    challenges: "रीडिंग चैलेंज",
    challengesHelp: "एक लक्ष्य चुनें और पूरा करें।",
    reads: "अच्छे लेख",
    readsHelp: "पढ़ने लायक दिलचस्प चीज़ें।",
    viewAll: "सभी देखें",
    open: "खोलें",
    back: "सीखने पर वापस जाएँ",
    empty: "यहाँ अभी कुछ नया नहीं है।",
    emptyHelp: "कोई दूसरा भाग देखें या बाद में फिर आएँ।",
    loadError: "यह अभी लोड नहीं हो पाया।",
    retry: "फिर कोशिश करें",
  },
  ta: {
    eyebrow: "என் தொழில் பாதை",
    title: "கற்றலும் விளையாட்டும்",
    description: "உங்கள் இலக்குகளுக்கான கதைகள், சிறு பாடங்கள், விளையாட்டுகள், சவால்கள்.",
    progress: "உங்கள் கற்றல்",
    progressHelp: "உங்கள் கற்றல் பதிவை உருவாக்க செயல்பாடுகளை முடிக்கவும்.",
    continue: "தொடரவும்",
    stories: "உங்களுக்கான கதைகள்",
    storiesHelp: "சிறிய கதைகள், பெரிய சிந்தனைகள்.",
    sparks: "ஸ்பார்க்ஸ்",
    sparksHelp: "ஒரு நேரத்தில் ஒரு பயனுள்ள கருத்தைக் கற்றுக்கொள்ளுங்கள்.",
    games: "விளையாட்டுகள்",
    gamesHelp: "விளையாடிக்கொண்டே திறன்களைப் பயிற்சி செய்யுங்கள்.",
    challenges: "வாசிப்பு சவால்கள்",
    challengesHelp: "ஒரு இலக்கைத் தேர்ந்தெடுத்து முடிக்கவும்.",
    reads: "நல்ல வாசிப்புகள்",
    readsHelp: "படிக்கத் தகுந்த சுவாரஸ்யமான விஷயங்கள்.",
    viewAll: "அனைத்தையும் காண்க",
    open: "திறக்கவும்",
    back: "கற்றலுக்குத் திரும்பவும்",
    empty: "இங்கே இப்போது புதிதாக எதுவும் இல்லை.",
    emptyHelp: "வேறு பகுதியைப் பாருங்கள் அல்லது பின்னர் மீண்டும் வாருங்கள்.",
    loadError: "இதை இப்போது ஏற்ற முடியவில்லை.",
    retry: "மீண்டும் முயற்சிக்கவும்",
  },
} as const;

export type LearnCopy = (typeof learnCopy)[keyof typeof learnCopy];

const groupBySection: Record<LearnSectionId, string> = {
  stories: "stories",
  sparks: "lessons",
  games: "games",
  challenges: "challenges",
  reads: "reads",
};

export function buildLearnShelves(
  experience: MyCareerPathExperience,
  text: LearnCopy,
): LearnShelf[] {
  const specs: Array<[LearnSectionId, string, string]> = [
    ["stories", text.stories, text.storiesHelp],
    ["sparks", text.sparks, text.sparksHelp],
    ["games", text.games, text.gamesHelp],
    ["challenges", text.challenges, text.challengesHelp],
    ["reads", text.reads, text.readsHelp],
  ];

  return specs.map(([id, title, description]) => {
    const group = experience.contentGroups.find((candidate) => candidate.id === groupBySection[id]);
    const library = experience.contentLibraries?.find((candidate) => candidate.id === groupBySection[id]);
    const records = group?.items.length ? group.items : library?.items ?? [];
    return {
      id,
      title,
      description,
      items: records.map((record) => toLearnItem(id, title, record)),
    };
  });
}

export function findRecommendedItem(
  experience: MyCareerPathExperience,
  shelves: LearnShelf[],
): LearnItem | null {
  const recommendation = experience.nextBest;
  if (!recommendation) return null;
  const action = recommendation.action;
  if (action.type !== "open_content") return null;
  const section = (Object.entries(groupBySection) as Array<[LearnSectionId, string]>)
    .find(([, group]) => group === action.contentGroupId)?.[0];
  return shelves
    .find((shelf) => shelf.id === section)
    ?.items.find((item) => item.contentId === action.contentId) ?? null;
}

function toLearnItem(
  section: LearnSectionId,
  kind: string,
  record: Record<string, unknown> & { id: string; title: string },
): LearnItem {
  const title = cleanTitle(record.title);
  if (section === "stories") {
    return {
      id: `story-${record.id}`,
      contentId: record.id,
      title,
      kind,
      story: normalizeStory(record),
      image: stringValue(record.image),
    };
  }
  if (section === "sparks") {
    return { id: `spark-${record.id}`, contentId: record.id, title, kind, href: `/dashboard/sparks/${record.id}`, image: stringValue(record.image) };
  }
  if (section === "games") {
    return { id: `game-${record.id}`, contentId: record.id, title, kind, opensDownload: true, meta: stringValue(record.mode), image: stringValue(record.image) };
  }
  if (section === "challenges") {
    const points = Number(record.points);
    return { id: `challenge-${record.id}`, contentId: record.id, title, kind, href: "/dashboard/challenges", meta: Number.isFinite(points) && points > 0 ? `${points} points` : undefined, image: stringValue(record.image) };
  }
  return { id: `read-${record.id}`, contentId: record.id, title, kind, href: `/dashboard/good-reads/${record.id}`, image: stringValue(record.image) };
}

function normalizeStory(record: Record<string, unknown> & { id: string; title: string }): Story {
  return {
    id: record.id,
    title: cleanTitle(record.title),
    description: stringValue(record.description) ?? "",
    image: stringValue(record.image) ?? "",
    category: stringValue(record.category) ?? "",
    career_clusters: stringArray(record.career_clusters ?? record.careerClusters),
    slides: Array.isArray(record.slides)
      ? record.slides.map(normalizeSlide).filter((slide): slide is StorySlide => slide !== null)
      : [],
  };
}

function normalizeSlide(value: unknown): StorySlide | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = stringValue(record.title);
  if (!title) return null;
  return {
    title,
    description: stringValue(record.description ?? record.content) ?? "",
    image: stringValue(record.image),
    hyperlink: stringValue(record.hyperlink),
    hyperlinkText: stringValue(record.hyperlinkText),
    date: stringValue(record.date),
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function cleanTitle(title: string) {
  return title.replace(/\s+-\s+[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}$/, "");
}
