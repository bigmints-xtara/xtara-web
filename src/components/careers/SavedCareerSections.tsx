'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { Tabs } from 'radix-ui';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';
import type { SavedCareerScreen } from '@/lib/saved-career-screen';
import { savedCareerCopy } from './saved-career-copy';

export type CareerSection = { id: string; semanticId?: string; title: string; content: ReactNode };
const tabIds = ['overview', 'study'] as const;
type TabId = typeof tabIds[number];
const studySections = new Set(['study', 'colleges', 'how-to-get-there', 'courses-and-colleges']);
const tabChanged = 'xtara-saved-career-tab';

function subscribeToFragment(update: () => void) {
  window.addEventListener('popstate', update);
  window.addEventListener('hashchange', update);
  window.addEventListener(tabChanged, update);
  return () => {
    window.removeEventListener('popstate', update);
    window.removeEventListener('hashchange', update);
    window.removeEventListener(tabChanged, update);
  };
}

export default function SavedCareerSections({ sections, tabs, locale, englishFallback, fallbackText, children }: {
  sections: CareerSection[]; tabs?: SavedCareerScreen['tabs']; locale: Locale; englishFallback?: boolean; fallbackText?: string; children?: ReactNode;
}) {
  const copy = savedCareerCopy[locale];
  const fragment = useSyncExternalStore(subscribeToFragment, () => window.location.hash.slice(1), () => '');
  const groups: Record<TabId, CareerSection[]> = { overview: [], study: [] };
  const remaining = new Map(sections.map(section => [section.semanticId ?? section.id, section]));
  for (const tab of tabs ?? []) {
    for (const id of tab.sectionIds) {
      const section = remaining.get(id);
      if (section) {
        groups[tab.id].push(section);
        remaining.delete(id);
      }
    }
  }
  for (const [id, section] of remaining) {
    groups[studySections.has(id) ? 'study' : 'overview'].push(section);
  }
  const visibleTabs = tabIds.filter(id => groups[id].length || (id === 'overview' && children));
  const sectionTab = visibleTabs.find(id => groups[id].some(item => item.id === fragment || item.semanticId === fragment));
  const requestedTab = sectionTab ?? (fragment === 'career-study' || fragment.startsWith('study-') ? 'study' : 'overview');
  const selected = visibleTabs.includes(requestedTab) ? requestedTab : visibleTabs[0];
  useEffect(() => {
    if (!fragment || fragment === 'career-overview' || fragment === 'career-study' || fragment.startsWith('study-offering-')) return;
    // A direct section URL may arrive before the authenticated panel has mounted.
    document.getElementById(fragment)?.scrollIntoView?.({ block: 'start' });
  }, [fragment, selected]);
  if (!selected) return null;

  return <Tabs.Root data-testid="saved-career-reader" className="site-frame pb-14" value={selected} onValueChange={id => {
    window.history.pushState(window.history.state, '', '#career-' + id);
    window.dispatchEvent(new Event(tabChanged));
  }}>
    <Tabs.List aria-label={copy.sections} className="flex min-w-0 gap-1 border-b border-border pt-2 sm:gap-3">
      {visibleTabs.map(id => <Tabs.Trigger asChild key={id} value={id}>
        <Button type="button" variant="ghost" data-career-tab={id}
          className="h-auto min-h-12 min-w-0 shrink whitespace-normal rounded-none border-b-2 border-transparent px-2.5 py-2 text-center text-sm leading-snug font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary sm:px-4 sm:text-base">
          {tabs?.find(tab => tab.id === id)?.title ?? copy.tabs[id]}
        </Button>
      </Tabs.Trigger>)}
    </Tabs.List>
    {englishFallback && locale !== 'en' && <p className="mt-4 text-sm text-muted-foreground">{fallbackText ?? copy.englishFallback}</p>}
    {visibleTabs.map(id => <Tabs.Content key={id} value={id} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <div className="divide-y divide-border">{groups[id].map(section => <section key={section.id} id={section.id} data-section={section.semanticId ?? section.id} tabIndex={-1} aria-labelledby={section.id + '-title'}
        className="grid min-w-0 scroll-mt-24 gap-4 py-6 sm:py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] md:gap-8">
        <h2 id={section.id + '-title'} className="text-xl leading-tight font-semibold tracking-tight text-primary sm:text-2xl">{section.title}</h2>
        <div className="min-w-0 max-w-prose space-y-4 text-base leading-7 break-words text-muted-foreground">{section.content}</div>
      </section>)}</div>
      {id === 'overview' && children}
    </Tabs.Content>)}
  </Tabs.Root>;
}
