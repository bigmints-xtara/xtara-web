import { Check } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import styles from './journey.module.css';

const labels = {
  en: ['Your results', 'Choose careers', 'Save your choices'],
  ml: ['നിങ്ങളുടെ ഫലം', 'കരിയറുകൾ തിരഞ്ഞെടുക്കൂ', 'തിരഞ്ഞെടുപ്പുകൾ സേവ് ചെയ്യൂ'],
  hi: ['आपके परिणाम', 'करियर चुनें', 'विकल्प सेव करें'],
  ta: ['உங்கள் முடிவுகள்', 'தொழில்களைத் தேர்ந்தெடுக்கவும்', 'தேர்வுகளைச் சேமிக்கவும்'],
};
/** Orientation only: forward navigation stays with the screen's primary action. */
export default function JourneySteps({ step, locale }: { step: 1 | 2 | 3; locale: Locale }) {
  return <ol className={styles.steps}>
    {labels[locale].map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} data-complete={index + 1 < step}>
      <span className={styles.stepNumber}>{index + 1 < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
    </li>)}
  </ol>;
}
