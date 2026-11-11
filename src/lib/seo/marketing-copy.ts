import type { Locale } from "@/i18n/config";

type MarketingMetadata = Record<Locale, { title: string; description: string }>;

export const homeMetadata = {
  title: "Career Guidance for Students in India | Xtara",
  description: "Explore Career Directions, discover Dream Careers, and build a practical plan with Xtara. Career guidance for students in India from Grade 8 onward.",
};

export const explorerMetadata: MarketingMetadata = {
  en: {
    title: "Explore Career Directions and Dream Careers | Xtara",
    description: "Explore career options for students in India. Discover Career Directions, see how different roles connect, and find careers you want to learn more about.",
  },
  ml: {
    title: "കരിയർ ദിശകളും സ്വപ്ന കരിയറുകളും കണ്ടെത്താം | Xtara",
    description: "ഇന്ത്യയിലെ വിദ്യാർത്ഥികൾക്കുള്ള കരിയർ സാധ്യതകൾ കണ്ടെത്തൂ. വിവിധ കരിയർ ദിശകളും ജോലികളും പരിചയപ്പെടൂ.",
  },
  hi: {
    title: "करियर की दिशाएँ और सपनों के करियर खोजें | Xtara",
    description: "भारत के छात्रों के लिए करियर विकल्प देखें। अलग-अलग करियर दिशाओं और भूमिकाओं के बारे में जानें।",
  },
  ta: {
    title: "தொழில் திசைகளையும் கனவுத் தொழில்களையும் ஆராயுங்கள் | Xtara",
    description: "இந்திய மாணவர்களுக்கான தொழில் வாய்ப்புகளை ஆராயுங்கள். வெவ்வேறு தொழில் திசைகளையும் பணிகளையும் பற்றி அறியுங்கள்.",
  },
};

export const educatorMetadata: MarketingMetadata = {
  en: {
    title: "Career Guidance for Educators and Schools | Xtara",
    description: "Help students from Grade 8 onward explore careers through guided assessments, Career Directions, and Dream Careers.",
  },
  ml: {
    title: "അധ്യാപകർക്കും സ്കൂളുകൾക്കുമുള്ള കരിയർ മാർഗ്ഗനിർദ്ദേശം | Xtara",
    description: "എട്ടാം ക്ലാസ് മുതലുള്ള വിദ്യാർത്ഥികൾക്ക് താൽപ്പര്യങ്ങളും കരിയർ സാധ്യതകളും മനസ്സിലാക്കാൻ സഹായിക്കൂ.",
  },
  hi: {
    title: "शिक्षकों और स्कूलों के लिए करियर मार्गदर्शन | Xtara",
    description: "कक्षा 8 से आगे के छात्रों को अपनी रुचियाँ समझने और करियर विकल्प तलाशने में मदद करें।",
  },
  ta: {
    title: "ஆசிரியர்களுக்கும் பள்ளிகளுக்கும் தொழில் வழிகாட்டுதல் | Xtara",
    description: "8ஆம் வகுப்பு முதல் மாணவர்கள் தங்கள் ஆர்வங்களையும் தொழில் வாய்ப்புகளையும் அறிய உதவுங்கள்.",
  },
};
