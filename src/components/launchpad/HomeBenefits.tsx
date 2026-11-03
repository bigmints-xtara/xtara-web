'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '@/i18n/language-provider';
import { Button } from '@/components/ui/button';
import { launchpadCopy } from './copy';
import styles from './launchpad.module.css';

const images = ['engineering-and-built-world','arts-design-and-creative-media','health-and-wellbeing'];
export default function HomeBenefits() {
  const { messages, locale } = useTranslations();
  const content = messages.trustedDiscovery.home;
  return <div className={styles.homeContent}>
    <section id="how-it-works" className={styles.band}>
      <h2>{launchpadCopy[locale].steps}</h2>
      {content.outcomes.items.map(item=><div className={styles.step} key={item.step}><b>{item.step}</b><h3>{item.title}</h3><p>{item.description}</p></div>)}
    </section>
    <section className={styles.outcomes}>
      <div className={styles.sectionHeader}><h2>{content.outcomes.title}</h2><p>{content.outcomes.description}</p></div>
      <div className={styles.cards}>{content.outcomes.items.map((item,index)=><article key={item.step} className={styles.card}><Image src={`/images/career-directions/${images[index % images.length]}.webp`} alt="" width={600} height={360} sizes="(max-width:700px) 100vw, 33vw" /><div className={styles.cardBody}><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div>
    </section>
    <section className={styles.conversation}><div><div className={styles.eyebrow}>{content.conversation.eyebrow}</div><h2 className="mt-5">{content.conversation.title}</h2></div><div><p>{content.conversation.description}</p><Button asChild size="lg" className="mt-6 h-auto min-h-12 whitespace-normal rounded-lg"><Link href="/assessment">{content.conversation.action}<ArrowRight aria-hidden="true" /></Link></Button></div></section>
    <section className={styles.outcomes}><div className={styles.sectionHeader}><h2>{content.trust.title}</h2><p>{content.trust.description}</p></div><div className={styles.trust}>{content.trust.items.map(item=><div key={item.title}><h3>{item.title}</h3><p>{item.description}</p></div>)}</div></section>
  </div>;
}
