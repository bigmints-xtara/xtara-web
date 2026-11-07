'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from '@/i18n/language-provider';
import { getDreamCareerStudentGuide } from '@/lib/dream-career-student-guide-api';
import { careerConversationFromGuides } from '@/lib/career-conversation-data';
import type { CareerSlideData } from '@/types/career';
import type { DreamCareerGuideLocale } from '@/types/dream-career-student-guide';
import SlideshowOverlay from './SlideshowOverlay';
const copy = {
 en: { title:'Career conversation', loading:'Loading career details…', error:'We couldn’t load the career details.', help:'Please try again. Your career choices have not changed.', retry:'Try again' },
 ml: { title:'കരിയർ സംഭാഷണം',loading:'കരിയർ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു…',error:'കരിയർ വിവരങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.',help:'വീണ്ടും ശ്രമിക്കൂ. നിങ്ങളുടെ കരിയർ തിരഞ്ഞെടുപ്പുകൾ മാറിയിട്ടില്ല.',retry:'വീണ്ടും ശ്രമിക്കൂ' },
 hi: { title:'करियर पर बातचीत',loading:'करियर की जानकारी लोड हो रही है…',error:'करियर की जानकारी लोड नहीं हुई।',help:'फिर कोशिश करें। आपके करियर विकल्प बदले नहीं हैं।',retry:'फिर कोशिश करें' },
 ta: { title:'தொழில் உரையாடல்',loading:'தொழில் விவரங்கள் ஏற்றப்படுகின்றன…',error:'தொழில் விவரங்களை ஏற்ற முடியவில்லை.',help:'மீண்டும் முயற்சிக்கவும். உங்கள் தொழில் தேர்வுகள் மாறவில்லை.',retry:'மீண்டும் முயற்சிக்கவும்' },
};
export default function CareerConversation({ isOpen, careerIds, onClose }: { isOpen:boolean; careerIds:string[]; onClose:()=>void }) {
 const { locale } = useTranslations();
 const ids = [...new Set(careerIds)].sort().join(',');
 return isOpen && ids ? <LoadedConversation key={`${locale}:${ids}`} ids={ids} locale={locale} onClose={onClose} /> : null;
}
function LoadedConversation({ ids, locale, onClose }: {ids:string;locale:DreamCareerGuideLocale;onClose:()=>void}) {
 const [slides,setSlides] = useState<CareerSlideData[]>([]);
 const [error,setError] = useState(false);
 const [attempt,setAttempt] = useState(0);
 const text = copy[locale];
 useEffect(() => {
  const controller = new AbortController();
  Promise.all(ids.split(',').map((id) => getDreamCareerStudentGuide(id,{locale,signal:controller.signal})))
   .then((guides) => { if (!controller.signal.aborted) setSlides(careerConversationFromGuides(guides,locale)); })
   .catch(() => { if (!controller.signal.aborted) setError(true); });
  return () => controller.abort();
 }, [ids,locale,attempt]);
 const placeholder:CareerSlideData = {type:'meetDreamCareer',title:text.title,subtitle:error ? text.error : text.loading,buttonLabel:text.retry,visualization:'list',slideIcon:'MessagesSquare',content:error ? [{title:text.retry,subtitle:text.help,icon:'Info'}] : []};
 return <SlideshowOverlay isOpen onClose={onClose} slides={slides.length ? slides : [placeholder]} onRetry={error ? () => { setError(false); setSlides([]); setAttempt((value) => value+1); } : undefined} retryLabel={text.retry} status={error ? 'error' : slides.length ? undefined : 'loading'} />;
}
