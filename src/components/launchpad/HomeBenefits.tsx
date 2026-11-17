'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, HeartHandshake, School } from 'lucide-react';
import { useTranslations } from '@/i18n/language-provider';
import styles from './launchpad.module.css';

const audiences = [
  { href: '/assessment', Icon: BookOpen },
  { href: '/parents', Icon: HeartHandshake },
  { href: '/educators', Icon: School },
];

export default function HomeBenefits() {
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home;

  return <div className={styles.homeContent}>
    <section id="how-it-works" className={styles.band} aria-labelledby="home-steps-title">
      <h2 id="home-steps-title">{content.outcomes.title}</h2>
      {content.outcomes.items.map(item => <div className={styles.step} key={item.step}>
        <b aria-hidden="true">{item.step}</b>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>)}
    </section>
    <section className={styles.outcomes} aria-labelledby="home-audiences-title">
      <div className={styles.sectionHeader}><h2 id="home-audiences-title">{content.audiences.title}</h2></div>
      <div className={styles.cards}>
        {content.audiences.items.map((item, index) => {
          const { href, Icon } = audiences[index];
          return <article key={href} className={`${styles.card} ${styles.audienceCard}`}>
            <Icon className={styles.audienceIcon} size={28} aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Link href={href} className={styles.audienceLink}>{item.action}<ArrowRight size={18} aria-hidden="true" /></Link>
          </article>;
        })}
      </div>
    </section>
  </div>;
}
