"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, LockKeyhole, MapPin } from "lucide-react";

import LocationInput from "@/components/assessment/LocationInput";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { loadDiscoveryResult, localizeDiscoveryResult, type DiscoveryResult } from "@/lib/assessment-v2";
import { savePendingDiscoveryToAccount } from "@/lib/discovery-save";
import { getStateDetails, getStates } from "@/lib/firebase/location";
import {
  emptyPathwayProfile,
  localizePathwayValue,
  loadPathwayProfile,
  savePathwayProfile,
  type PathwayProfileDraft,
} from "@/lib/pathway-profile";
import { loadDirectionPlan, type DirectionPlan } from "@/lib/direction";
import { isDirectionPlanCompatible } from "@/lib/exploration-access";

const copy = {
  "en": {
    "eyebrow": "My details",
    "title": "Where do you live and study?",
    "description": "We use these details to show schools, colleges, courses, and scholarships that may suit you.",
    "state": "State",
    "district": "District",
    "city": "Nearest major city",
    "board": "School board",
    "language": "Language for studying",
    "location": "Where are you open to studying?",
    "affordability": "What fees can your family consider?",
    "scholarship": "Would you like scholarship options?",
    "select": "Select an option",
    "continue": "Save and continue",
    "required": "Complete every field to continue.",
    "loading": "Loading location options…",
    "ready": "Save these details",
    "readyDescription": "Save these details to use them on your My Career Path screen.",
    "saving": "Saving…",
    "save": "Save changes",
    "signup": "Create account and save",
    "back": "Back",
    "saved": "Your details are saved.",
    "dashboard": "Back to My Career Path",
    "saveFailed": "We could not save your details yet. They are still safe on this device—please try again.",
    "privacy": "Your location and budget only change the study options we show you.",
    "prerequisite": "Choose a Career Direction and at least one Dream Career first.",
    "prerequisiteAction": "See my assessment results",
    "careerArea": "Career Direction",
    "studyDetails": "Study details",
    "locationError": "Some district or city suggestions are unavailable. You can enter your details.",
    "retry": "Try again"
  },
  "ml": {
    "eyebrow": "എന്റെ വിവരങ്ങൾ",
    "title": "നിങ്ങൾ എവിടെയാണ് താമസിക്കുകയും പഠിക്കുകയും ചെയ്യുന്നത്?",
    "description": "നിങ്ങൾക്ക് യോജിച്ച സ്കൂളുകളും കോളേജുകളും കോഴ്‌സുകളും സ്കോളർഷിപ്പുകളും കാണിക്കാനാണ് ഈ വിവരങ്ങൾ.",
    "state": "ഇപ്പോഴത്തെ സംസ്ഥാനം",
    "district": "ജില്ല",
    "city": "അടുത്തുള്ള പ്രധാന നഗരം",
    "board": "വിദ്യാഭ്യാസ ബോർഡ്",
    "language": "പഠിക്കാനുള്ള ഭാഷ",
    "location": "എവിടെയൊക്കെ പഠിക്കാൻ തയ്യാറാണ്?",
    "affordability": "നിങ്ങളുടെ കുടുംബത്തിന് പരിഗണിക്കാവുന്ന ഫീസ് എത്ര?",
    "scholarship": "സ്കോളർഷിപ്പ് ഓപ്ഷനുകൾ കാണണോ?",
    "select": "ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കൂ",
    "continue": "സൂക്ഷിച്ച് തുടരുക",
    "required": "തുടരാൻ എല്ലാ വിവരങ്ങളും പൂർത്തിയാക്കൂ.",
    "loading": "സ്ഥല ഓപ്ഷനുകൾ ലോഡ് ചെയ്യുന്നു…",
    "ready": "ഈ വിവരങ്ങൾ സേവ് ചെയ്യൂ",
    "readyDescription": "നിങ്ങളുടെ കരിയർ പ്ലാനിൽ ഉപയോഗിക്കാൻ ഈ വിവരങ്ങൾ സേവ് ചെയ്യൂ.",
    "saving": "സൂക്ഷിക്കുന്നു…",
    "save": "മാറ്റങ്ങൾ സൂക്ഷിക്കുക",
    "signup": "അക്കൗണ്ട് സൃഷ്ടിച്ച് സൂക്ഷിക്കുക",
    "back": "തിരികെ",
    "saved": "നിങ്ങളുടെ വിവരങ്ങൾ സേവ് ചെയ്തു.",
    "dashboard": "എന്റെ കരിയർ പ്ലാനിലേക്ക് മടങ്ങാം",
    "saveFailed": "വിവരങ്ങൾ ഇപ്പോൾ സൂക്ഷിക്കാനായില്ല. അവ ഈ ഉപകരണത്തിൽ സുരക്ഷിതമാണ്—വീണ്ടും ശ്രമിക്കൂ.",
    "privacy": "സ്ഥലവും ബജറ്റും ഞങ്ങൾ കാണിക്കുന്ന പഠന ഓപ്ഷനുകൾ മാത്രമാണ് മാറ്റുന്നത്.",
    "prerequisite": "ആദ്യം ഒരു കരിയർ മേഖലയും കുറഞ്ഞത് ഒരു ജോലിയും തിരഞ്ഞെടുക്കൂ.",
    "prerequisiteAction": "എന്റെ അസസ്‌മെന്റ് ഫലം കാണാം",
    "careerArea": "കരിയർ മേഖല",
    "studyDetails": "പഠന വിവരങ്ങൾ",
    "locationError": "ചില ജില്ലയുടെയോ നഗരത്തിന്റെയോ നിർദ്ദേശങ്ങൾ ലഭ്യമല്ല. നിങ്ങളുടെ വിവരങ്ങൾ ടൈപ്പ് ചെയ്യാം.",
    "retry": "വീണ്ടും ശ്രമിക്കുക"
  },
  "hi": {
    "eyebrow": "My details",
    "title": "आप कहाँ रहते और पढ़ते हैं?",
    "description": "ये details courses, colleges और practical next steps को आपके context से जोड़ती हैं।",
    "state": "State",
    "district": "District",
    "city": "City",
    "board": "Education board",
    "language": "Study language",
    "location": "आप कहाँ पढ़ना चाहेंगे?",
    "affordability": "आपकी family किस range की fees consider कर सकती है?",
    "scholarship": "क्या scholarship options चाहिए?",
    "select": "चुनें",
    "continue": "Save करके continue करें",
    "required": "आगे बढ़ने से पहले यह field complete करें।",
    "loading": "Details load हो रही हैं...",
    "ready": "Details save करें",
    "readyDescription": "इनसे आपके next steps और college suggestions बेहतर होंगे।",
    "saving": "Save हो रहा है...",
    "save": "Save details",
    "signup": "Account बनाकर save करें",
    "back": "Back",
    "saved": "आपकी details save हो गईं।",
    "dashboard": "My Career Path पर लौटें",
    "saveFailed": "Details save नहीं हो पाए। फिर try करें।",
    "privacy": "यह आपकी Career Direction नहीं बदलता। इससे planning ज्यादा useful होती है।",
    "prerequisite": "पहले Career Direction और Dream Careers चुनें।",
    "prerequisiteAction": "Career Directions खोलें",
    "careerArea": "Career Direction",
    "studyDetails": "Study details",
    "locationError": "कुछ ज़िले या शहर के सुझाव उपलब्ध नहीं हैं। आप अपनी जानकारी टाइप कर सकते हैं।",
    "retry": "फिर try करें"
  },
  "ta": {
    "eyebrow": "என் விவரங்கள்",
    "title": "நீங்கள் எங்கே வசிக்கிறீர்கள், படிக்கிறீர்கள்?",
    "description": "உங்களுக்குப் பொருத்தமான பள்ளிகள், கல்லூரிகள், படிப்புகள் மற்றும் உதவித்தொகைகளைக் காட்ட இந்த விவரங்களைப் பயன்படுத்துகிறோம்.",
    "state": "மாநிலம்",
    "district": "மாவட்டம்",
    "city": "அருகிலுள்ள பெரிய நகரம்",
    "board": "பள்ளிக் குழு",
    "language": "படிப்பதற்கான மொழி",
    "location": "எங்கே படிக்கலாம்னு இருக்கீங்க?",
    "affordability": "உங்கள் குடும்பம் என்னென்ன கட்டணங்களைச் செலுத்தலாம்?",
    "scholarship": "உங்களுக்கு உதவித்தொகை விருப்பங்கள் வேண்டுமா?",
    "select": "ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்",
    "continue": "சேமித்து தொடரவும்",
    "required": "தொடர ஒவ்வொரு புலத்தையும் பூர்த்தி செய்யவும்.",
    "loading": "இருப்பிடத் தேர்வுகள் ஏற்றப்படுகின்றன…",
    "ready": "இந்த விவரங்களை சேமிக்கவும்.",
    "readyDescription": "உங்கள் மை கேரியர் பாத் திரையில் பயன்படுத்த இந்த விவரங்களை சேமித்து வையுங்கள்.",
    "saving": "சேமிப்பு...",
    "save": "மாற்றங்களைச் சேமிக்கவும்",
    "signup": "கணக்கை உருவாக்கி சேமிக்கவும்",
    "back": "திரும்ப",
    "saved": "உங்கள் விவரங்கள் சேமிக்கப்பட்டுள்ளன.",
    "dashboard": "எனது தொழில் பாதைக்குத் திரும்பு",
    "saveFailed": "உங்களது விவரங்களை எங்களால் சேமிக்க முடியவில்லை. அவை இந்தச் சாதனத்தில் பாதுகாப்பாக உள்ளன-தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
    "privacy": "உங்கள் இருப்பிடமும் பட்ஜெட்டும் மட்டுமே நாங்கள் உங்களுக்குக் காட்டும் படிப்புத் தேர்வுகளை மாற்றி அமைக்கும்.",
    "prerequisite": "முதலில் ஒரு Career Direction மற்றும் குறைந்தது ஒரு Dream Career-ஐத் தேர்வுசெய்யுங்கள்.",
    "prerequisiteAction": "என்னோட மதிப்பீட்டு முடிவுகளை பாருங்க",
    "careerArea": "தொழில் திசை",
    "studyDetails": "படிப்பு விவரங்கள்",
    "locationError": "சில மாவட்டம் அல்லது நகரப் பரிந்துரைகள் கிடைக்கவில்லை. உங்கள் விவரங்களைத் தட்டச்சு செய்யலாம்.",
    "retry": "மீண்டும் முயற்சி செய்"
  }
} as const;

const boards = ["CBSE", "CISCE / ICSE", "State board", "IB", "Cambridge", "Other", "Not sure yet"];
const languages = ["English", "Malayalam", "Hindi", "Tamil", "Other", "Flexible"];
const locationPreferences = ["Near home", "Anywhere in my state", "Anywhere in India", "Open to studying abroad", "Not sure yet"];
const affordabilityOptions = ["Lower-cost options are important", "We can consider moderate fees", "We can compare a wide range", "I am not sure yet", "Prefer not to answer"];
const scholarshipOptions = ["Yes, show scholarships and financial aid", "Maybe, show me what is available", "Not needed right now", "Prefer not to answer"];

export default function PathwayPersonalizationPage() {
  const { locale } = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const text = copy[locale];
  const [profile, setProfile] = useState<PathwayProfileDraft>(emptyPathwayProfile);
  const [storedResult, setStoredResult] = useState<DiscoveryResult | null>(null);
  const [directionPlan, setDirectionPlan] = useState<DirectionPlan | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const result = useMemo(() => storedResult ? localizeDiscoveryResult(storedResult, locale) : null, [locale, storedResult]);
  const pursuedArea = result?.areas.find((area) => area.id === directionPlan?.areaId) ?? null;

  useEffect(() => {
    const loadedProfile = loadPathwayProfile() ?? emptyPathwayProfile;
    const savedProfile = loadedProfile.district === "Idukku"
      ? { ...loadedProfile, district: "Idukki" }
      : loadedProfile;
    setProfile(savedProfile);
    setStoredResult(loadDiscoveryResult());
    setDirectionPlan(loadDirectionPlan());
    setHydrated(true);
    Promise.all([
      getStates(),
      savedProfile.state
        ? getStateDetails(savedProfile.state)
        : Promise.resolve({ districts: [], cities: [], unavailable: false }),
    ]).then(([stateItems, details]) => {
      setStates(stateItems);
      setDistricts(details.districts);
      setCities(details.cities);
      setLocationError(Boolean(details.unavailable));
    }).finally(() => setLoadingLocations(false));
  }, []);

  const changeState = async (state: string) => {
    setProfile((current) => ({ ...current, state, district: "", city: "" }));
    setDistricts([]);
    setCities([]);
    setLocationError(false);
    if (!state) return;
    setLoadingLocations(true);
    const details = await getStateDetails(state);
    setDistricts(details.districts);
    setCities(details.cities);
    setLocationError(Boolean(details.unavailable));
    setLoadingLocations(false);
  };

  const changeDistrict = (district: string) => {
    setProfile((current) => ({ ...current, district, city: "" }));
  };

  const complete = Object.values(profile).every(Boolean);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete) return;
    savePathwayProfile(profile);
    if (!user) {
      setCompleted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const didSave = await savePendingDiscoveryToAccount(user.uid);
      if (!didSave) throw new Error(text.saveFailed);
      setSaved(true);
      router.push("/dashboard");
    } catch {
      setSaveError(text.saveFailed);
      setSaving(false);
    }
  };

  const handleAccountSave = async () => {
    if (!user) return;
    setSaveError("");
    setSaving(true);
    try {
      const didSave = await savePendingDiscoveryToAccount(user.uid);
      setSaved(didSave);
      if (!didSave) setSaveError(text.saveFailed);
    } catch {
      setSaveError(text.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7fafc]"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!result || !storedResult || !directionPlan || !directionPlan.dreamCareerIds.length || !isDirectionPlanCompatible(storedResult, directionPlan)) {
    return (
      <div className="min-h-screen bg-[#f7fafc]"><Header />
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
          <h1 className="text-2xl font-semibold text-primary">{result ? text.prerequisite : "Complete your career discovery first."}</h1>
          <Button asChild className="mt-6 rounded-full"><Link href={result ? "/assessment/discovery" : "/assessment"}>{result ? text.prerequisiteAction : "Start assessment"}</Link></Button>
        </main>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#f7fafc] text-foreground"><Header />
        <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <Card className="overflow-hidden border-primary/10 shadow-none">
            <CardContent className="p-7 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 /></div>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{saved ? text.saved : text.ready}</h1>
              {!saved ? <p className="mt-4 max-w-2xl leading-7 text-slate-600">{text.readyDescription}</p> : null}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{text.careerArea}</p>
                  <p className="mt-2 font-medium text-primary">{pursuedArea?.title}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{text.studyDetails}</p>
                  <p className="mt-2 font-medium text-primary">{profile.city}, {profile.state} · {profile.educationBoard}</p>
                </div>
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {saved ? (
                  <Button asChild className="rounded-full"><Link href="/dashboard">{text.dashboard}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                ) : user ? (
                  <Button onClick={handleAccountSave} disabled={saving} className="rounded-full">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}{saving ? text.saving : text.save}
                  </Button>
                ) : (
                  <Button asChild className="rounded-full"><Link href="/signup?saveDiscovery=1&next=%2Fassessment%2Fpathway"><LockKeyhole className="mr-2 h-4 w-4" />{text.signup}</Link></Button>
                )}
                <Button asChild variant="outline" className="rounded-full"><Link href={`/explore/areas/${directionPlan.areaId}`}><ArrowLeft className="mr-2 h-4 w-4" />{text.back}</Link></Button>
              </div>
              {saveError ? <p role="alert" className="mt-4 text-sm text-red-700">{saveError}</p> : null}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafc] text-foreground"><Header />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1 text-xs font-semibold text-primary"><MapPin className="h-3.5 w-3.5" />{text.eyebrow}</div>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-primary sm:text-5xl">{text.title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">{text.description}</p>
        <div className="mt-5 flex gap-2 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />{text.privacy}</div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border border-primary/10 bg-white p-6 sm:p-8">
          {loadingLocations ? <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{text.loading}</p> : null}
          {locationError ? <div role="alert" className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"><span>{text.locationError}</span><Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => changeState(profile.state)}>{text.retry}</Button></div> : null}
          <Field label={text.state}>
            <Choice value={profile.state} options={withCurrentValue(states, profile.state)} placeholder={text.select} onChange={changeState} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={text.district}><LocationInput value={profile.district} options={withCurrentValue(districts, profile.district)} placeholder={text.select} onChange={changeDistrict} disabled={!profile.state || loadingLocations} /></Field>
            <Field label={text.city}><LocationInput value={profile.city} options={withCurrentValue(cities, profile.city)} placeholder={text.select} onChange={(city) => setProfile({ ...profile, city })} disabled={!profile.district || loadingLocations} /></Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={text.board}><Choice value={profile.educationBoard} options={boards} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(educationBoard) => setProfile({ ...profile, educationBoard })} /></Field>
            <Field label={text.language}><Choice value={profile.studyLanguage} options={languages} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(studyLanguage) => setProfile({ ...profile, studyLanguage })} /></Field>
          </div>
          <Field label={text.location}><Choice value={profile.locationPreference} options={locationPreferences} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(locationPreference) => setProfile({ ...profile, locationPreference })} /></Field>
          <Field label={text.affordability}><Choice value={profile.affordability} options={affordabilityOptions} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(affordability) => setProfile({ ...profile, affordability })} /></Field>
          <Field label={text.scholarship}><Choice value={profile.scholarshipInterest} options={scholarshipOptions} placeholder={text.select} getLabel={(value) => localizePathwayValue(value, locale)} onChange={(scholarshipInterest) => setProfile({ ...profile, scholarshipInterest })} /></Field>
          {!complete ? <p className="text-sm text-slate-500">{text.required}</p> : null}
          {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
          <Button type="submit" disabled={!complete || saving} size="lg" className="w-full rounded-xl">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? text.saving : text.continue}
            {!saving ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function withCurrentValue(options: string[], current: string): string[] {
  return [...new Set([...(current ? [current] : []), ...options])];
}

function Choice({ value, options, placeholder, getLabel = (option) => option, onChange, disabled = false }: { value: string; options: string[]; placeholder: string; getLabel?: (value: string) => string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{getLabel(option)}</SelectItem>)}</SelectContent>
    </Select>
  );
}
