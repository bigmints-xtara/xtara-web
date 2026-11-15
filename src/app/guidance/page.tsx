"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sprout } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { ConversationJournal, useConversationCopy } from '@/components/guidance/ConversationJournal';
import styles from '@/components/guidance/guidance.module.css';
export default function StudentGuidancePage() {
  const { user, loading } = useAuth(); const router = useRouter(); const { c } = useConversationCopy();
  useEffect(() => { if (!loading && (!user || user.isAnonymous)) router.replace('/login?next=%2Fguidance'); }, [user, loading, router]);
  return <div className={`${styles.garden} ${styles.canvas}`}><Header /><main className="mx-auto max-w-5xl px-5 py-8 pb-20"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm"><ArrowLeft size={16} />{c.back}</Link><header className={styles.hero}><div><p className={styles.eyebrow}><Sprout size={18} />{c.connected}</p><h1>{c.tagline}</h1><p>{c.studentIntro}</p></div></header>{(loading || (user && !user.isAnonymous)) && <ConversationJournal />}</main></div>;
}
