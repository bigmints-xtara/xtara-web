'use client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from '@/i18n/language-provider';
import { getCareerExplorer } from '@/lib/career-explorer-api';
import { journeyCopy } from './journey-copy';
import { explorerCopy } from './copy';

/** Authentication keeps the selected published career visible and in the URL. */
export default function PursuitContext({ careerId, directionId }: { careerId: string | null; directionId: string | null }) {
  if (!careerId || !directionId) return null;
  return <PublishedPursuitContext careerId={careerId} directionId={directionId} />;
}

function PublishedPursuitContext({ careerId, directionId }: { careerId: string; directionId: string }) {
  const { locale } = useTranslations();
  const text = journeyCopy[locale];
  const { data, isError, isPending, refetch } = useQuery({queryKey:['career-explorer',locale],queryFn:({signal}) => getCareerExplorer(locale,signal),enabled:Boolean(careerId && directionId),meta:{authScope:'public'},retry:false});
  const career = data?.careers.find(item => item.id === careerId && item.directionIds.includes(directionId));
  return <section className="mb-5 text-center text-foreground" aria-live="polite">
    {isPending ? <p className="text-sm">{explorerCopy[locale].loading}</p> : isError ? <button className="min-h-11 text-sm underline" onClick={() => void refetch()}>{explorerCopy[locale].retry}</button> : career ? <><p className="text-xs font-medium uppercase tracking-widest">{text.pursue}</p><h2 className="mt-2 text-xl font-semibold">{career.title}</h2><p className="mt-2 text-sm">{text.benefitSave} · {text.benefitReturn}</p></> : <p className="text-sm">{explorerCopy[locale].workEmpty}</p>}
  </section>;
}
