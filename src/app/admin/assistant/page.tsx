'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import {
  Archive,
  Bot,
  CheckCircle2,
  ChevronRight,
  History,
  Loader2,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  adminAgentApi,
  type AdminAgentAction,
  type AdminAgentConfig,
  type AdminAgentConversation,
  type AdminAgentStoredMessage,
} from '@/lib/admin-agent';
import { cn } from '@/lib/utils';

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AdminAgentAction[];
  createdAt?: string;
};

const suggestions = [
  { title: 'Create a Good Read', description: 'Draft a practical article about building career resilience.', prompt: 'Create a complete draft Good Read about building career resilience.' },
  { title: 'Review draft content', description: 'Find content that is waiting for editorial review.', prompt: 'Show me the content that is still in draft and tell me what needs attention.' },
  { title: 'Check content health', description: 'Summarize coverage, status, and important missing fields.', prompt: 'Summarize our content health and identify the most important missing fields.' },
  { title: 'Plan a new challenge', description: 'Create a useful, age-appropriate challenge as a draft.', prompt: 'Create a complete draft career exploration challenge for secondary school students.' },
];

function displayTitle(conversation?: AdminAgentConversation | null) {
  return conversation?.title?.trim() || conversation?.preview?.trim() || 'New conversation';
}

function conversationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function historyGroup(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Older';
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const days = Math.round((startToday.getTime() - startDate.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'Previous 7 days';
  if (date.getFullYear() === startToday.getFullYear()) {
    return date.toLocaleDateString([], { month: 'long' });
  }
  return date.getFullYear().toString();
}

function ActionDialog({
  conversation,
  mode,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  conversation: AdminAgentConversation;
  mode: 'rename' | 'archive';
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (title?: string) => void;
}) {
  const [title, setTitle] = useState(displayTitle(conversation));
  const heading = mode === 'rename' ? 'Rename conversation' : 'Archive conversation?';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onCancel(); }}>
      <button aria-label="Close dialog" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" disabled={busy} onClick={onCancel} type="button" />
      <div aria-labelledby="conversation-dialog-title" aria-modal="true" className="relative z-10 w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl" role="dialog">
        <h2 className="text-base font-semibold" id="conversation-dialog-title">{heading}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {mode === 'rename' ? 'Choose a short name that will be easy to find in history.' : 'This conversation will be removed from your active history. Its messages will remain stored.'}
        </p>
        {mode === 'rename' ? (
          <Input autoFocus className="mt-4" maxLength={80} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && title.trim() && !busy) onConfirm(title.trim()); }} value={title} />
        ) : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button disabled={busy} onClick={onCancel} type="button" variant="outline">Cancel</Button>
          <Button disabled={busy || (mode === 'rename' && !title.trim())} onClick={() => onConfirm(mode === 'rename' ? title.trim() : undefined)} type="button">
            {busy ? <Loader2 className="animate-spin" /> : mode === 'rename' ? <Pencil /> : <Archive />}
            {mode === 'rename' ? 'Rename' : 'Archive'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({
  conversations,
  selectedId,
  loading,
  error,
  showHeader = true,
  onClose,
  onNew,
  onRefresh,
  onSelect,
  onRename,
  onArchive,
}: {
  conversations: AdminAgentConversation[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  showHeader?: boolean;
  onClose?: () => void;
  onNew: () => void;
  onRefresh: () => void;
  onSelect: (conversation: AdminAgentConversation) => void;
  onRename: (conversation: AdminAgentConversation) => void;
  onArchive: (conversation: AdminAgentConversation) => void;
}) {
  const groups = useMemo(() => conversations.reduce<Array<{ label: string; items: AdminAgentConversation[] }>>((all, conversation) => {
    const label = historyGroup(conversation.updatedAt);
    const existing = all.find((group) => group.label === label);
    if (existing) existing.items.push(conversation);
    else all.push({ label, items: [conversation] });
    return all;
  }, []), [conversations]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {showHeader ? (
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2"><History className="size-4 text-muted-foreground" /><h2 className="text-sm font-semibold">History</h2></div>
          <div className="flex items-center gap-1">
            <Button aria-label="Refresh history" disabled={loading} onClick={onRefresh} size="icon-sm" type="button" variant="ghost"><RefreshCw className={cn(loading && 'animate-spin')} /></Button>
            {onClose ? <Button aria-label="Close history" onClick={onClose} size="icon-sm" type="button" variant="ghost"><PanelRightClose /></Button> : null}
          </div>
        </div>
      ) : null}
      <div className="shrink-0 border-b p-3">
        <Button className="w-full justify-start" onClick={onNew} type="button" variant="outline"><Plus />New chat</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading conversations…</div>
        ) : error ? (
          <div className="p-4"><p className="text-sm text-destructive">{error}</p><Button className="mt-3" onClick={onRefresh} size="sm" type="button" variant="outline"><RefreshCw />Retry</Button></div>
        ) : conversations.length === 0 ? (
          <div className="px-5 py-12 text-center"><History className="mx-auto size-5 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No conversations yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your admin conversations will appear here after you send a message.</p></div>
        ) : (
          <div className="space-y-5 p-2">
            {groups.map((group) => (
              <section key={group.label}>
                <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((conversation) => (
                    <div className="group relative min-w-0" key={conversation.id}>
                      <button
                        className={cn('grid h-11 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-transparent px-3 pr-10 text-left transition-colors hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', selectedId === conversation.id && 'border-border bg-muted')}
                        onClick={() => onSelect(conversation)}
                        type="button"
                      >
                        <span className="truncate text-sm font-medium" title={displayTitle(conversation)}>{displayTitle(conversation)}</span>
                        <time className="text-[0.7rem] text-muted-foreground" dateTime={conversation.updatedAt}>{conversationTime(conversation.updatedAt)}</time>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label={`Actions for ${displayTitle(conversation)}`} className="absolute right-1.5 top-1.5 opacity-70 group-hover:opacity-100" size="icon-sm" type="button" variant="ghost"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onRename(conversation)}><Pencil />Rename</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onArchive(conversation)}><Archive />Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAssistantPage() {
  const [config, setConfig] = useState<AdminAgentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [conversations, setConversations] = useState<AdminAgentConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [desktopHistoryOpen, setDesktopHistoryOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [dialog, setDialog] = useState<{ mode: 'rename' | 'archive'; conversation: AdminAgentConversation } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationError(null);
    try {
      setConversations(await adminAgentApi.listConversations());
    } catch (loadError) {
      setConversationError(loadError instanceof Error ? loadError.message : 'Conversation history could not be loaded');
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    adminAgentApi.getConfig()
      .then(setConfig)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load agent settings'))
      .finally(() => setConfigLoading(false));
    adminAgentApi.listConversations()
      .then(setConversations)
      .catch((loadError) => setConversationError(loadError instanceof Error ? loadError.message : 'Conversation history could not be loaded'))
      .finally(() => setConversationsLoading(false));
  }, []);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (viewport && typeof viewport.scrollTo === 'function') {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: messagesLoading ? 'auto' : 'smooth' });
    }
  }, [messages, messagesLoading, sending]);

  const configured = Boolean(config?.enabled && config.baseUrl && config.model);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null;

  const selectConversation = async (conversation: AdminAgentConversation) => {
    setSelectedId(conversation.id);
    setMobileHistoryOpen(false);
    setInput('');
    setMessagesLoading(true);
    setError(null);
    try {
      const stored = await adminAgentApi.getMessages(conversation.id);
      setMessages(stored.map((message: AdminAgentStoredMessage) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        actions: message.actions,
        createdAt: message.createdAt,
      })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Conversation messages could not be loaded');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const newChat = () => {
    setSelectedId(null);
    setMessages([]);
    setInput('');
    setError(null);
    setMobileHistoryOpen(false);
  };

  const sendMessage = async (content = input) => {
    const trimmed = content.trim();
    if (!trimmed || sending || !configured) return;
    const optimistic: ChatItem = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    setMessages((current) => [...current, optimistic]);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const result = await adminAgentApi.chat([{ role: 'user', content: trimmed }], selectedId);
      setSelectedId(result.conversationId);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.answer,
        actions: result.actions,
      }]);
      setConversations((current) => [result.conversation, ...current.filter((item) => item.id !== result.conversationId)]);
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setInput(trimmed);
      setError(sendError instanceof Error ? sendError.message : 'The admin assistant could not complete that request');
      void loadConversations();
    } finally {
      setSending(false);
    }
  };

  const refreshSelected = () => {
    if (selectedConversation) void selectConversation(selectedConversation);
    else void loadConversations();
  };

  const confirmAction = async (title?: string) => {
    if (!dialog) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const updated = await adminAgentApi.updateConversation(dialog.conversation.id, dialog.mode === 'rename'
        ? { title }
        : { status: 'archived' });
      if (dialog.mode === 'archive') {
        setConversations((current) => current.filter((conversation) => conversation.id !== updated.id));
        if (selectedId === updated.id) newChat();
      } else {
        setConversations((current) => current.map((conversation) => conversation.id === updated.id ? updated : conversation));
      }
      setDialog(null);
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : 'Conversation could not be updated');
    } finally {
      setActionBusy(false);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage();
    }
  };

  if (configLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Loading assistant…</div>;
  }

  if (!configured || !config) {
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-6">
        <Card className="max-w-lg shadow-sm">
          <CardHeader><div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Bot className="size-5" /></div><CardTitle>Connect a compatible model</CardTitle><CardDescription>The admin assistant has no hosted fallback. Add a compatible endpoint and select a model in Settings.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link href="/admin/settings"><Settings2 />Configure model</Link></Button>{error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}</CardContent>
        </Card>
      </div>
    );
  }

  const historyPanel = (
    <HistoryPanel
      conversations={conversations}
      error={conversationError}
      loading={conversationsLoading}
      onArchive={(conversation) => { setActionError(null); setDialog({ mode: 'archive', conversation }); }}
      onClose={() => setDesktopHistoryOpen(false)}
      onNew={newChat}
      onRefresh={() => void loadConversations()}
      onRename={(conversation) => { setActionError(null); setDialog({ mode: 'rename', conversation }); }}
      onSelect={(conversation) => void selectConversation(conversation)}
      selectedId={selectedId}
    />
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-muted/20">
      {mobileHistoryOpen ? (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <button aria-label="Close history" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setMobileHistoryOpen(false)} type="button" />
          <aside aria-label="Conversation history" className="absolute inset-y-0 right-0 z-10 flex w-[min(22rem,92vw)] flex-col border-l bg-background shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4"><h2 className="text-sm font-semibold">History</h2><Button aria-label="Close history" onClick={() => setMobileHistoryOpen(false)} size="icon-sm" type="button" variant="ghost"><X /></Button></div>
            <div className="min-h-0 flex-1"><HistoryPanel {...{
              conversations,
              selectedId,
              loading: conversationsLoading,
              error: conversationError,
              onNew: newChat,
              onRefresh: () => void loadConversations(),
              onSelect: (conversation: AdminAgentConversation) => void selectConversation(conversation),
              onRename: (conversation: AdminAgentConversation) => { setActionError(null); setDialog({ mode: 'rename', conversation }); },
              onArchive: (conversation: AdminAgentConversation) => { setActionError(null); setDialog({ mode: 'archive', conversation }); },
              showHeader: false,
            }} /></div>
          </aside>
        </div>
      ) : null}

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="size-4" /></div>
          <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">{displayTitle(selectedConversation)}</h1><p className="hidden truncate text-[11px] text-muted-foreground sm:block">{config.providerName} · {config.model}</p></div>
          <Badge className="hidden sm:flex" variant="outline"><span className="size-1.5 rounded-full bg-primary" />Configured</Badge>
          <Button aria-label="Open history" className="xl:hidden" onClick={() => setMobileHistoryOpen(true)} size="icon" type="button" variant="ghost"><PanelRightOpen /></Button>
          {selectedId ? <Button aria-label="Refresh conversation" disabled={messagesLoading || sending} onClick={refreshSelected} size="icon" type="button" variant="ghost"><RefreshCw className={cn(messagesLoading && 'animate-spin')} /></Button> : null}
          <Button aria-label="New chat" className="px-2 sm:px-3" onClick={newChat} size="sm" type="button" variant="outline"><Plus /><span className="hidden sm:inline">New chat</span></Button>
          {!desktopHistoryOpen ? <Button aria-label="Show history" className="hidden xl:inline-flex" onClick={() => setDesktopHistoryOpen(true)} size="icon" type="button" variant="ghost"><PanelRightOpen /></Button> : null}
        </header>

        <div aria-busy={messagesLoading || sending} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading conversation…</div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">What should we work on?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Ask in plain language. Xtara Admin can inspect records and use its admin tools to create, review, publish, archive, import, and configure platform content.</p>
              <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button className="group flex min-h-28 flex-col justify-between rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={sending} key={suggestion.title} onClick={() => void sendMessage(suggestion.prompt)} type="button">
                    <span className="flex items-center justify-between text-sm font-semibold">{suggestion.title}<ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></span>
                    <span className="mt-4 text-xs leading-5 text-muted-foreground">{suggestion.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <article className={cn('flex items-start gap-3', isUser && 'justify-end')} key={message.id}>
                    {!isUser ? <Avatar className="mt-0.5 size-8"><AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-4" /></AvatarFallback></Avatar> : null}
                    <div className={cn('min-w-0 max-w-[85%] space-y-1.5', !isUser && 'flex-1')}>
                      <p className={cn('text-xs font-medium text-muted-foreground', isUser && 'text-right')}>{isUser ? 'You' : 'Xtara Admin'}</p>
                      <div className={cn('break-words whitespace-pre-wrap text-sm leading-6', isUser ? 'rounded-2xl bg-muted px-4 py-3' : 'text-foreground')}>{message.content}</div>
                      {message.actions?.length ? <div className="space-y-2 pt-1">{message.actions.map((action, index) => <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800" key={`${action.tool}-${index}`}><CheckCircle2 className="size-3.5 shrink-0" /><span className="font-medium">{action.summary}</span>{action.targetId ? <code className="ml-auto max-w-36 truncate rounded bg-white/70 px-1.5 py-0.5">{action.targetId}</code> : null}</div>)}</div> : null}
                    </div>
                    {isUser ? <Avatar className="mt-0.5 hidden size-8 sm:flex"><AvatarFallback><UserRound className="size-4" /></AvatarFallback></Avatar> : null}
                  </article>
                );
              })}
              {sending ? <div className="flex items-center gap-3 text-sm text-muted-foreground"><Avatar className="size-8"><AvatarFallback><Bot className="size-4" /></AvatarFallback></Avatar><Loader2 className="size-4 animate-spin" />Working through your request…</div> : null}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t bg-background px-3 pb-3 pt-3 sm:px-6 sm:pb-4">
          <div className="mx-auto max-w-3xl">
            {error ? <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"><span>{error}</span><Button aria-label="Dismiss error" className="-mr-1 -mt-1" onClick={() => setError(null)} size="icon-sm" type="button" variant="ghost"><X /></Button></div> : null}
            <div className="rounded-xl border bg-background p-2 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
              <Textarea aria-label="Message Xtara Admin" className="max-h-40 min-h-16 resize-none border-0 px-2 py-2 shadow-none focus-visible:ring-0" disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask Xtara Admin to create, review, or update something…" value={input} />
              <div className="flex items-center justify-between px-1"><p className="text-[11px] text-muted-foreground">Enter to send · Shift + Enter for a new line</p><Button aria-label="Send message" disabled={!input.trim() || sending} onClick={() => void sendMessage()} size="icon-sm"><Send /></Button></div>
            </div>
          </div>
        </footer>
      </section>

      {desktopHistoryOpen ? <aside aria-label="Conversation history" className="hidden w-[clamp(17rem,23vw,21rem)] min-w-0 shrink-0 overflow-hidden border-l bg-background xl:flex">{historyPanel}</aside> : null}

      {dialog ? <ActionDialog busy={actionBusy} conversation={dialog.conversation} error={actionError} mode={dialog.mode} onCancel={() => { if (!actionBusy) setDialog(null); }} onConfirm={(title) => void confirmAction(title)} /> : null}
    </div>
  );
}
