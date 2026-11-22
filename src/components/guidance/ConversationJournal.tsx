"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import Skeleton from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trackProductEvent } from "@/lib/analytics";
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Heart, MessageCircle, Plus, RefreshCw, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from '@/i18n/language-provider';
import { Button } from '@/components/ui/button';
import copy from '@/lib/career-conversation-copy.json';
import { getConversations, getTeacherConversations, shareConversation, updateConversation, type CareerConversation, type ConversationInput, type ConversationMutation, type ConversationPage } from '@/lib/career-conversations';
import journey from '@/components/journey/journey.module.css';
import styles from './ConversationJournal.module.css';

export function useConversationCopy() { const { locale } = useTranslations(); return { c: copy[locale] || copy.en, locale }; }
function date(value: string | null, locale: string) { return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : '—'; }
function today() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }

export function StudentGuidanceEntry() {
  const { c } = useConversationCopy();
  const { user, loading } = useAuth();
  const uid = !loading && user && !user.isAnonymous ? user.uid : null;
  const [sharedWith, setSharedWith] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    let generation = 0;
    const refresh = () => {
      const requested = ++generation;
      getConversations(uid).then(page => {
        if (requested === generation) setSharedWith(page.items.length > 0 ? uid : null);
      }).catch(() => {
        if (requested === generation) setSharedWith(null);
      });
    };
    window.addEventListener('focus', refresh);
    refresh();
    return () => {
      generation += 1;
      window.removeEventListener('focus', refresh);
    };
  }, [uid]);
  if (!uid || sharedWith !== uid) return null;
  return <section className="site-frame"><Card className={styles.entry}>
    <span className={styles.entryIcon}><MessageCircle aria-hidden="true" size={27} /></span>
    <div className="min-w-0 flex-1"><h2 className="text-lg font-medium">{c.journal}</h2><p>{c.studentIntro}</p></div>
    <Button asChild className="min-h-11"><Link href="/guidance">{c.openJournal}<ArrowRight size={17} /></Link></Button>
  </Card></section>;
}

export function ConversationJournal({ membershipId, studentName }: { membershipId?: string; studentName?: string }) {
  const { user, loading } = useAuth();
  const { c } = useConversationCopy();
  if (loading || !user || user.isAnonymous) return <div role="status" aria-label={c.loading}><Skeleton className="my-6 h-32 !bg-muted motion-reduce:animate-none" /></div>;
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
    getConversations(uid, membershipId).then(value => { if (active) setPage(value); }).catch(() => { if (active) setError(c.loadError); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, membershipId, attempt, c.loadError]);
  const receive = useCallback((record: CareerConversation) => {
    setPage(previous => previous ? { ...previous, items: previous.items.some(item => item.id === record.id) ? previous.items.map(item => item.id === record.id ? record : item) : [record, ...previous.items] } : { items: [record], nextOffset: null, canRecord: Boolean(membershipId) });
    setSaved(true);
  }, [membershipId]);
  async function more() {
    if (page?.nextOffset == null) return;
    setPaging(true); setError('');
    try { const next = await getConversations(uid, membershipId, page.nextOffset); setPage(previous => ({ ...next, items: [...(previous?.items || []), ...next.items.filter(item => !previous?.items.some(old => old.id === item.id))] })); }
    catch { setError(c.loadError); }
    finally { setPaging(false); }
  }
  const Heading = membershipId ? 'h2' : 'h1';
  const EntryHeading = membershipId ? 'h3' : 'h2';
  return <section id="conversation-journal" className={styles.journal} aria-labelledby="journal-title">
    <div className={styles.sectionTop}>
      <div>
        <Heading id="journal-title" className={membershipId ? styles.sectionHeading : journey.dashboardHeading}>{c.journal}</Heading>
        <p className={styles.intro}>{membershipId ? [studentName, c.intro].filter(Boolean).join(' · ') : c.studentIntro}</p>
      </div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="icon" className="size-11" aria-label={c.refresh} disabled={loading} onClick={() => setAttempt(value => value + 1)}><RefreshCw size={17} /></Button>{page?.canRecord && !composing && <Button className="min-h-11" onClick={() => { setComposing(true); setSaved(false); }}><Plus size={18} />{c.record}</Button>}</div>
    </div>
    {error && <div role="alert" className={`${styles.status} ${styles.error}`}>{error} <Button variant="ghost" onClick={() => setAttempt(value => value + 1)}>{c.retry}</Button></div>}
    {saved && <p role="status" className={styles.status}><Check className="mr-2 inline" size={16} />{c.saved}</p>}
    {loading && <div role="status" aria-label={c.loading}><Skeleton className="h-32 !bg-muted motion-reduce:animate-none" /></div>}
    {composing && membershipId && <ConversationForm uid={uid} membershipId={membershipId} onCancel={() => setComposing(false)} onSaved={record => { receive(record); setComposing(false); }} />}
    {!loading && page && page.items.length === 0 && !composing && <Card className={styles.empty}><span className={styles.entryIcon}><BookOpen aria-hidden="true" size={24} /></span><EntryHeading className={styles.entryHeading}>{c.emptyTitle}</EntryHeading><p>{membershipId ? c.emptyBody : c.studentEmpty}</p></Card>}
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
  return <Card className={styles.compose}><form className={styles.form} onSubmit={submit} aria-label={c.record}>
    <h3 className={styles.sectionHeading}>{c.record}</h3><p className={styles.notice}><Heart size={18} className="shrink-0" />{c.sharedNotice}</p>
    <FieldSet disabled={busy}>
      <Label>{c.title}<Input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder={c.titlePlaceholder} /></Label>
      <Label>{c.recap}<Textarea required maxLength={2000} value={recap} onChange={event => setRecap(event.target.value)} placeholder={c.recapPlaceholder} /><small className="font-normal text-muted-foreground">{c.recordHint}</small></Label>
      <div className={styles.dates}><Label>{c.date}<Input required type="date" max={today()} value={occurredOn} onChange={event => setOccurredOn(event.target.value)} /></Label><Label>{c.checkIn} · {c.optional}<Input type="date" min={occurredOn} value={followUpOn} onChange={event => setFollowUpOn(event.target.value)} /></Label></div>
      <div><h4 className="mb-3 font-medium">{c.steps}</h4><div className="grid gap-4">{actions.map((action, index) => <div key={index} className={styles.stepForm}><Label>{c.actionLabel} {index + 1}<Input maxLength={240} value={action.text} onChange={event => setActions(items => items.map((item, i) => i === index ? { ...item, text: event.target.value } : item))} placeholder={c.stepPlaceholder} /></Label><Label>{c.actionOwner}<NativeSelect value={action.owner} onChange={event => setActions(items => items.map((item, i) => i === index ? { ...item, owner: event.target.value as 'student' | 'educator' } : item))}><option value="student">{c.student}</option><option value="educator">{c.teacher}</option></NativeSelect></Label><Button type="button" variant="ghost" aria-label={`${c.remove} ${index + 1}`} onClick={() => setActions(items => items.filter((_, i) => i !== index))}><X size={18} /></Button></div>)}</div>{actions.length < 3 && <Button type="button" variant="ghost" className="mt-3" onClick={() => setActions(items => [...items, { text: '', owner: 'student' }])}><Plus size={17} />{c.addStep}</Button>}</div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.formFooter}><Button type="submit" className="min-h-11"><Send size={16} />{busy ? c.saving : c.share}</Button><Button type="button" variant="ghost" onClick={onCancel}>{c.cancel}</Button></div>
    </FieldSet>
  </form></Card>;
}

function ConversationNote({ uid, record, membershipId, onSaved }: { uid: string; record: CareerConversation; membershipId?: string; onSaved: (record: CareerConversation) => void }) {
  const { c, locale } = useConversationCopy();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [draft, setDraft] = useState({ baseline: record.reflection, value: record.reflection });
  const reflection = draft.value === draft.baseline ? record.reflection : draft.value;
  const EntryHeading = membershipId ? 'h3' : 'h2';
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ title: record.title, recap: record.recap, followUpOn: record.followUpOn || '' });
  async function mutate(input: Omit<ConversationMutation, 'version'>) {
    setBusy(true); setError('');
    try { const saved = await updateConversation(uid, record, { ...input, version: record.version } as ConversationMutation, membershipId); onSaved(saved); if (input.kind === 'reflection') setDraft({ baseline: saved.reflection, value: saved.reflection }); if (input.kind === 'edit') setEditing(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : c.error); }
    finally { setBusy(false); }
  }
  return <article aria-label={record.title}><Card className={styles.note}>
    <div className={styles.noteMeta}><time dateTime={record.occurredOn}>{date(record.occurredOn, locale)}</time><span>{c.by} {record.educatorName}</span><span>· {c.sharedOn} {date(record.createdAt, locale)}</span></div>
    {editing ? <form className={styles.form} onSubmit={event => { event.preventDefault(); void mutate({ kind: 'edit', ...edit, followUpOn: edit.followUpOn || null } as ConversationMutation); }}><FieldSet disabled={busy}><Label>{c.title}<Input required maxLength={120} value={edit.title} onChange={event => setEdit(value => ({ ...value, title: event.target.value }))} /></Label><Label>{c.recap}<Textarea required maxLength={2000} value={edit.recap} onChange={event => setEdit(value => ({ ...value, recap: event.target.value }))} /></Label><Label>{c.checkIn}<Input type="date" min={record.occurredOn} value={edit.followUpOn} onChange={event => setEdit(value => ({ ...value, followUpOn: event.target.value }))} /></Label><div className={styles.formFooter}><Button type="submit" className="min-h-11">{busy ? c.saving : c.saveChanges}</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>{c.cancel}</Button></div></FieldSet></form> : <div className={styles.noteLayout}><div><EntryHeading className={styles.entryHeading}>{record.title}</EntryHeading><p className={styles.recap}>{record.recap}</p>{membershipId && record.canWrite && <Button variant="ghost" size="sm" disabled={busy} className="mt-2 -ml-3" onClick={() => { setEdit({ title: record.title, recap: record.recap, followUpOn: record.followUpOn || '' }); setEditing(true); }}>{c.edit}</Button>}</div><aside className={styles.checkIn}><Badge variant="secondary" className="h-auto max-w-full whitespace-normal">{c[record.checkInState]}</Badge>{record.followUpOn && <strong>{date(record.followUpOn, locale)}</strong>}{record.actions.length > 0 && <p>{record.completedActions} {c.of} {record.actions.length} {c.done}</p>}{membershipId && record.canWrite && <Button variant="ghost" size="sm" className="mt-3 h-auto whitespace-normal text-left" disabled={busy} onClick={() => void mutate({ kind: 'review', reviewed: !record.reviewedAt } as ConversationMutation)}>{record.reviewedAt ? c.reopen : c.review}</Button>}</aside></div>}
    <div className={styles.actions}>{record.actions.map(action => <Label key={action.id} className={styles.action}><Input type="checkbox" checked={Boolean(action.completedAt)} disabled={busy || !record.canWrite || action.owner !== (membershipId ? 'educator' : 'student')} onChange={event => void mutate({ kind: 'action', actionId: action.id, completed: event.target.checked } as ConversationMutation)} /><span>{action.text}<small>{action.owner === 'student' ? membershipId ? record.studentName : c.stepByYou : membershipId ? c.teacher : c.stepByTeacher}{action.completedAt ? ` · ${date(action.completedAt, locale)}` : ''}</small></span></Label>)}</div>
    {!record.actions.length && <p className={styles.notice}>{c.noActions}</p>}
    {membershipId ? record.reflection && <div className={styles.reflection}><span className={styles.eyebrow}><Sparkles size={16} />{record.studentName} · {date(record.reflectionAt, locale)}</span><p>{record.reflection}</p></div> : <form className={styles.reflection} onSubmit={event => { event.preventDefault(); void mutate({ kind: 'reflection', reflection } as ConversationMutation); }}><Label className="grid gap-2 text-sm font-medium">{c.reflection}<Textarea maxLength={1200} disabled={!record.canWrite || busy} value={reflection} onChange={event => setDraft({ baseline: record.reflection, value: event.target.value })} placeholder={c.reflectionPlaceholder} /></Label><p>{c.reflectionHint}</p>{record.canWrite && <Button variant="outline" className="mt-4 min-h-11" disabled={busy || reflection.trim() === record.reflection} type="submit">{busy ? c.saving : c.shareReflection}</Button>}</form>}
    {!record.canWrite && <p className={styles.notice}>{c.readOnly}</p>}
    {error && <p role="alert" className={`${styles.status} ${styles.error}`}>{error}</p>}
  </Card></article>;
}

export function TeacherConversationFeed() {
  const { user } = useAuth(); const { c, locale } = useConversationCopy();
  const [state, setState] = useState<{ uid?: string; page?: ConversationPage; error?: string }>({});
  const [attempt, setAttempt] = useState(0); const [expanded, setExpanded] = useState(false); const [paging, setPaging] = useState(false);
  useEffect(() => { if (!user || user.isAnonymous) return; let active = true; getTeacherConversations(user.uid).then(page => { if (active) setState({ uid: user.uid, page }); }).catch(() => { if (active) setState({ uid: user.uid, error: c.loadError }); }); return () => { active = false; }; }, [user, attempt, c.loadError]);
  const page = state.uid === user?.uid ? state.page : undefined;
  return <section aria-labelledby="teacher-journal-feed"><Card className={styles.feed}><h2 id="teacher-journal-feed" className={styles.sectionHeading}>{c.journal}</h2><p className={styles.intro}>{c.teacherFeedIntro}</p>
    {state.uid === user?.uid && state.error ? <p role="alert" className={styles.status}>{state.error}<Button variant="ghost" onClick={() => setAttempt(value => value + 1)}>{c.retry}</Button></p> : !page ? <div role="status" aria-label={c.loading}><Skeleton className="mt-4 h-24 !bg-muted motion-reduce:animate-none" /></div> : !page.items.length ? <p className="mt-8 text-sm leading-7 text-muted-foreground">{c.teacherFeedEmpty}</p> : <div className={styles.feedList}>{page.items.slice(0, expanded ? undefined : 3).map(record => <Link key={record.id} className={styles.feedItem} href={`/organization/students/${encodeURIComponent(record.membershipId)}#conversation-journal`}><span className="text-xs">{record.studentName}</span><h3>{record.title}</h3><small>{c[record.checkInState]} {record.followUpOn ? `· ${date(record.followUpOn, locale)}` : ''}</small><small>{record.completedActions} {c.of} {record.actions.length} {c.done}{record.reflection ? ` · ${c.reflection}` : ''}</small></Link>)}</div>}
    {page && page.items.length > 3 && !expanded && <Button variant="ghost" className="mt-4" onClick={() => setExpanded(true)}>{c.showAll}<ArrowRight size={16} /></Button>}
    {page?.nextOffset != null && (expanded || page.items.length <= 3) && <Button variant="ghost" className="mt-4" disabled={paging} onClick={async () => { if (!user) return; setPaging(true); try { const next = await getTeacherConversations(user.uid, page.nextOffset!); setState({ uid: user.uid, page: { ...next, items: [...page.items, ...next.items.filter(item => !page.items.some(old => old.id === item.id))] } }); } catch { setState(previous => ({ ...previous, error: c.loadError })); } finally { setPaging(false); } }}>{paging ? c.loading : c.loadMore}</Button>}
  </Card></section>;
}
