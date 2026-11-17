import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingLayout from '@/components/MarketingLayout';
import { Button } from '@/components/ui/button';
import { getLocaleFromCookie } from '@/i18n/server';
import { getMessages } from '@/i18n/messages';
import { buildPageMetadata } from '@/lib/seo/page-metadata';
import styles from '@/components/launchpad/launchpad.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const content = getMessages(locale).trustedDiscovery.parents;
  return buildPageMetadata({ title: content.metadataTitle, description: content.metadataDescription, path: '/parents', locale });
}

export default async function ParentsPage() {
  const locale = await getLocaleFromCookie();
  const content = getMessages(locale).trustedDiscovery.parents;

  return <MarketingLayout>
    <section className={`${styles.hero} ${styles.parentsHero}`}>
      <div>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <div className={styles.actions}>
          <Button asChild size="lg" className={styles.primary}><Link href="/explore">{content.primary}<ArrowRight aria-hidden="true" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/assessment">{content.secondary}</Link></Button>
        </div>
      </div>
      <Image src="/images/home/exploring-together.webp" alt={getMessages(locale).trustedDiscovery.home.cta.imageAlt} width={1200} height={800} priority sizes="(max-width: 700px) 100vw, 45vw" className={styles.parentsImage} />
    </section>
    <div className={styles.parentsContent}>
      <section className={styles.outcomes} aria-labelledby="parent-help-title">
        <div className={styles.sectionHeader}><h2 id="parent-help-title">{content.stepsTitle}</h2></div>
        <div className={styles.cards}>{content.steps.map((step, index) => <article className={`${styles.card} ${styles.audienceCard}`} key={step.title}>
          <span className={styles.parentStep} aria-hidden="true">0{index + 1}</span>
          <h3>{step.title}</h3><p>{step.description}</p>
        </article>)}</div>
      </section>
      <section className={styles.conversation} aria-labelledby="parent-start-title">
        <div><h2 id="parent-start-title">{content.reassuranceTitle}</h2><p>{content.reassuranceBody}</p></div>
        <ul className={styles.parentPrompts}>{content.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ul>
      </section>
      <section className={styles.outcomes} aria-labelledby="parent-study-title">
        <div className={styles.sectionHeader}>
          <h2 id="parent-study-title">{content.practicalTitle}</h2>
          <p>{content.practicalBody}</p>
          <p>{content.accountNote}</p>
        </div>
        <div className={styles.actions}><Button asChild size="lg"><Link href="/explore">{content.primary}<ArrowRight aria-hidden="true" /></Link></Button></div>
      </section>
    </div>
  </MarketingLayout>;
}
