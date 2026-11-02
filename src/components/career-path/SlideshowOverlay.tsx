'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useTranslations } from '@/i18n/language-provider';
import type { CareerSlideData } from '@/types/career';
import styles from './SlideshowOverlay.module.css';

interface SlideshowOverlayProps { isOpen: boolean; onClose: () => void; slides: CareerSlideData[]; onRetry?: () => void; retryLabel?: string; status?: 'loading' | 'error' }
const copy = {
  en: { title: 'Career conversation', topics: 'Conversation topics', previous: 'Previous', next: 'Next topic', finish: 'Back to my careers', close: 'Close career conversation' },
  ml: { title: 'കരിയർ സംഭാഷണം', topics: 'സംഭാഷണ വിഷയങ്ങൾ', previous: 'മുമ്പത്തേത്', next: 'അടുത്ത വിഷയം', finish: 'എന്റെ കരിയറുകളിലേക്ക് മടങ്ങൂ', close: 'കരിയർ സംഭാഷണം അടയ്ക്കുക' },
  hi: { title: 'करियर पर बातचीत', topics: 'बातचीत के विषय', previous: 'पिछला', next: 'अगला विषय', finish: 'मेरे करियर पर लौटें', close: 'करियर बातचीत बंद करें' },
  ta: { title: 'தொழில் உரையாடல்', topics: 'உரையாடல் தலைப்புகள்', previous: 'முந்தையது', next: 'அடுத்த தலைப்பு', finish: 'எனது தொழில்களுக்குத் திரும்புக', close: 'தொழில் உரையாடலை மூடுக' },
};

export default function SlideshowOverlay(props: SlideshowOverlayProps) {
  return props.isOpen && props.slides.length ? <ConversationViewer onClose={props.onClose} slides={props.slides} onRetry={props.onRetry} retryLabel={props.retryLabel} status={props.status} /> : null;
}

function ConversationViewer({ onClose, slides, onRetry, retryLabel, status }: Omit<SlideshowOverlayProps, 'isOpen'>) {
  const { locale } = useTranslations();
  const text = copy[locale];
  const [index, setIndex] = useState(0);
  const current = Math.min(index, slides.length - 1);
  const slide = slides[current];
  const dialog = useRef<HTMLDialogElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; trigger?.focus(); };
  }, []);
  useEffect(() => {
    if (reader.current) reader.current.scrollTop = 0;
    heading.current?.focus();
  }, [current, slide.title]);
  return <dialog ref={dialog} className={styles.dialog} aria-label={text.title} aria-busy={status === 'loading'} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className={styles.header}>
      <span>{text.title}</span>
      <button type="button" onClick={onClose} aria-label={text.close}><X size={20} aria-hidden="true" /></button>
    </header>
    <div className={styles.layout}>
      <nav className={styles.topics} aria-label={text.topics}>
        <p>{text.topics}</p>
        <ol>{slides.map((item, position) => <li key={`${item.type}-${position}`}><button type="button" aria-current={current === position ? 'step' : undefined} onClick={() => setIndex(position)}><span aria-hidden="true">{String(position + 1).padStart(2, '0')}</span>{item.title}</button></li>)}</ol>
      </nav>
      <div className={styles.reader} ref={reader}>
        <div className={styles.readingWidth}>
          <p className={styles.position}>{current + 1} / {slides.length}</p>
          <h2 ref={heading} tabIndex={-1}>{slide.title}</h2>
          <p className={styles.subtitle} role={status === 'error' ? 'alert' : status === 'loading' ? 'status' : undefined}>{slide.subtitle}</p>
          <ul className={styles.content}>{slide.content.filter((item) => item.subtitle.trim() || item.titlesOnly).map((item, position) => <li key={position}>
            <h3>{item.title}</h3>{item.subtitle ? <p>{item.subtitle}</p> : null}
            {item.sources?.length ? <ul className={styles.sources}>{item.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul> : null}
          </li>)}</ul>
        </div>
      </div>
    </div>
    <footer className={styles.footer}>
      {onRetry ? <button type="button" onClick={onRetry}>{retryLabel}</button> : null}
      <button type="button" disabled={current === 0} onClick={() => setIndex(current - 1)}><ArrowLeft size={17} aria-hidden="true" />{text.previous}</button>
      <button type="button" className={styles.next} onClick={() => current === slides.length - 1 ? onClose() : setIndex(current + 1)}>{current === slides.length - 1 ? text.finish : text.next}<ArrowRight size={17} aria-hidden="true" /></button>
    </footer>
  </dialog>;
}
