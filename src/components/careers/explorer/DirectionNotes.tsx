import { useQuery } from '@tanstack/react-query';
import type { Locale } from '@/i18n/config';
import type { ExplorerCareer, ExplorerDirection } from '@/types/career-explorer';
import { getExplorerDirectionRecord } from '@/lib/career-explorer-api';
import { explorerCopy } from './copy';
import { guideCopy } from './guide-copy';
import styles from '../ExploreCareers.module.css';

export default function DirectionNotes({ direction, careers, locale }: {
  direction: ExplorerDirection; careers: ExplorerCareer[]; locale: Locale;
}) {
  const copy = guideCopy[locale];
  const { data, isError, isPending, refetch } = useQuery({
    queryKey: ['public-direction-notes', direction.id],
    queryFn: ({ signal }) => getExplorerDirectionRecord(direction.id, signal),
    meta: { authScope: 'public' }, staleTime: 60_000, retry: false,
  });
  const localPrompt = data?.translations?.[locale]?.reflectionPrompt?.trim();
  const prompt = localPrompt || data?.translations?.en?.reflectionPrompt?.trim();
  let fallback = Boolean(prompt && !localPrompt);
  const examples = new Set<string>();
  for (const id of direction.careerIds) {
    const career = careers.find(item => item.id === id);
    const activity = career?.activities.find(item => item.trim());
    if (activity && !examples.has(activity)) {
      examples.add(activity);
      fallback ||= Boolean(career?.translationFallback);
    }
    if (examples.size === 2) break;
  }
  const grades = ([8, 9, 10, 11, 12] as const).flatMap(number => {
    const key = `grade${number}` as const;
    const local = data?.gradeGuidance?.[locale]?.[key];
    const ideas = (local?.length ? local : data?.gradeGuidance?.en?.[key])?.filter(line => line.trim());
    if (!ideas?.length) return [];
    fallback ||= !local?.length;
    return [{ number, ideas }];
  });

  return <section className={styles.directionNotes} aria-label={direction.title}>
    <h2>{copy.about.replace('{name}', direction.title)}</h2>
    {direction.summary && <p>{direction.summary}</p>}
    {prompt && <div><h3>{copy.reflect}</h3><p>{prompt}</p></div>}
    {examples.size > 0 && <div><h3>{copy.workExamples}</h3><ul>{[...examples].map(line => <li key={line}>{line}</li>)}</ul></div>}
    {grades.length > 0 && <div><h3>{copy.gradeIdeas}</h3>{grades.map(({number, ideas}) =>
      <details key={number}><summary>{copy.gradeNumber.replace('{n}', String(number))}</summary><ul>{ideas.map((line, i) => <li key={i}>{line}</li>)}</ul></details>)}</div>}
    {fallback && locale !== 'en' && <p>{explorerCopy[locale].fallback}</p>}
    {isPending && <p role="status">{explorerCopy[locale].loading}</p>}
    {isError && <div><p role="status">{copy.detailError}</p><button onClick={() => void refetch()}>{explorerCopy[locale].retry}</button></div>}
  </section>;
}
