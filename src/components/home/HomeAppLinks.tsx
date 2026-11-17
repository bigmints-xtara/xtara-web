'use client';

import AppStoreButton from '@/components/AppStoreButton';
import PlayStoreButton from '@/components/PlayStoreButton';
import { useTranslations } from '@/i18n/language-provider';
import type { Locale } from '@/i18n/config';

// App Store Connect ID: 6749342993. Its public listing currently returns 404.
// Enable only once the app is available at https://apps.apple.com/app/id6749342993.
const appStoreUrl: string | null = null;
const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.bigmints.xtara';
const copy: Record<Locale, { title: string; unavailable: string }> = {
  en: { title: 'Use Xtara on your phone', unavailable: 'Download unavailable' },
  ml: { title: 'ഫോണിലും Xtara ഉപയോഗിക്കാം', unavailable: 'ഡൗൺലോഡ് ലഭ്യമല്ല' },
  hi: { title: 'अपने फ़ोन पर Xtara इस्तेमाल करें', unavailable: 'डाउनलोड उपलब्ध नहीं है' },
  ta: { title: 'உங்கள் ஃபோனில் Xtara பயன்படுத்துங்கள்', unavailable: 'பதிவிறக்கம் கிடைக்கவில்லை' },
};

export default function HomeAppLinks() {
  const { locale } = useTranslations();
  return <div className="mt-7 border-t border-border pt-5" role="group" aria-label={copy[locale].title}>
    <div className="mb-3 text-sm font-medium">{copy[locale].title}</div>
    <div className="flex flex-wrap gap-3">
      <AppStoreButton dark url={appStoreUrl} unavailableLabel={copy[locale].unavailable} />
      <PlayStoreButton dark url={playStoreUrl} />
    </div>
  </div>;
}
