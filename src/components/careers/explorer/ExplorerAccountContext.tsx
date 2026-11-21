'use client';
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getExplorerAccountContext } from '@/lib/career-overview-api';
import styles from '../ExploreCareers.module.css';

export default function ExplorerAccountContext() {
  const { user, loading } = useAuth();
  const uid = user && !user.isAnonymous ? user.uid : undefined;
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['explorer-account-context', uid],
    queryFn: () => getExplorerAccountContext(uid!), enabled: Boolean(uid), staleTime: 30_000, retry: false });
  return <div className={styles.accountContext} lang="en">
    {loading ? <p role="status">Checking your account…</p> : !uid ? <p>Take the assessment to explore suggested career directions and the reasons behind them. You can try it without an account. Create an account to save careers and return to your path.</p> : isPending ? <p role="status">Checking your saved path…</p> : isError ? <p role="alert">We couldn’t check your assessment or saved path. <Button variant="link" onClick={() => void refetch()}>Try again</Button></p> : data?.assessed ? <p>Your assessment is saved. {data.direction.overview?.title && <>Your current direction is <strong>{data.direction.overview.title}</strong>. </>}<Link className={styles.quiet} href="/dashboard">Open My Direction →</Link></p> : <p>You can save this career now. Take the assessment when you’re ready to explore suggested directions and why they may interest you.</p>}
    <p>General study guidance and the college finder are public. Study options are currently a pilot for Software Developer and UX Designer.</p>
    <p className={styles.studyMeta}>Coming later: broader course recommendations, learning and microcourses. School connections require an invitation, assessment and consent.</p>
  </div>;
}
