"use client";

import { trackProductEvent } from "@/lib/analytics";
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Heart, MessageCircle, Plus, RefreshCw, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { Button } from '@/components/ui/button';
import copy from '@/lib/career-conversation-copy.json';
import { getConversations, getTeacherConversations, shareConversation, updateConversation, type CareerConversation, type ConversationInput, type ConversationMutation, type ConversationPage } from '@/lib/career-conversations';
import styles from './guidance.module.css';

export function useConversationCopy() { const { locale } = useTranslations(); return { c: copy[locale] || copy.en, locale }; }
function date(value: string | null, locale: string) { return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'; }
function today() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }

export function StudentGuidanceEntry() {
  const { c } = useConversationCopy();
  return <section className={styles.garden}><div className={styles.entry}>
    <span className={styles.entryIcon}><MessageCircle aria-hidden="true" size={27} /></span>
    <div className="min-w-0 flex-1"><h2 className="text-lg font-medium">{c.journal}</h2><p>{c.studentIntro}</p></div>
    <Button asChild className={styles.primary}><Link href="/guidance">{c.openJournal}<ArrowRight size={17} /></Link></Button>
  </div></section>;
}

export function ConversationJournal({ membershipId, studentName }: { membershipId?: string; studentName?: string }) {
  const { user, loading } = useAuth();
  const { c } = useConversationCopy();
  if (loading || !user || user.isAnonymous) return <div className={`${styles.garden} ${styles.skeleton}`} role="status" aria-label={c.loading} />;
  return <JournalBody key={`${user.uid}:${membershipId || 'me'}`} uid={user.uid} membershipId={membershipId} studentName={studentName} />;
}

function JournalBody({ uid, membershipId, studentName }: { uid: string; membershipId?: string; studentName?: string }) {
  const { c } = useConversationCopy();
  const [page, setPage] = useState<ConversationPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [composing, setComposing] = useState(false);
  const [paging, setPaging] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) { setLoading(true); setError(''); } });
    getConversations(uid, membershipId).then(value => { if (active) setPage(value); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : c.error); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, membershipId, attempt, c.error]);
  const receive = useCallback((record: CareerConversation) => {
    setPage(previous => previous ? { ...previous, items: previous.items.some(item => item.id === record.id) ? previous.items.map(item => item.id === record.id ? record : item) : [record, ...previous.items] } : { items: [record], nextOffset: null, canRecord: Boolean(membershipId) });
    setSaved(true);
  }, [membershipId]);
  async function more() {
    if (page?.nextOffset == null) return;
    setPaging(true); setError('');
    try { const next = await getConversations(uid, membershipId, page.nextOffset); setPage(previous => ({ ...next, items: [...(previous?.items || []), ...next.items.filter(item => !previous?.items.some(old => old.id === item.id))] })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : c.error); }
    finally { setPaging(false); }
  }
  return <section id="conversation-journal" className={`${styles.garden} ${styles.journal}`} aria-labelledby="journal-title">
    <div className={styles.sectionTop}><div><p className={styles.eyebrow}><MessageCircle size={17} />{membershipId ? studentName : c.connected}</p><h2 id="journal-title" className={styles.sectionHeading}>{c.journal}</h2><p className={styles.intro}>{c.intro}</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="ghost" aria-label={c.refresh} disabled={loading} onClick={() => setAttempt(value => value + 1)}><RefreshCw size={17} /></Button>{page?.canRecord && !composing && <Button className={styles.primary} onClick={() => { setComposing(true); setSaved(false); }}><Plus size={18} />{c.record}</Button>}</div>
    </div>
    {error && <div role="alert" className={`${styles.status} ${styles.error}`}>{error} <Button variant="ghost" onClick={() => setAttempt(value => value + 1)}>{c.retry}</Button></div>}
    {saved && <p role="status" className={styles.status}><Check className="mr-2 inline" size={16} />{c.saved}</p>}
    {loading && <div className={styles.skeleton} role="status" aria-label={c.loading} />}
    {composing && membershipId && <ConversationForm uid={uid} membershipId={membershipId} onCancel={() => setComposing(false)} onSaved={record => { receive(record); setComposing(false); }} />}
    {!loading && page && page.items.length === 0 && !composing && <div className={styles.empty}><BookOpen aria-hidden="true" size={42} /><h3 className={styles.sectionHeading}>{c.emptyTitle}</h3><p>{membershipId ? c.emptyBody : c.studentEmpty}</p></div>}
    {page && page.items.length > 0 && <div className={styles.timeline}>{page.items.map(record => <ConversationNote key={record.id} uid={uid} record={record} membershipId={membershipId} onSaved={receive} />)}</div>}
    {page?.nextOffset != null && <Button variant="outline" className="mt-7" disabled={paging} onClick={() => void more()}>{paging ? c.loading : c.loadMore}</Button>}
  </section>;
}

function ConversationForm({ uid, membershipId, onCancel, onSaved }: { uid: string; membershipId: string; onCancel: () => void; onSaved: (record: CareerConversation) => void }) {
  const { c } = useConversationCopy();
  const [requestId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState(''); const [recap, setRecap] = useState('');
  const [occurredOn, setOccurredOn] = useState(today); const [followUpOn, setFollowUpOn] = useState('');
  const [actions, setActions] = useState<ConversationInput['actions']>([{ text: '', owner: 'student' }]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { onSaved(await shareConversation(uid, membershipId, { requestId, title, recap, occurredOn, followUpOn: followUpOn || null, actions: actions.filter(action => action.text.trim()) })); trackProductEvent("guidance_conversation_saved", "educator_portal"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : c.error); }
    finally { setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit} aria-label={c.record}>
    <h3 className={styles.sectionHeading}>{c.record}</h3><p className={styles.notice}><Heart size={18} className="shrink-0" />{c.sharedNotice}</p>
    <fieldset disabled={busy}>
      <label>{c.title}<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder={c.titlePlaceholder} /></label>
      <label>{c.recap}<textarea required maxLength={2000} value={recap} onChange={event => setRecap(event.target.value)} placeholder={c.recapPlaceholder} /><small className="font-normal text-muted-foreground">{c.recordHint}</small></label>
      <div className={styles.dates}><label>{c.date}<input required type="date" max={today()} value={occurredOn} onChange={event => setOccurredOn(event.target.value)} /></label><label>{c.checkIn} · {c.optional}<input type="date" min={occurredOn} value={followUpOn} onChange={event => setFollowUpOn(event.target.value)} /></label></div>
      <div><h4 className="mb-3 font-medium">{c.steps}</h4><div className="grid gap-4">{actions.map((action, index) => <div key={index} className={styles.stepForm}><label>{c.startSmall} {index + 1}<input maxLength={240} value={action.text} onChange={event => setActions(items => items.map((item, i) => i === index ? { ...item, text: event.target.value } : item))} placeholder={c.stepPlaceholder} /></label><label>{c.by}<select value={action.owner} onChange={event => setActions(items => items.map((item, i) => i === index ? { ...item, owner: event.target.value as 'student' | 'educator' } : item))}><option value="student">{c.student}</option><option value="educator">{c.teacher}</option></select></label><Button type="button" variant="ghost" aria-label={`${c.remove} ${index + 1}`} onClick={() => setActions(items => items.filter((_, i) => i !== index))}><X size={18} /></Button></div>)}</div>{actions.length < 3 && <Button type="button" variant="ghost" className="mt-3" onClick={() => setActions(items => [...items, { text: '', owner: 'student' }])}><Plus size={17} />{c.addStep}</Button>}</div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.formFooter}><Button type="submit" className={styles.primary}><Send size={16} />{busy ? c.saving : c.share}</Button><Button type="button" variant="ghost" onClick={onCancel}>{c.cancel}</Button></div>
    </fieldset>
  </form>;
}

function ConversationNote({ uid, record, membershipId, onSaved }: { uid: string; record: CareerConversation; membershipId?: string; onSaved: (record: CareerConversation) => void }) {
  const { c, locale } = useConversationCopy();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [draft, setDraft] = useState({ baseline: record.reflection, value: record.reflection });
  const reflection = draft.value === draft.baseline ? record.reflection : draft.value;
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ title: record.title, recap: record.recap, followUpOn: record.followUpOn || '' });
  async function mutate(input: Omit<ConversationMutation, 'version'>) {
    setBusy(true); setError('');
    try { const saved = await updateConversation(uid, record, { ...input, version: record.version } as ConversationMutation, membershipId); onSaved(saved); if (input.kind === 'reflection') setDraft({ baseline: saved.reflection, value: saved.reflection }); if (input.kind === 'edit') setEditing(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : c.error); }
    finally { setBusy(false); }
  }
  return <article className={styles.note} aria-label={record.title}>
    <div className={styles.noteMeta}><time dateTime={record.occurredOn}>{date(record.occurredOn, locale)}</time><span>{c.by} {record.educatorName}</span><span>· {c.sharedOn} {date(record.createdAt, locale)}</span></div>
    {editing ? <form className={styles.form} onSubmit={event => { event.preventDefault(); void mutate({ kind: 'edit', ...edit, followUpOn: edit.followUpOn || null } as ConversationMutation); }}><fieldset disabled={busy}><label>{c.title}<input required maxLength={120} value={edit.title} onChange={event => setEdit(value => ({ ...value, title: event.target.value }))} /></label><label>{c.recap}<textarea required maxLength={2000} value={edit.recap} onChange={event => setEdit(value => ({ ...value, recap: event.target.value }))} /></label><label>{c.checkIn}<input type="date" min={record.occurredOn} value={edit.followUpOn} onChange={event => setEdit(value => ({ ...value, followUpOn: event.target.value }))} /></label><div className={styles.formFooter}><Button type="submit" className={styles.primary}>{busy ? c.saving : c.saveChanges}</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>{c.cancel}</Button></div></fieldset></form> : <div className={styles.noteLayout}><div><h3>{record.title}</h3><p className={styles.recap}>{record.recap}</p>{membershipId && record.canWrite && <Button variant="ghost" size="sm" disabled={busy} className="mt-2 -ml-3" onClick={() => { setEdit({ title: record.title, recap: record.recap, followUpOn: record.followUpOn || '' }); setEditing(true); }}>{c.edit}</Button>}</div><aside className={styles.checkIn}><p>{c[record.checkInState]}</p><strong>{date(record.followUpOn, locale)}</strong>{record.actions.length > 0 && <p>{record.completedActions} {c.of} {record.actions.length} {c.done}</p>}{membershipId && record.canWrite && <Button variant="ghost" size="sm" className="mt-3 h-auto whitespace-normal text-left" disabled={busy} onClick={() => void mutate({ kind: 'review', reviewed: !record.reviewedAt } as ConversationMutation)}>{record.reviewedAt ? c.reopen : c.review}</Button>}</aside></div>}
    <div className={styles.actions}>{record.actions.map(action => <label key={action.id} className={styles.action}><input type="checkbox" checked={Boolean(action.completedAt)} disabled={busy || !record.canWrite || action.owner !== (membershipId ? 'educator' : 'student')} onChange={event => void mutate({ kind: 'action', actionId: action.id, completed: event.target.checked } as ConversationMutation)} /><span>{action.text}<small>{action.owner === 'student' ? membershipId ? record.studentName : c.stepByYou : membershipId ? c.teacher : c.stepByTeacher}{action.completedAt ? ` · ${date(action.completedAt, locale)}` : ''}</small></span></label>)}</div>
    {!record.actions.length && <p className={styles.notice}>{c.noActions}</p>}
    {membershipId ? record.reflection && <div className={styles.reflection}><span className={styles.eyebrow}><Sparkles size={16} />{record.studentName} · {date(record.reflectionAt, locale)}</span><p>{record.reflection}</p></div> : <form className={styles.reflection} onSubmit={event => { event.preventDefault(); void mutate({ kind: 'reflection', reflection } as ConversationMutation); }}><label className="grid gap-2 text-sm font-medium">{c.reflection}<textarea maxLength={1200} disabled={!record.canWrite || busy} value={reflection} onChange={event => setDraft({ baseline: record.reflection, value: event.target.value })} placeholder={c.reflectionPlaceholder} /></label><p>{c.reflectionHint}</p>{record.canWrite && <Button className={`${styles.soft} mt-4`} disabled={busy || reflection.trim() === record.reflection} type="submit">{busy ? c.saving : c.shareReflection}</Button>}</form>}
    {!record.canWrite && <p className={styles.notice}>{c.readOnly}</p>}
    {error && <p role="alert" className={`${styles.status} ${styles.error}`}>{error}</p>}
  </article>;
}

export function TeacherConversationFeed() {
  const { user } = useAuth(); const { c, locale } = useConversationCopy();
  const [state, setState] = useState<{ uid?: string; page?: ConversationPage; error?: string }>({});
  const [attempt, setAttempt] = useState(0); const [expanded, setExpanded] = useState(false); const [paging, setPaging] = useState(false);
  useEffect(() => { if (!user || user.isAnonymous) return; let active = true; getTeacherConversations(user.uid).then(page => { if (active) setState({ uid: user.uid, page }); }).catch(reason => { if (active) setState({ uid: user.uid, error: reason instanceof Error ? reason.message : c.error }); }); return () => { active = false; }; }, [user, attempt, c.error]);
  const page = state.uid === user?.uid ? state.page : undefined;
  return <section className={`${styles.garden} ${styles.paper}`}><p className={styles.eyebrow}><MessageCircle size={16} />{c.journal}</p><h2 className={`${styles.sectionHeading} mt-3`}>{c.teacherFeed}</h2><p className={styles.intro}>{c.teacherFeedIntro}</p>
    {state.uid === user?.uid && state.error ? <p role="alert" className={styles.status}>{state.error}<Button variant="ghost" onClick={() => setAttempt(value => value + 1)}>{c.retry}</Button></p> : !page ? <div className={`${styles.skeleton} mt-5`} role="status" aria-label={c.loading} /> : !page.items.length ? <p className="mt-8 text-sm leading-7 text-muted-foreground">{c.teacherFeedEmpty}</p> : <div className={styles.feedList}>{page.items.slice(0, expanded ? undefined : 3).map(record => <Link key={record.id} className={styles.feedItem} href={`/organization/students/${encodeURIComponent(record.membershipId)}#conversation-journal`}><span className="text-xs">{record.studentName}</span><h3>{record.title}</h3><small>{c[record.checkInState]} {record.followUpOn ? `· ${date(record.followUpOn, locale)}` : ''}</small><small>{record.completedActions} {c.of} {record.actions.length} {c.done}{record.reflection ? ` · ${c.reflection}` : ''}</small></Link>)}</div>}
    {page && page.items.length > 3 && !expanded && <Button variant="ghost" className="mt-4" onClick={() => setExpanded(true)}>{c.showAll}<ArrowRight size={16} /></Button>}
    {page?.nextOffset != null && expanded && <Button variant="ghost" className="mt-4" disabled={paging} onClick={async () => { if (!user) return; setPaging(true); try { const next = await getTeacherConversations(user.uid, page.nextOffset!); setState({ uid: user.uid, page: { ...next, items: [...page.items, ...next.items.filter(item => !page.items.some(old => old.id === item.id))] } }); } catch (reason) { setState(previous => ({ ...previous, error: reason instanceof Error ? reason.message : c.error })); } finally { setPaging(false); } }}>{paging ? c.loading : c.loadMore}</Button>}
  </section>;
}
