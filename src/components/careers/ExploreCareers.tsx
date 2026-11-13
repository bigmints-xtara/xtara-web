'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, ChevronRight, CirclePause, CirclePlay, ImageIcon, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useTranslations } from '@/i18n/language-provider';
import { useAuth } from '@/context/AuthContext';
import { getCareerExplorer } from '@/lib/career-explorer-api';
import { pursueCareer } from '@/lib/career-pursuit-api';
import { explorerCopy } from './explorer/copy';
import { journeyCopy, explorerHeadings, invitationCopy } from './explorer/journey-copy';
import { exploreUrl, initialExploreState, readExploreState, type ExploreState } from './explorer/state';
import VisualCarousel from './explorer/VisualCarousel';
import type { ExplorerIllustration } from '@/types/career-explorer';
import styles from './ExploreCareers.module.css';

const navigationEvent = 'xtara-explore-navigate';
function subscribe(listener: () => void) { window.addEventListener('popstate', listener); window.addEventListener(navigationEvent, listener); return () => { window.removeEventListener('popstate', listener); window.removeEventListener(navigationEvent, listener); }; }
const snapshot = () => window.location.search;
const serverSnapshot = () => '';
export function safeSourceUrl(url: string) { try { const value = new URL(url); return ['https:', 'http:'].includes(value.protocol) ? value.href : null; } catch { return null; } }

function Illustration({ illustration, placeholder, bubble = false }: { illustration?: ExplorerIllustration; placeholder: string; bubble?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = illustration && safeSourceUrl(illustration.url);
  return <div className={`${styles.media} ${bubble ? styles.bubbleMedia : ''}`}>
    {url && url !== failedUrl ? <Image unoptimized fill sizes="(max-width:700px) 80vw, 410px" src={url} alt={illustration?.alt ?? ''} draggable={false} onError={() => setFailedUrl(url)} /> : <span className={styles.placeholder}><ImageIcon size={34} strokeWidth={1.2} aria-hidden="true" /><span>{placeholder}</span></span>}
  </div>;
}
const tone = (presentation?: { accent: string; tint: string; wash: string; washEnd: string }) => presentation ? ({ '--scene-accent': presentation.accent, '--scene-tint': presentation.tint, '--scene-wash': presentation.wash, '--scene-wash-end': presentation.washEnd } as CSSProperties) : undefined;

export default function ExploreCareers() {
  const { locale } = useTranslations();
  const copy = explorerCopy[locale], text = journeyCopy[locale];
  const headings = explorerHeadings[locale];
  const invite = invitationCopy[locale];
  const { user } = useAuth();
  const owner = useRef(user?.uid);
  useEffect(() => { owner.current = user?.uid; }, [user?.uid]);
  const queryClient = useQueryClient();
  const search = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['career-explorer', locale], queryFn: ({ signal }) => getCareerExplorer(locale, signal), meta: { authScope: 'public' }, staleTime: 60_000, retry: false });
  const state = readExploreState(search, data);
  const [paused, setPaused] = useState(false);
  const [chapter, setChapter] = useState('work');
  const [saveResult, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveOwner, setSaveOwner] = useState<string>();
  const [saveLocation, setSaveLocation] = useState<string>();
  const saveState = user && !user.isAnonymous && user.uid === saveOwner && search === saveLocation ? saveResult : 'idle';
  const saveGeneration = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const [focusedPositions, setFocusedPositions] = useState<Record<string, number>>({});
  // Let Next copy its own history state and synchronize the canonical URL.
  // Reusing its __NA-marked state skips that hook, so locale refresh loses the route.
  const navigate = (next: ExploreState) => { saveGeneration.current += 1; window.history.pushState(null, '', exploreUrl(next)); window.dispatchEvent(new Event(navigationEvent)); setChapter('work'); setSaveState('idle'); requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo?.({ top: 0, behavior: 'instant' }); }); };
  const direction = data?.directions.find(d => d.id === state.direction);
  const career = data?.careers.find(c => c.id === state.career);
  const parent = data?.careers.find(c => c.id === career?.parentCareerId);
  const specialization = state.step === 'specializations';
  const invitation = state.step === 'pursuit' && Boolean(career) && (!user || user.isAnonymous);
  const overview = Boolean(career && !specialization && !invitation);
  const home = state.step === 'directions';
  const groupKey = `${state.step}:${state.direction}:${state.career}`;
  const goCareer = (id: string, skip = false) => {
    const item = data?.careers.find(c => c.id === id);
    const hasChildren = item?.specializationIds?.some(child => data?.careers.some(c => c.id === child));
    navigate({ ...state, career: id, direction: state.direction || item?.directionIds[0] || null, step: hasChildren && !skip ? 'specializations' : 'work', q: '' });
  };
  const onPursue = async () => {
    if (!career || !direction) return;
    if (!user || user.isAnonymous) {
      navigate({ ...state, step: 'pursuit' }); return;
    }
    const uid = user.uid, generation = ++saveGeneration.current; setSaveOwner(uid); setSaveLocation(search); setSaveState('saving');
    try { await pursueCareer(career.id, direction.id, uid); if (owner.current !== uid || saveGeneration.current !== generation) return; await queryClient.invalidateQueries({ predicate: query => query.meta?.authScope !== 'public' }); setSaveState('saved'); }
    catch { if (owner.current === uid && saveGeneration.current === generation) setSaveState('error'); }
  };
  const motionLabel = paused ? text.resume : text.pause;
  const MotionIcon = paused ? CirclePlay : CirclePause;
  const directionIsCurrent = state.step === 'roles' && !state.industry;
  const breadcrumbs = <nav aria-label={copy.path}>
    <ol className={styles.breadcrumbs}>
      <li><button onClick={() => navigate({ ...initialExploreState, view: state.view })}>{copy.directions}</button></li>
      {direction && <li>
        <ChevronRight aria-hidden="true" />
        {directionIsCurrent ? <span aria-current="page">{direction.title}</span> :
          <button onClick={() => navigate({ ...state, industry: null, career: null, step: 'roles', q: '' })}>{direction.title}</button>}
      </li>}
      {parent && <li><ChevronRight aria-hidden="true" /><button onClick={() => goCareer(parent.id)}>{parent.title}</button></li>}
      {career && <li>
        <ChevronRight aria-hidden="true" />
        <span aria-current="page">{invitation ? invite.yourDream : specialization ? copy.specializations : career.title}</span>
      </li>}
    </ol>
  </nav>;
  const common = { previous: text.previous, next: text.next, hint: text.swipe };
  const choices = !data ? [] : home ? data.directions : specialization ? data.careers.filter(c => career?.specializationIds?.includes(c.id)) : state.step === 'industries' ? data.industries.filter(i => direction?.industryIds.includes(i.id)).map(i => ({ ...i, summary: i.description })) : data.careers.filter(c => !c.parentCareerId && (state.industry ? data.industries.find(i => i.id === state.industry)?.careerIds.includes(c.id) : direction ? direction.careerIds.includes(c.id) : true) && `${c.title} ${c.summary}`.toLocaleLowerCase(locale).includes(state.q.toLocaleLowerCase(locale)));
  const chapters = [{ id: 'work', label: text.work, values: career?.activities || [] }, { id: 'skills', label: text.skills, values: career?.skills || [] }, { id: 'workplaces', label: text.workplaces, values: career?.workplaces || [] }, { id: 'good', label: text.good, values: career?.tradeoffs || [] }];
  const currentChapter = chapters.find(c => c.id === chapter)!;
  return <div className={styles.page}>
    <Header />
    <div className={`${styles.explorer} ${paused ? styles.paused : ''}`} style={tone(direction?.presentation)}>
      <main className={`${styles.main} ${home ? styles.home : ''} ${invitation ? styles.invitation : overview ? styles.overview : styles.journey}`}>
        <div className={styles.topline} data-inner={!home || undefined}>
          {!home && breadcrumbs}
          <button className={styles.motion} onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={motionLabel} title={motionLabel}>
            <MotionIcon size={17} aria-hidden="true" />
            <span>{motionLabel}</span>
          </button>
        </div>
      <div key={`${groupKey}:${locale}`} className={styles.stage}>
        {isPending ? <div className={styles.status} role="status"><span className={styles.loadingOrb} />{copy.loading}</div> : isError ? <div className={styles.status}><p role="alert">{copy.error}</p><button className={styles.primary} onClick={() => void refetch()}>{copy.retry}</button></div> : !data?.directions.length || !data.careers.length ? <p className={styles.status} role="status">{copy.empty}</p> : invitation && career && direction ? <section className={styles.invitationContent}>
        <div className={styles.invitationBubble}><Illustration illustration={(parent || career).illustration} placeholder={text.illustration} bubble /></div>
        <p className={styles.eyebrow}>{text.nextStep}</p>
        <h1 ref={heading} tabIndex={-1}>{invite.headingLead}<br /><span>{invite.headingAccent}</span></h1>
        <div className={styles.careerIntent}><p>{invite.choice}</p><h2>{parent?.title || career.title}</h2>{parent && <p>{career.title}</p>}<button className={styles.quiet} onClick={() => navigate({...state,career:null,step:'roles',q:''})}>{invite.change}</button></div>
        <section className={styles.accountBenefits} aria-labelledby="account-benefits-title"><h2 id="account-benefits-title">{invite.benefitsTitle}</h2><ul>{[
          [text.benefitSave, invite.saveDetail], [text.benefitGuide, invite.guideDetail], [text.benefitReturn, invite.returnDetail],
        ].map(([title, detail]) => <li key={title}><span aria-hidden="true">✓</span><div><strong>{title}</strong><p>{detail}</p></div></li>)}</ul></section>
        <div className={styles.invitationActions}><Link className={styles.primary} href={`/signup?${new URLSearchParams({pursueCareer:career.id,directionId:direction.id,next:'/dashboard'})}`}>{invite.create}<ArrowUpRight size={16} /></Link><p>{invite.already} <Link href={`/login?${new URLSearchParams({pursueCareer:career.id,directionId:direction.id,next:'/dashboard'})}`}>{invite.signin}</Link></p></div>
      </section> : overview && career ? <>
        <div className={styles.connection} aria-label={`${direction?.title || ''}, ${parent?.title || career.title}, ${parent ? career.title : text.nextStep}`}>
          <span className={styles.orbit} /><span className={styles.orbitTwo} />
          <button className={`${styles.satellite} ${styles.connectionLink}`} aria-label={direction?.title} disabled={!direction} onClick={() => navigate({ ...state, industry: null, career: null, step: 'roles', q: '' })}><Illustration illustration={direction?.illustration} placeholder={text.illustration} bubble /><span>{direction?.title}</span></button>
          <div className={styles.central}><Illustration illustration={(parent || career).illustration} placeholder={text.illustration} bubble /><span>{parent?.title || career.title}</span></div>
          <div className={styles.satellite}>{parent ? <Illustration illustration={career.illustration} placeholder={text.illustration} bubble /> : <div className={`${styles.media} ${styles.bubbleMedia}`}><Sparkles className={styles.nextSpark} size={42} strokeWidth={1.25} /></div>}<span>{parent ? career.title : text.nextStep}</span></div>
        </div>
        <header className={styles.intro}><p className={styles.eyebrow}>{text.future}</p><h1 ref={heading} tabIndex={-1}>{text.closer}<br /><span>{career.title}.</span></h1><p>{career.summary}</p></header>
        {career.translationFallback && <p className={styles.notice}>{copy.fallback}</p>}
        <div className={styles.chapters} role="tablist" aria-label={career.title}>{chapters.map((item, i) => <button key={item.id} role="tab" id={`chapter-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={chapter === item.id} tabIndex={chapter === item.id ? 0 : -1} onClick={() => setChapter(item.id)} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const target = chapters[(i + (event.key === 'ArrowRight' ? 1 : 3)) % 4]; setChapter(target.id); document.getElementById(`chapter-${target.id}`)?.focus(); } }}><span>{String(i + 1).padStart(2, '0')}</span>{item.label}</button>)}</div>
        <section className={styles.chapterPanel} id={`panel-${chapter}`} role="tabpanel" aria-labelledby={`chapter-${chapter}`}>
          {(chapter === 'skills' || chapter === 'workplaces') && currentChapter.values.length > 0 && <h2 className={styles.chapterTitle}>{chapter === 'skills' ? headings.skillsTitle : headings.placesTitle}</h2>}
          {!currentChapter.values.length ? <p className={styles.missing}>{text.missing}</p> : chapter === 'skills' || chapter === 'workplaces' ? <div className={`${styles.wordBubbles} ${chapter === 'workplaces' ? styles.places : ''}`}>{currentChapter.values.map((value, i) => <span key={`${i}:${value}`} style={{ '--bubble-delay': `${i * -.8}s` } as CSSProperties}>{value}</span>)}</div> : <VisualCarousel key={`${career.id}:${chapter}`} {...common} hint="" variant="fact" label={currentChapter.label} items={currentChapter.values.map((value, i) => ({ id: String(i), title: `${i + 1}` }))} renderItem={(i) => <div className={styles.factBubble}><p>{currentChapter.values[i]}</p></div>} />}
        </section>
        <section className={styles.decision}><div className={styles.decisionBar}><div className={styles.decisionCopy}><h2>{text.chapter}</h2><p>{text.chapterHint}</p></div><div className={styles.decisionActions}><Link className={styles.secondary} href="/assessment">{copy.assessment}<ArrowUpRight size={16} /></Link>{saveState === 'saved' ? <Link className={styles.primary} href="/dashboard">{text.continue}<ArrowRight size={16} /></Link> : <button className={styles.primary} disabled={saveState === 'saving'} onClick={() => void onPursue()}>{saveState === 'saving' ? text.saving : text.pursue}<ArrowRight size={16} /></button>}</div>
          {saveState === 'error' && <p role="alert">{text.saveError}</p>}{saveState === 'saved' && <p role="status">{text.saved}</p>}
          </div>
          {(!user || user.isAnonymous) && <details className={styles.benefits}><summary>{text.benefits}</summary><ul><li>{text.benefitSave}</li><li>{text.benefitGuide}</li><li>{text.benefitReturn}</li></ul></details>}
          <button className={styles.quiet} onClick={() => navigate(initialExploreState)}>{copy.keepExploring} <ArrowRight size={14} /></button>
        </section>
      </> : <>
        <header className={styles.intro}><p className={styles.eyebrow}>{home ? copy.directions : specialization ? career?.title : direction?.title || copy.roles}</p><h1 ref={heading} tabIndex={-1}>{home ? <>{headings.homeLead}<span>{headings.homeAccent}</span></> : specialization ? <>{headings.specialtyLead}<span>{headings.specialtyAccent}</span></> : state.step === 'industries' ? copy.chooseIndustry : <>{headings.dreamLead}<span>{headings.dreamAccent}</span></>}</h1><p>{home ? headings.homeHint : specialization ? career?.summary : direction?.summary}</p>{home && <Link className={styles.quiet} href="/assessment">{copy.assessment}<ArrowUpRight size={14} /></Link>}</header>
        {direction?.translationFallback && <p className={styles.notice}>{copy.fallback}</p>}
        {!choices.length ? <p className={styles.status}>{copy.noMatches}</p> : <VisualCarousel key={groupKey} {...common} label={home ? copy.directions : specialization ? copy.specializations : copy.roles} variant={home ? 'direction' : 'bubble'} items={choices} initialIndex={focusedPositions[groupKey] || 0} onFocus={i => setFocusedPositions(current => ({ ...current, [groupKey]: i }))} renderItem={(i, active) => {
          const item = choices[i];
          const action = home ? text.explore : 'specializationIds' in item && item.specializationIds?.length ? text.specialize : text.meet;
          const open = () => home ? navigate({ ...initialExploreState, direction: item.id, step: 'roles' }) : state.step === 'industries' ? navigate({ ...state, industry: item.id, career: null, step: 'roles' }) : goCareer(item.id);
          return <div className={styles.choiceBody} style={home && 'presentation' in item ? tone(item.presentation) : undefined}><Illustration key={item.id} illustration={'illustration' in item ? item.illustration : undefined} placeholder={text.illustration} bubble={!home} /><div className={styles.cardCopy}><h2>{item.title}</h2><p>{'cardSummary' in item ? item.cardSummary ?? item.summary : item.summary}</p><button tabIndex={active ? 0 : -1} className={styles.cardAction} onClick={open} aria-hidden={!active || undefined} style={{ visibility: home || active ? 'visible' : 'hidden' }}>{action}{home ? <ArrowUpRight size={18} /> : <ArrowRight size={18} />}</button></div></div>;
        }} />}
        {specialization && <button className={styles.quiet} onClick={() => goCareer(career!.id, true)}>{text.meet}: {career?.title}<ArrowRight size={14} /></button>}
      </>}
    </div>
      </main>
    </div>
  </div>;
}
