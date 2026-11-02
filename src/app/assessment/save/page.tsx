'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import styles from '@/components/journey/journey.module.css';
import JourneySteps from '@/components/journey/JourneySteps';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { loadDiscoveryResult } from '@/lib/assessment-v2';
import { loadDirectionPlan, type DirectionPlan } from '@/lib/direction';
import { hydrateDiscoveryFromAccount, savePendingCareerChoiceToAccount } from '@/lib/discovery-save';
import { getPublishedCareerCatalog } from '@/lib/curated-career-api';
import { isDirectionPlanCompatible } from '@/lib/exploration-access';

const copy = {
  en: { title: 'Save your choices', description: 'These are the careers you want to explore. You can change them later.', direction: 'Your direction', careers: 'Your careers', back: 'Back to careers', save: 'Save my choices', saving: 'Saving…', guest: 'Create an account to keep your choices and return to them later.', login: 'Already have an account? Log in', loading: 'Loading your choices…', error: 'We couldn’t load your choices.', failed: 'We couldn’t save your choices. Please try again.', retry: 'Try again', empty: 'Choose a career before saving.', results: 'Back to your results' },
  ml: { title: 'നിങ്ങളുടെ തിരഞ്ഞെടുപ്പുകൾ സേവ് ചെയ്യൂ', description: 'കൂടുതൽ അറിയാൻ നിങ്ങൾ തിരഞ്ഞെടുത്ത കരിയറുകളാണിവ. പിന്നീട് മാറ്റാം.', direction: 'നിങ്ങളുടെ ദിശ', careers: 'നിങ്ങളുടെ കരിയറുകൾ', back: 'കരിയറുകളിലേക്ക് മടങ്ങൂ', save: 'എന്റെ തിരഞ്ഞെടുപ്പുകൾ സേവ് ചെയ്യൂ', saving: 'സേവ് ചെയ്യുന്നു…', guest: 'തിരഞ്ഞെടുപ്പുകൾ സൂക്ഷിക്കാനും പിന്നീട് തിരികെ വരാനും അക്കൗണ്ട് ഉണ്ടാക്കൂ.', login: 'അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ ചെയ്യൂ', loading: 'തിരഞ്ഞെടുപ്പുകൾ ലോഡ് ചെയ്യുന്നു…', error: 'തിരഞ്ഞെടുപ്പുകൾ ലോഡ് ചെയ്യാനായില്ല.', failed: 'തിരഞ്ഞെടുപ്പുകൾ സേവ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കൂ.', retry: 'വീണ്ടും ശ്രമിക്കൂ', empty: 'സേവ് ചെയ്യുന്നതിന് മുമ്പ് ഒരു കരിയർ തിരഞ്ഞെടുക്കൂ.', results: 'ഫലങ്ങളിലേക്ക് മടങ്ങൂ' },
  hi: { title: 'अपने विकल्प सेव करें', description: 'आप इन करियर के बारे में जानना चाहते हैं। बाद में इन्हें बदल सकते हैं।', direction: 'आपकी दिशा', careers: 'आपके करियर', back: 'करियर पर वापस जाएँ', save: 'मेरे विकल्प सेव करें', saving: 'सेव हो रहा है…', guest: 'अपने विकल्प रखने और बाद में लौटने के लिए खाता बनाएँ।', login: 'पहले से खाता है? लॉग इन करें', loading: 'आपके विकल्प लोड हो रहे हैं…', error: 'आपके विकल्प लोड नहीं हो सके।', failed: 'आपके विकल्प सेव नहीं हो सके। फिर कोशिश करें।', retry: 'फिर कोशिश करें', empty: 'सेव करने से पहले एक करियर चुनें।', results: 'अपने परिणामों पर लौटें' },
  ta: { title: 'உங்கள் தேர்வுகளைச் சேமிக்கவும்', description: 'மேலும் அறிய நீங்கள் தேர்ந்தெடுத்த தொழில்கள் இவை. பின்னர் மாற்றலாம்.', direction: 'உங்கள் திசை', careers: 'உங்கள் தொழில்கள்', back: 'தொழில்களுக்குத் திரும்புக', save: 'எனது தேர்வுகளைச் சேமிக்கவும்', saving: 'சேமிக்கிறது…', guest: 'தேர்வுகளைச் சேமித்து பின்னர் திரும்ப கணக்கை உருவாக்குங்கள்.', login: 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக', loading: 'உங்கள் தேர்வுகள் ஏற்றப்படுகின்றன…', error: 'உங்கள் தேர்வுகளை ஏற்ற முடியவில்லை.', failed: 'தேர்வுகளைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', retry: 'மீண்டும் முயற்சிக்கவும்', empty: 'சேமிப்பதற்கு முன் ஒரு தொழிலைத் தேர்ந்தெடுக்கவும்.', results: 'உங்கள் முடிவுகளுக்குத் திரும்புக' },
};
type Summary = { plan: DirectionPlan; direction: string; careers: Array<{ id: string; title: string }> };
const signupHref = '/signup?saveDiscovery=1&next=%2Fdashboard';
const loginHref = '/login?saveDiscovery=1&next=%2Fdashboard';

export default function SaveChoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const owner = user && !user.isAnonymous ? user.uid : null;
  const { locale } = useTranslations();
  const text = copy[locale];
  const router = useRouter();
  const scope = useRef({ owner, generation: 0 });
  scope.current.owner = owner;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    scope.current.generation += 1;
    setLoaded(false); setSummary(null); setError(false); setSaveError(false); setSaving(false);
    if (authLoading) return () => { active = false; scope.current.generation += 1; };
    void (async () => {
      if (owner) await hydrateDiscoveryFromAccount();
      if (!active) return;
      const assessment = loadDiscoveryResult();
      const plan = loadDirectionPlan();
      if (!assessment || !plan?.dreamCareerIds.length || !isDirectionPlanCompatible(assessment, plan)) return;
      const catalog = await getPublishedCareerCatalog();
      if (!active) return;
      const direction = catalog.directions.find((item) => item.id === plan.areaId);
      const careers = plan.dreamCareerIds.map((id) => catalog.roles.find((item) => item.id === id && item.futureDirectionIds.includes(plan.areaId) && direction?.roleIds.includes(id)));
      if (!direction || careers.some((item) => !item)) return;
      setSummary({ plan, direction: (direction.translations[locale] || direction.translations.en).title, careers: careers.map((item) => ({ id: item!.id, title: (item!.translations[locale] || item!.translations.en).title })) });
    })().catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; scope.current.generation += 1; };
  }, [owner, authLoading, locale, attempt]);
  const save = async () => {
    if (!owner || !summary || saving) return;
    const generation = scope.current.generation;
    const current = () => scope.current.owner === owner && scope.current.generation === generation;
    setSaving(true); setSaveError(false);
    try {
      const saved = await savePendingCareerChoiceToAccount(owner);
      if (!current()) return;
      if (!saved) throw new Error('Missing choices');
      router.replace('/dashboard');
    } catch { if (current()) { setSaveError(true); setSaving(false); } }
  };
  return <div className={styles.surface}><Header /><main className={styles.shell}><JourneySteps step={3} locale={locale} />
    {authLoading || !loaded ? <p role="status" className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin" />{text.loading}</p>
      : error ? <div><p role="alert">{text.error}</p><Button className="mt-4" onClick={() => setAttempt((n) => n + 1)}>{text.retry}</Button></div>
      : !summary ? <div><h1 className="text-2xl font-semibold">{text.empty}</h1><Button asChild className="mt-5"><Link href="/assessment/discovery">{text.results}</Link></Button></div>
      : <>
        <Link href={`/explore/areas/${encodeURIComponent(summary.plan.areaId)}`} className="inline-flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" />{text.back}</Link>
        <div className={styles.summaryLayout}>
        <div><h1 className={styles.heading}>{text.title}</h1><p className={styles.intro}>{text.description}</p>
        </div>
        <section className={styles.summaryReceipt}>
          <div className={styles.receiptHeader}><h2 className="text-xs font-semibold uppercase tracking-wider">{text.direction}</h2><p>{summary.direction}</p></div>
          <div className={styles.receiptCareers}><h2 className="text-sm text-muted-foreground">{text.careers}</h2><ul>{summary.careers.map((career) => <li key={career.id}><Check size={20} /><span className="font-medium">{career.title}</span></li>)}</ul>
        {owner ? <Button size="lg" className="mt-7 w-full" disabled={saving} onClick={() => void save()}>{saving ? text.saving : text.save}</Button>
          : <div className="mt-7"><p className="text-sm leading-6 text-muted-foreground">{text.guest}</p><Button asChild size="lg" className="mt-4 w-full"><Link href={signupHref}>{text.save}</Link></Button><Link className="mt-4 block text-center text-sm underline underline-offset-4" href={loginHref}>{text.login}</Link></div>}
        {saveError ? <p role="alert" className="mt-4 text-destructive">{text.failed}</p> : null}
        </div></section></div>
      </>}
  </main></div>;
}
