import type { Locale } from "@/i18n/config";

// Presentation rollout only. Existing routes, API contracts and saved data stay intact.
export const MVP_NAVIGATION_ENABLED = true;
export const MVP_DEFERRED_ROUTES = [
  "/careers", "/learn", "/play", "/achievements", "/notifications",
  "/dashboard/sparks", "/dashboard/challenges", "/dashboard/good-reads",
] as const;

export function isMvpDeferredRoute(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0];
  return MVP_NAVIGATION_ENABLED && MVP_DEFERRED_ROUTES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export const mvpNavigationCopy: Record<Locale, {
  myDirection: string; exploreCareers: string; profile: string; description: string;
  search: string; noMatches: string; loading: string; empty: string; error: string; retry: string; openCareer: string;
  unavailable: string; unavailableHelp: string; returnToDirection: string;
}> = {
  en: { myDirection: "My Direction", exploreCareers: "Explore Careers", profile: "Profile",
    description: "Explore different careers and choose what you want to learn more about.",
    search: "Search careers", noMatches: "No careers match your search.", loading: "Loading careers…", empty: "No careers are available yet. Please check again later.",
    error: "We couldn't load careers.", retry: "Try again", openCareer: "Explore career",
    unavailable: "This section isn't available in this version of Xtara.",
    unavailableHelp: "You can still explore careers and view your direction. Your saved progress has not been deleted.", returnToDirection: "Go to My Direction" },
  ml: { myDirection: "എന്റെ ദിശ", exploreCareers: "കരിയറുകൾ കണ്ടെത്താം", profile: "പ്രൊഫൈൽ",
    description: "വിവിധ കരിയറുകൾ കണ്ടെത്തൂ. കൂടുതൽ അറിയാൻ താൽപ്പര്യമുള്ളവ തിരഞ്ഞെടുക്കൂ.",
    search: "കരിയറുകൾ തിരയൂ", noMatches: "തിരച്ചിലിന് അനുയോജ്യമായ കരിയറുകൾ കണ്ടെത്തിയില്ല.", loading: "കരിയറുകൾ ലോഡ് ചെയ്യുന്നു…", empty: "ഇപ്പോൾ കരിയറുകൾ ലഭ്യമല്ല. പിന്നീട് വീണ്ടും നോക്കൂ.",
    error: "കരിയറുകൾ ലോഡ് ചെയ്യാനായില്ല.", retry: "വീണ്ടും ശ്രമിക്കൂ", openCareer: "കരിയർ അറിയാം",
    unavailable: "Xtaraയുടെ ഈ പതിപ്പിൽ ഈ വിഭാഗം ലഭ്യമല്ല.",
    unavailableHelp: "കരിയറുകൾ കണ്ടെത്താനും നിങ്ങളുടെ ദിശ കാണാനും കഴിയും. സേവ് ചെയ്ത പുരോഗതി നീക്കിയിട്ടില്ല.", returnToDirection: "എന്റെ ദിശയിലേക്ക് പോകൂ" },
  hi: { myDirection: "मेरी दिशा", exploreCareers: "करियर खोजें", profile: "प्रोफ़ाइल",
    description: "अलग-अलग करियर देखें और चुनें कि आप किसके बारे में अधिक जानना चाहते हैं।",
    search: "करियर खोजें", noMatches: "आपकी खोज से कोई करियर नहीं मिला।", loading: "करियर लोड हो रहे हैं…", empty: "अभी कोई करियर उपलब्ध नहीं है। कृपया बाद में फिर देखें।",
    error: "करियर लोड नहीं हो सके।", retry: "फिर कोशिश करें", openCareer: "करियर देखें",
    unavailable: "Xtara के इस संस्करण में यह अनुभाग उपलब्ध नहीं है।",
    unavailableHelp: "आप करियर खोज सकते हैं और अपनी दिशा देख सकते हैं। आपकी सहेजी गई प्रगति हटाई नहीं गई है।", returnToDirection: "मेरी दिशा पर जाएँ" },
  ta: { myDirection: "எனது திசை", exploreCareers: "தொழில்களை ஆராயுங்கள்", profile: "சுயவிவரம்",
    description: "பல்வேறு தொழில்களை ஆராய்ந்து, மேலும் அறிய விரும்புவதைத் தேர்ந்தெடுங்கள்.",
    search: "தொழில்களைத் தேடுங்கள்", noMatches: "உங்கள் தேடலுக்கு ஏற்ற தொழில்கள் கிடைக்கவில்லை.", loading: "தொழில்கள் ஏற்றப்படுகின்றன…", empty: "தற்போது தொழில்கள் கிடைக்கவில்லை. பின்னர் மீண்டும் பார்க்கவும்.",
    error: "தொழில்களை ஏற்ற முடியவில்லை.", retry: "மீண்டும் முயற்சிக்கவும்", openCareer: "தொழிலை ஆராயுங்கள்",
    unavailable: "Xtaraவின் இந்தப் பதிப்பில் இந்தப் பகுதி கிடைக்கவில்லை.",
    unavailableHelp: "தொழில்களை ஆராயவும் உங்கள் திசையைப் பார்க்கவும் முடியும். சேமித்த முன்னேற்றம் நீக்கப்படவில்லை.", returnToDirection: "எனது திசைக்குச் செல்லுங்கள்" },
};
