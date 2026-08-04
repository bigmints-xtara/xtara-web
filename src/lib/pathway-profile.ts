import type { DiscoveryResult } from "@/lib/assessment-v2";
import type { DirectionPlan } from "@/lib/direction";
import type { Locale } from "@/i18n/config";

export const pathwayProfileStorageKey = "xtara_pathway_profile_v1";

export interface PathwayProfile {
  state: string;
  district: string;
  city: string;
  educationBoard: string;
  studyLanguage: string;
  locationPreference: string;
  affordability: string;
  scholarshipInterest: string;
  updatedAt: string;
}

export type PathwayProfileDraft = Omit<PathwayProfile, "updatedAt">;

export const emptyPathwayProfile: PathwayProfileDraft = {
  state: "",
  district: "",
  city: "",
  educationBoard: "",
  studyLanguage: "",
  locationPreference: "",
  affordability: "",
  scholarshipInterest: "",
};

const pathwayOptionLabels: Record<Locale, Record<string, string>> = {
  en: {},
  ml: {
    English: "ഇംഗ്ലീഷ്",
    Malayalam: "മലയാളം",
    Hindi: "ഹിന്ദി",
    Tamil: "തമിഴ്",
    Other: "മറ്റൊന്ന്",
    Flexible: "ഏത് ഭാഷയും",
    "State board": "സംസ്ഥാന ബോർഡ്",
    "Not sure yet": "ഇപ്പോൾ ഉറപ്പില്ല",
    "Near home": "വീട്ടിനടുത്ത്",
    "Anywhere in my state": "എന്റെ സംസ്ഥാനത്ത് എവിടെയും",
    "Anywhere in India": "ഇന്ത്യയിൽ എവിടെയും",
    "Open to studying abroad": "വിദേശപഠനവും പരിഗണിക്കാം",
    "Lower-cost options are important": "കുറഞ്ഞ ചെലവുള്ള ഓപ്ഷനുകൾ പ്രധാനമാണ്",
    "We can consider moderate fees": "മിതമായ ഫീസ് പരിഗണിക്കാം",
    "We can compare a wide range": "വിവിധ ഫീസ് നിരക്കുകൾ താരതമ്യം ചെയ്യാം",
    "I am not sure yet": "ഇപ്പോൾ ഉറപ്പില്ല",
    "Prefer not to answer": "മറുപടി നൽകാൻ താൽപ്പര്യമില്ല",
    "Yes, show scholarships and financial aid": "അതെ, സ്കോളർഷിപ്പുകളും ധനസഹായവും കാണിക്കൂ",
    "Maybe, show me what is available": "ഒരുപക്ഷേ; ലഭ്യമായവ കാണിക്കൂ",
    "Not needed right now": "ഇപ്പോൾ ആവശ്യമില്ല",
  },
  hi: {
    English: "English",
    Malayalam: "Malayalam",
    Hindi: "Hindi",
    Tamil: "Tamil",
    Other: "Other",
    Flexible: "कोई भी language",
    "State board": "State board",
    "Not sure yet": "अभी sure नहीं",
    "Near home": "घर के पास",
    "Anywhere in my state": "मेरे state में कहीं भी",
    "Anywhere in India": "India में कहीं भी",
    "Open to studying abroad": "Abroad study भी consider कर सकते हैं",
    "Lower-cost options are important": "Low-cost options important हैं",
    "We can consider moderate fees": "Moderate fees consider कर सकते हैं",
    "We can compare a wide range": "Wide range compare कर सकते हैं",
    "I am not sure yet": "मुझे अभी sure नहीं है",
    "Prefer not to answer": "Answer नहीं देना चाहता/चाहती",
    "Yes, show scholarships and financial aid": "हाँ, scholarships और financial aid दिखाएँ",
    "Maybe, show me what is available": "शायद, available options दिखाएँ",
    "Not needed right now": "अभी जरूरत नहीं",
  },
  ta: {
    "English": "ஆங்கிலம்",
    "Malayalam": "மலையாளம்",
    "Hindi": "ஹிந்தி",
    "Tamil": "தமிழ்",
    "Other": "பிற",
    "Flexible": "நெகிழ்வானது",
    "State board": "மாநில வாரியம்",
    "Not sure yet": "இன்னும் உறுதியாகத் தெரியவில்லை.",
    "Near home": "வீட்டுக்கு அருகில்",
    "Anywhere in my state": "என் மாநிலத்தில் எங்கு வேண்டுமானாலும்",
    "Anywhere in India": "இந்தியாவில் எங்கு வேண்டுமானாலும்",
    "Open to studying abroad": "வெளிநாட்டில் படிக்கத் தயார்",
    "Lower-cost options are important": "குறைந்த செலவுடைய திட்டங்கள் முக்கியம்.",
    "We can consider moderate fees": "நாங்க மிதமான கட்டணத்த மட்டும் எடுத்துக்கலாம்",
    "We can compare a wide range": "நாம் ஒரு பரந்த அளவிலானவற்றை ஒப்பிடலாம்.",
    "I am not sure yet": "எனக்கு இன்னும் உறுதியாகத் தெரியல",
    "Prefer not to answer": "பதில் சொல்ல வேண்டாம் என்று விரும்புகிறேன்.",
    "Yes, show scholarships and financial aid": "ஆமாம், உதவித்தொகை மற்றும் நிதி உதவி பற்றி காட்டுங்கள்.",
    "Maybe, show me what is available": "இருக்கலாம், என்ன இருக்கிறது என்று எனக்குக் காட்டுங்கள்.",
    "Not needed right now": "இப்போதைக்குத் தேவையில்லை",
  },
};

export function localizePathwayValue(value: string, locale: Locale): string {
  return pathwayOptionLabels[locale]?.[value] ?? value;
}

export function savePathwayProfile(profile: PathwayProfileDraft): PathwayProfile {
  const saved = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(pathwayProfileStorageKey, JSON.stringify(saved));
  window.dispatchEvent(new Event("xtara:pathway-profile-changed"));
  return saved;
}

export function loadPathwayProfile(): PathwayProfile | null {
  return parsePathwayProfile(localStorage.getItem(pathwayProfileStorageKey));
}

export function parsePathwayProfile(raw: string | null): PathwayProfile | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as PathwayProfile;
    return typeof value.state === "string"
      && typeof value.educationBoard === "string"
      && typeof value.affordability === "string"
      ? value
      : null;
  } catch {
    return null;
  }
}

export interface DiscoverySaveBundle {
  assessment: DiscoveryResult;
  pathwayProfile: PathwayProfile;
  directionPlan: DirectionPlan;
}

export function buildDiscoverySaveBundle(
  assessment: DiscoveryResult | null,
  pathwayProfile: PathwayProfile | null,
  directionPlan: DirectionPlan | null,
): DiscoverySaveBundle | null {
  return assessment && pathwayProfile && directionPlan
    ? { assessment, pathwayProfile, directionPlan }
    : null;
}
