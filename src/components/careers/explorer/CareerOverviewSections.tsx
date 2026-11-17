'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getCareerOverview } from '@/lib/career-overview-api';
import type { ExplorerCareer } from '@/types/career-explorer';
import type { CareerStudyItem } from '@/types/career-overview';
import { studyOptionsHref } from '@/lib/study-options';
import styles from '../ExploreCareers.module.css';

const phases = [['grades8To10', 'Grades 8–10'], ['afterGrade10', 'After grade 10'], ['afterGrade12', 'After grade 12']] as const;
export default function CareerOverviewSections({ career }: { career: ExplorerCareer }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['career-overview', career.id, 'en'],
    queryFn: ({ signal }) => getCareerOverview(career.id, signal),
    meta: { authScope: 'public' }, staleTime: 300_000, retry: false,
  });
  const facts = [
    ['work', 'What you’ll do', data ? [...(data.whatYouDo.summary && data.whatYouDo.summary !== career.summary ? [data.whatYouDo.summary] : []), ...data.whatYouDo.activities] : career.activities],
    ['skills', 'Skills you’ll use', data?.skills ?? career.skills ?? []],
    ['workplaces', 'Where you’ll work', data?.workplaces ?? career.workplaces ?? []],
    ['good', 'Good to know', career.tradeoffs ?? []],
  ] as const;
  const missing = <p className={styles.sectionEmpty}>Reviewed guidance has not been published yet.</p>;
  const citations = (ids: string[]) => <ul className={styles.sourceLinks}>{ids.flatMap(id => {
    const source = data?.sources.find(item => item.id === id);
    if (!source || !/^https?:\/\//i.test(source.url)) return [];
    return <li key={id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>;
  })}</ul>;
  const studyItem = (item: CareerStudyItem) => <li key={item.id}>
    {(item.title || item.pathwayTitle) && <h4>{item.title || item.pathwayTitle}</h4>}
    <p>{item.description}</p>
    {item.gradeIds.length > 0 && <p className={styles.studyMeta}>{item.gradeIds.map(id => id.replace(/^grade/, 'Grade ')).join(', ')}</p>}
    {item.requirement && <p className={styles.studyMeta}>{item.requirement.replaceAll('_', ' ')}</p>}
    {item.geography && <p className={styles.studyMeta}>{item.geography}</p>}
    {citations(item.sourceIds)}
  </li>;
  return <div className={styles.careerSections} lang="en">
    {isPending && <p role="status">Loading career guidance…</p>}
    {isError && <div role="alert"><p>More career guidance could not be loaded. You can still explore the career basics.</p><button className={styles.secondary} onClick={() => void refetch()}>Try again</button></div>}
    {facts.map(([id, label, values], index) => <section className={styles.careerSection} key={id} aria-labelledby={`section-${id}`}>
      <header><span className={styles.sectionNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h2 id={`section-${id}`}>{label}</h2></header>
      {!values.length ? missing : <ul className={id === 'skills' ? styles.skillList : styles.factList}>{values.map((value, i) => <li key={`${i}:${value}`}>{value}</li>)}</ul>}
    </section>)}
    <section className={styles.careerSection} aria-labelledby="section-roles"><header><span className={styles.sectionNumber}>05</span><h2 id="section-roles">Job roles</h2></header>
      {!data?.jobRoles.length ? missing : <ul className={styles.factList}>{data.jobRoles.map(role => <li key={role.id}><h3>{role.label}</h3><p>{role.description}</p>{role.jobTitles.length > 0 && <p>{role.jobTitles.join(' · ')}</p>}{citations(role.sourceIds)}</li>)}</ul>}
    </section>
  <section className={styles.careerSection} aria-labelledby="section-pay"><header><span className={styles.sectionNumber}>06</span><h2 id="section-pay">Pay outlook</h2></header>
    {data?.earnings.status === 'available' ? <>
      <p>{data.earnings.description}</p>
      <p className={styles.studyMeta}>{[data.earnings.measure, data.earnings.population, data.earnings.experience, data.earnings.geography, data.earnings.asOf].join(' · ')}</p>
      {citations(data.earnings.sourceIds)}
    </> : <p className={styles.sectionEmpty}>Reviewed qualitative pay guidance is not available yet.</p>}
  </section>
    <section className={styles.careerSection} aria-labelledby="section-study"><header><span className={styles.sectionNumber}>07</span><h2 id="section-study">Your study path</h2></header>
      <div className={styles.studyPhases}>{phases.map(([key, label]) => <section key={key}><h3>{label}</h3>{!data?.studyPaths[key].length ? missing : <ul className={styles.factList}>{data.studyPaths[key].map(studyItem)}</ul>}</section>)}
        {data?.studyOptions === 'public_pilot' && <p><Link className={styles.secondary} href={studyOptionsHref(career.id, `/explore?career=${encodeURIComponent(career.id)}&step=work`)}>Explore study options</Link><span className={styles.studyMeta}>Public pilot for this career. Check entry requirements with each provider.</span></p>}
        <p><Link className={styles.quiet} href="/colleges">Browse the college finder →</Link></p>
      </div>
    </section>
  </div>;
}
