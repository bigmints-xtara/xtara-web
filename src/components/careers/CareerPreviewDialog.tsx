'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/components/journey/journey.module.css';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/i18n/language-provider';
import { getDreamCareerStudentGuide } from '@/lib/dream-career-student-guide-api';
import type { DreamCareerStudentGuideResponse } from '@/types/dream-career-student-guide';
import { DreamCareerStudentGuide } from './DreamCareerStudentGuide';

const copy = {
  en: { back: 'Back to careers', loading: 'Loading career details…', error: 'We couldn’t load the details.', retry: 'Try again' },
  ml: { back: 'കരിയറുകളിലേക്ക് മടങ്ങൂ', loading: 'കരിയർ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു…', error: 'വിവരങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.', retry: 'വീണ്ടും ശ്രമിക്കൂ' },
  hi: { back: 'करियर पर वापस जाएँ', loading: 'करियर की जानकारी लोड हो रही है…', error: 'जानकारी लोड नहीं हो सकी।', retry: 'फिर कोशिश करें' },
  ta: { back: 'தொழில்களுக்குத் திரும்புக', loading: 'தொழில் விவரங்கள் ஏற்றப்படுகின்றன…', error: 'விவரங்களை ஏற்ற முடியவில்லை.', retry: 'மீண்டும் முயற்சிக்கவும்' },
};

/** A reading detour: it never changes the selection or replaces the chooser. */
export default function CareerPreviewDialog({ career, onClose }: {
  career: { id: string; title: string; summary: string }; onClose: () => void;
}) {
  const { locale } = useTranslations();
  return <CareerPreviewContent key={`${career.id}:${locale}`} career={career} onClose={onClose} locale={locale} />;
}

function CareerPreviewContent({ career, onClose, locale }: {
  career: { id: string; title: string; summary: string }; onClose: () => void; locale: keyof typeof copy;
}) {
  const text = copy[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const [guide, setGuide] = useState<DreamCareerStudentGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); trigger?.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    getDreamCareerStudentGuide(career.id, { locale, signal: controller.signal })
      .then((value) => { if (!controller.signal.aborted) setGuide(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [career.id, locale, attempt]);
  const retry = () => { setLoading(true); setError(false); setGuide(null); setAttempt((n) => n + 1); };
  return <dialog ref={dialog} aria-labelledby="career-preview-title" onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    className={`${styles.preview} m-auto max-h-[90dvh] w-[92vw] overflow-y-auto border border-border bg-background p-0 text-foreground backdrop:bg-black/50`}>
    <div className="sticky top-0 z-10 flex justify-end border-b border-border bg-background p-3">
      <Button variant="ghost" onClick={onClose}><X className="mr-2 h-4 w-4" />{text.back}</Button>
    </div>
    <div className={styles.previewIntro}><h2 id="career-preview-title" className="text-2xl font-semibold sm:text-3xl">{career.title}</h2>
      <p className="mt-4 leading-7 text-muted-foreground">{career.summary}</p>
    </div>
    {loading ? <p role="status" className="px-5 pb-8 sm:px-8">{text.loading}</p> : null}
    {error ? <div className="px-5 pb-8 sm:px-8"><p role="alert">{text.error}</p><Button variant="outline" className="mt-3" onClick={retry}>{text.retry}</Button></div> : null}
    {guide ? <DreamCareerStudentGuide embedded response={guide} locale={locale} onRetryRelationship={retry} /> : null}
  </dialog>;
}
