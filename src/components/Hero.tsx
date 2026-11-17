"use client";
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { trackEvent } from '@/lib/analytics';
import { launchpadCopy } from '@/components/launchpad/copy';
import HomeAppLinks from '@/components/home/HomeAppLinks';
import styles from '@/components/launchpad/launchpad.module.css';

export default function Hero() {
  const { user } = useAuth();
  const { messages, locale } = useTranslations();
  const content = messages.trustedDiscovery.home.hero;
  const copy = launchpadCopy[locale];
  const signedIn = Boolean(user && !user.isAnonymous);
  return <section id="hero" className={styles.hero}>
    <div>
      <div className={styles.eyebrow}>{content.eyebrow}</div>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <div className={styles.actions}>
        <Button asChild size="lg" className={styles.primary}><Link href={signedIn ? '/dashboard' : '/assessment'} onClick={() => trackEvent({action:'cta_click',category:'engagement',label:signedIn?'home_open_path':'home_start_assessment'})}>{signedIn ? content.primaryLoggedIn : content.primaryLoggedOut}<ArrowRight aria-hidden="true" /></Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/explore">{copy.explore}<ArrowRight aria-hidden="true" /></Link></Button>
      </div>
      <ul className={styles.proofs}>{content.proofs.map(proof=><li key={proof}><Check size={15} aria-hidden="true" />{proof}</li>)}</ul>
      <HomeAppLinks />
    </div>
    <div className={styles.art} aria-hidden="true"><div className={styles.arch}/><div className={styles.orbit}/><div className={styles.ball}/><div className={styles.dot}/></div>
  </section>;
}
