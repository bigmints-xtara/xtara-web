'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, CirclePause, CirclePlay, Sparkles, MoveHorizontal, ArrowDown, MousePointer2 } from 'lucide-react';
import Header from '@/components/Header';
import { useTranslations } from '@/i18n/language-provider';
import { useAuth } from '@/context/AuthContext';
import { pursueCareer } from '@/lib/career-pursuit-api';
import { explorerCopy } from './explorer/copy';
import DirectionNotes from './explorer/DirectionNotes';
import { guideCopy } from './explorer/guide-copy';
import { journeyCopy, explorerHeadings, invitationCopy } from './explorer/journey-copy';
import { exploreUrl, initialExploreState, readExploreState, type ExploreState } from './explorer/state';
import VisualCarousel from './explorer/VisualCarousel';
import CareerOverviewSections from './explorer/CareerOverviewSections';
import ExplorerAccountContext from './explorer/ExplorerAccountContext';
import styles from './ExploreCareers.module.css';
import { ExplorerScene, explorerTone } from './explorer/ExplorerScene';
import { resolveCareerArtwork, safeSourceUrl } from './explorer/career-artwork';
import { useCareerExplorer } from './explorer/useCareerExplorer';

export { safeSourceUrl } from './explorer/ExplorerScene';

const navigationEvent = 'xtara-explore-navigate';
function subscribe(listener: () => void) { window.addEventListener('popstate', listener); window.addEventListener(navigationEvent, listener); return () => { window.removeEventListener('popstate', listener); window.removeEventListener(navigationEvent, listener); }; }
const snapshot = () => window.location.search;
const serverSnapshot = () => '';
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
  const { data, isPending, isError, refetch } = useCareerExplorer(locale);
  const state = readExploreState(search, data);
  const assessmentHref = `/assessment?${new URLSearchParams({ from: 'explore', returnTo: exploreUrl(state) })}`;
  const [listQuery, setListQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const [saveResult, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveOwner, setSaveOwner] = useState<string>();
  const [saveLocation, setSaveLocation] = useState<string>();
  const saveState = user && !user.isAnonymous && user.uid === saveOwner && search === saveLocation ? saveResult : 'idle';
  const saveGeneration = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const [focusedPositions, setFocusedPositions] = useState<Record<string, number>>({});
  // Let Next copy its own history state and synchronize the canonical URL.
  // Reusing its __NA-marked state skips that hook, so locale refresh loses the route.
  const navigate = (next: ExploreState) => { setListQuery(''); saveGeneration.current += 1; window.history.pushState(null, '', exploreUrl(next)); window.dispatchEvent(new Event(navigationEvent)); setSaveState('idle'); requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo?.({ top: 0, behavior: 'instant' }); }); };
  const direction = data?.directions.find(d => d.id === state.direction);
  const career = data?.careers.find(c => c.id === state.career);
  const parent = data?.careers.find(c => c.id === career?.parentCareerId);
  const selectedArtwork = resolveCareerArtwork(data, career, direction?.id);
  const parentArtwork = resolveCareerArtwork(data, parent, direction?.id);
  const directionUrl = direction?.illustration && safeSourceUrl(direction.illustration.url);
  const centerArtwork = parent ? parentArtwork : selectedArtwork;
  const centerContextShown = Boolean(centerArtwork.illustration && centerArtwork.illustration.url === directionUrl);
  const detailContextShown = Boolean(selectedArtwork.illustration && (
    selectedArtwork.illustration.url === directionUrl ||
    selectedArtwork.illustration.url === parentArtwork.illustration?.url
  ));
  const specialization = state.step === 'specializations';
  const invitation = state.step === 'pursuit' && Boolean(career) && (!user || user.isAnonymous);
  const overview = Boolean(career && !specialization && !invitation);
  const home = state.step === 'directions';
  const params = new URLSearchParams(search);
  const introduction = !['view', 'direction', 'industry', 'career', 'step', 'q'].some(key => params.has(key));
  const guide = guideCopy[locale];
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
      <li><Button variant="ghost" onClick={() => navigate({ ...initialExploreState, view: state.view })}>{copy.directions}</Button></li>
      {direction && <li>
        <ChevronRight aria-hidden="true" />
        {directionIsCurrent ? <span aria-current="page">{direction.title}</span> :
          <Button variant="ghost" onClick={() => navigate({ ...state, industry: null, career: null, step: 'roles', q: '' })}>{direction.title}</Button>}
      </li>}
      {parent && <li><ChevronRight aria-hidden="true" /><Button variant="ghost" onClick={() => goCareer(parent.id)}>{parent.title}</Button></li>}
      {career && <li>
        <ChevronRight aria-hidden="true" />
        <span aria-current="page">{invitation ? invite.yourDream : specialization ? copy.specializations : career.title}</span>
      </li>}
    </ol>
  </nav>;
  const common = { previous: text.previous, next: text.next, hint: text.swipe };
  const choices = !data ? [] : home ? data.directions : specialization ? (career?.specializationIds || []).flatMap(id => data.careers.find(c => c.id === id) ?? []) : state.step === 'industries' ? data.industries.filter(i => direction?.industryIds.includes(i.id)).map(i => ({ ...i, summary: i.description })) : (state.industry ? data.industries.find(i => i.id === state.industry)?.careerIds || [] : direction?.careerIds || data.careers.map(c => c.id)).flatMap(id => data.careers.find(c => c.id === id) ?? []).filter((c, i, all) => all.findIndex(item => item.id === c.id) === i && (!c.parentCareerId || !all.some(item => item.id === c.parentCareerId)));
  const careerArtwork = new Map(choices.flatMap(item => {
    if (home || state.step === 'industries') return [];
    const record = data?.careers.find(career => career.id === item.id);
    return [[item.id, resolveCareerArtwork(data, record, direction?.id)] as const];
  }));
  const sceneCounts = new Map<string, number>();
  for (const { illustration } of careerArtwork.values()) {
    if (illustration) sceneCounts.set(illustration.url, (sceneCounts.get(illustration.url) ?? 0) + 1);
  }

  return <div className={styles.page}>
    <Header />
    <div className={`${styles.explorer} ${paused ? styles.paused : ''}`} style={explorerTone(direction?.presentation)}>
      <main className={`${styles.main} ${home ? styles.home : ''} ${invitation ? styles.invitation : overview ? styles.overview : styles.journey}`}>
        {introduction && <div className={styles.guideNavigation}>
          <Link aria-label={copy.back} href={user && !user.isAnonymous ? '/dashboard' : '/'} onNavigate={event => {
            const navigation = (window as Window & { navigation?: { canGoBack: boolean } }).navigation;
            if (navigation?.canGoBack ?? (window.history.length > 1 && document.referrer.startsWith(window.location.origin + '/'))) {
              event.preventDefault();
              window.history.back();
            }
          }}><ArrowLeft size={22} aria-hidden="true" /></Link>
        </div>}
        {!introduction && <div className={styles.topline} data-inner={!home || undefined}>
          {!home && breadcrumbs}
          <Button variant="ghost" size="icon" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={motionLabel} title={motionLabel}>
            <MotionIcon size={17} aria-hidden="true" />
            <span>{motionLabel}</span>
          </Button>
        </div>}
      <div key={`${groupKey}:${locale}`} className={styles.stage}>
        {introduction ? <section className={styles.guideIntro}>
        <div className={styles.guideArt} aria-hidden="true">
          {['digital','art','science'].map(item => <span key={item}><Image unoptimized src={`/images/explorer-guide/${item}.webp`} alt="" width="110" height="120" /></span>)}
        </div>
        <h1 ref={heading} tabIndex={-1}>{guide.guideTitle}</h1>
        <p>{guide.guideLead}</p>
        <Button onClick={() => navigate(initialExploreState)}>{guide.guideStart}<ArrowRight size={16}/></Button>
      </section> : isPending ? <div className={styles.status} role="status"><span className={styles.loadingOrb} />{copy.loading}</div> : isError ? <div className={styles.status}><p role="alert">{copy.error}</p><Button onClick={() => void refetch()}>{copy.retry}</Button></div> : !data?.directions.length || !data.careers.length ? <p className={styles.status} role="status">{copy.empty}</p> : invitation && career && direction ? <section className={styles.invitationContent}>
        <div className={styles.invitationBubble}><ExplorerScene illustration={selectedArtwork.illustration} contextTitle={selectedArtwork.contextTitle} placeholder={text.illustration} bubble /></div>
        <p className={styles.eyebrow}>{text.nextStep}</p>
        <h1 ref={heading} tabIndex={-1}>{invite.headingLead}<br /><span>{invite.headingAccent}</span></h1>
        <div className={styles.careerIntent}><p>{invite.choice}</p><h2>{parent?.title || career.title}</h2>{parent && <p>{career.title}</p>}<Button variant="ghost" onClick={() => navigate({...state,career:null,step:'roles',q:''})}>{invite.change}</Button></div>
        <section className={styles.accountBenefits} aria-labelledby="account-benefits-title"><h2 id="account-benefits-title">{invite.benefitsTitle}</h2><ul>{[
          [text.benefitSave, invite.saveDetail], [text.benefitGuide, invite.guideDetail], [text.benefitReturn, invite.returnDetail],
        ].map(([title, detail]) => <li key={title}><span aria-hidden="true">✓</span><div><strong>{title}</strong><p>{detail}</p></div></li>)}</ul></section>
        <ExplorerAccountContext />
        <div className={styles.invitationActions}><Link className={styles.primary} href={`/signup?${new URLSearchParams({pursueCareer:career.id,directionId:direction.id,next:'/dashboard'})}`}>{invite.create}<ArrowUpRight size={16} /></Link><p>{invite.already} <Link href={`/login?${new URLSearchParams({pursueCareer:career.id,directionId:direction.id,next:'/dashboard'})}`}>{invite.signin}</Link></p></div>
      </section> : overview && career ? <>
        <div className={styles.connection} aria-label={`${direction?.title || ''}, ${parent?.title || career.title}, ${parent ? career.title : text.nextStep}`}>
          <span className={styles.orbit} /><span className={styles.orbitTwo} />
          <Button variant="surface" className={`${styles.satellite} ${styles.connectionLink}`} aria-label={direction?.title} disabled={!direction} onClick={() => navigate({ ...state, industry: null, career: null, step: 'roles', q: '' })}><ExplorerScene illustration={direction?.illustration} placeholder={text.illustration} bubble /><span>{direction?.title}</span></Button>
          <div className={styles.central}><ExplorerScene illustration={centerContextShown ? undefined : centerArtwork.illustration}
            contextTitle={centerArtwork.contextTitle} contextShown={centerContextShown} placeholder={text.illustration} bubble /><span>{parent?.title || career.title}</span></div>
          <div className={styles.satellite}>{parent ? <ExplorerScene illustration={detailContextShown ? undefined : selectedArtwork.illustration} contextTitle={selectedArtwork.contextTitle} contextShown={detailContextShown} placeholder={text.illustration} bubble /> : <div className={`${styles.media} ${styles.bubbleMedia}`}><Sparkles className={styles.nextSpark} size={42} strokeWidth={1.25} /></div>}<span>{parent ? career.title : text.nextStep}</span></div>
        </div>
        <header className={styles.intro}><p className={styles.eyebrow}>{text.future}</p><h1 ref={heading} tabIndex={-1}>{text.closer}<br /><span>{career.title}.</span></h1><p>{career.summary}</p></header>
        {(career.translationFallback || parent?.translationFallback || direction?.translationFallback) && <p className={styles.notice}>{copy.fallback}</p>}
        {locale !== 'en' && <p className={styles.notice}>Career guidance below is currently in English.</p>}
        {direction && <section className={styles.directionNotes}>
          <h2>{guide.pathHeading}</h2>
          <p>{(parent ? guide.pathTrio : guide.pathPair).replace('{direction}', direction.title).replace('{career}', (parent || career).title).replace('{specialty}', career.title)}</p>
          {[direction, ...(parent ? [parent] : [])].filter(item => item.summary).map(item => <div key={item.id}><h3>{item.title}</h3><p>{item.summary}</p></div>)}
        </section>}
        <CareerOverviewSections career={career} />
        <section className={styles.decision}><ExplorerAccountContext /><div className={styles.decisionBar}><div className={styles.decisionCopy}><h2>{text.chapter}</h2><p>{text.chapterHint}</p></div><div className={styles.decisionActions}><Link className={styles.secondary} href={assessmentHref}>{copy.assessment}<ArrowUpRight size={16} /></Link>{saveState === 'saved' ? <Link className={styles.primary} href="/dashboard">{text.continue}<ArrowRight size={16} /></Link> : <Button disabled={saveState === 'saving'} onClick={() => void onPursue()}>{saveState === 'saving' ? text.saving : text.pursue}<ArrowRight size={16} /></Button>}</div>
          {saveState === 'error' && <p role="alert">{text.saveError}</p>}{saveState === 'saved' && <p role="status">{text.saved}</p>}
          </div>
          {(!user || user.isAnonymous) && <details className={styles.benefits}><summary>{text.benefits}</summary><ul><li>{text.benefitSave}</li><li>{text.benefitGuide}</li><li>{text.benefitReturn}</li></ul></details>}
          <Button variant="ghost" onClick={() => navigate(initialExploreState)}>{copy.keepExploring} <ArrowRight size={14} /></Button>
        </section>
      </> : <>
        <section className={styles.browseFold}>
        <header className={`${styles.intro} ${styles.browseIntro}`}>
          {!home && !specialization && <div className={styles.contextArtwork} aria-hidden="true">
            <ExplorerScene illustration={direction?.illustration} placeholder={text.illustration} bubble />
          </div>}
          <div>
            {!home && <p className={styles.eyebrow}>{specialization ? career?.title : direction?.title || copy.roles}</p>}
            <h1 ref={heading} tabIndex={-1}>
              {home ? <>{headings.homeLead}<span>{headings.homeAccent}</span></> :
                specialization ? <>{headings.specialtyLead}<span>{headings.specialtyAccent}</span></> :
                state.step === 'industries' ? copy.chooseIndustry : <>{headings.dreamLead}<span>{headings.dreamAccent}</span></>}
            </h1>
          </div>
        </header>
        {!choices.length ? <p className={styles.status}>{copy.noMatches}</p> : <VisualCarousel key={`carousel:${groupKey}`} {...common} label={home ? copy.directions : specialization ? copy.specializations : copy.roles} variant={home ? 'direction' : 'bubble'} items={choices} initialIndex={focusedPositions[groupKey] || 0} onFocus={i => setFocusedPositions(current => ({ ...current, [groupKey]: i }))} renderItem={(i, active) => {
          const item = choices[i];
          const action = home ? text.explore : 'specializationIds' in item && item.specializationIds?.length ? text.specialize : text.meet;
          const open = () => home ? navigate({ ...initialExploreState, direction: item.id, step: 'roles' }) : state.step === 'industries' ? navigate({ ...state, industry: item.id, career: null, step: 'roles' }) : goCareer(item.id);
          const artwork = careerArtwork.get(item.id);
          const repeatedContext = !active && Boolean(artwork?.contextTitle && artwork.illustration &&
            (sceneCounts.get(artwork.illustration.url) ?? 0) > 1);
          const illustration = artwork ? artwork.illustration : 'illustration' in item ? item.illustration : undefined;
          return (
            <div className={styles.choiceBody} style={home && 'presentation' in item ? explorerTone(item.presentation) : undefined}>
              <ExplorerScene key={item.id} illustration={repeatedContext ? undefined : illustration} contextTitle={artwork?.contextTitle}
                contextShown={repeatedContext} placeholder={text.illustration} bubble={!home} />
              <div className={styles.cardCopy}>
                <h2>{item.title}</h2>
                <p>{'cardSummary' in item ? item.cardSummary ?? item.summary : item.summary}</p>
                <Button variant="surface" className={styles.cardAction} tabIndex={active ? 0 : -1} onClick={open}
                  aria-hidden={!active || undefined} style={{ visibility: active ? 'visible' : 'hidden' }}>
                  {action}{home ? <ArrowUpRight aria-hidden="true" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
                </Button>
              </div>
            </div>
          );
        }} />}
        </section>
        {home && <section className={styles.directionNotes}><h2>{guide.howTo}</h2>
          <ul className={styles.helpSteps}>
            <li><MoveHorizontal aria-hidden="true"/>{guide.guideBrowse}</li>
            <li><MousePointer2 aria-hidden="true"/>{guide.guideOpen}</li>
            <li><ArrowDown aria-hidden="true"/>{guide.guideScroll}</li>
          </ul>
          <Link className={styles.quiet} href={assessmentHref}>{copy.assessment}<ArrowUpRight size={14} /></Link>
        </section>}
        {state.step === 'roles' && direction && <DirectionNotes direction={direction} careers={data.careers} locale={locale} />}
        {specialization && career && <section className={styles.directionNotes}>
          <h2>{guide.about.replace('{name}', career.title)}</h2><p>{career.summary}</p>
          {career.activities.length > 0 && <div><h3>{guide.workExamples}</h3><ul>{career.activities.slice(0,2).map(line => <li key={line}>{line}</li>)}</ul></div>}
          {!!career.workplaces?.length && <div><h3>{guide.places}</h3><p>{career.workplaces.join(' · ')}</p></div>}
        </section>}
        {(direction?.translationFallback || (specialization && career?.translationFallback)) && <p className={styles.notice}>{copy.fallback}</p>}
        {!home && state.step !== 'industries' && <details className={styles.completeList} key={`directory:${groupKey}`}>
          <summary>{specialization ? 'All specializations' : 'All careers in this direction'} · {choices.length} {specialization ? 'specializations' : 'careers and groups'}</summary>
          <p>Groups open their specializations. Careers may appear in more than one direction.</p>
          <label>Find a career<Input type="search" value={listQuery} onChange={event => setListQuery(event.target.value)} /></label>
          <ul>{choices.filter(item => `${item.title} ${item.summary}`.toLocaleLowerCase(locale).includes(listQuery.toLocaleLowerCase(locale))).map(item => <li key={item.id}><Button variant="surface" onClick={() => goCareer(item.id)}><span>{item.title}</span>{'specializationIds' in item && Boolean(item.specializationIds?.length) && <small>{item.specializationIds?.length} specializations</small>}<ArrowRight size={16} /></Button></li>)}</ul>
          {listQuery && !choices.some(item => `${item.title} ${item.summary}`.toLocaleLowerCase(locale).includes(listQuery.toLocaleLowerCase(locale))) && <p role="status">{copy.noMatches}</p>}
        </details>}
        {specialization && <Button variant="ghost" onClick={() => goCareer(career!.id, true)}>{text.meet}: {career?.title}<ArrowRight size={14} /></Button>}
      </>}
    </div>
      </main>
    </div>
  </div>;
}
