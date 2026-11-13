'use client';
import { useTranslations } from '@/i18n/language-provider';
import { getAssessmentV2Catalog } from '@/lib/assessment-v2';
import styles from './DashboardSkeleton.module.css';
export default function DashboardSkeleton() {
  const { locale } = useTranslations();
  return <main className={styles.shell} aria-busy="true" aria-label={getAssessmentV2Catalog(locale).ui.loading}>
    <p className={styles.label} role="status">{getAssessmentV2Catalog(locale).ui.loading}</p>
    <div aria-hidden="true">
      <div className={`${styles.block} ${styles.heading}`} />
      <div className={`${styles.block} ${styles.intro}`} />
      <div className={styles.hero}>
        <div className={`${styles.block} ${styles.orb}`} />
        <div><div className={`${styles.block} ${styles.heading}`} /><div className={`${styles.block} ${styles.line}`} /><div className={`${styles.block} ${styles.line} ${styles.short}`} /><div className={`${styles.block} ${styles.action}`} /></div>
      </div>
      <div className={styles.details}>{[0, 1].map(i => <div key={i} className={styles.panel}><div className={`${styles.block} ${styles.intro}`} />{[0, 1, 2].map(j => <div key={j} className={`${styles.block} ${styles.line} ${j === 2 ? styles.short : ''}`} />)}</div>)}</div>
    </div>
  </main>;
}
