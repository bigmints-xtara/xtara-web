import { useRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Locale } from '@/i18n/config';
import { savedCareerCopy } from './saved-career-copy';

export type CareerSection = { id: string; semanticId?: string; title: string; content: ReactNode };

export default function SavedCareerSections({ sections, locale, englishFallback, fallbackText, children }: {
  sections: CareerSection[]; locale: Locale; englishFallback?: boolean; fallbackText?: string; children?: ReactNode;
}) {
  const copy = savedCareerCopy[locale];
  const destination = useRef<HTMLElement | null>(null);
  return <div data-testid="saved-career-reader" className="site-frame pb-14">
    <nav aria-label={copy.sections} className="border-b border-border py-2">
      <div className="py-1 sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between">
            {copy.jump}<ChevronDown aria-hidden="true" />
          </Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]" onCloseAutoFocus={event => {
            if (!destination.current) return;
            event.preventDefault();
            destination.current.focus({ preventScroll: true });
            destination.current.scrollIntoView?.({ block: 'start' });
            destination.current = null;
          }}>
            {sections.map(section => <DropdownMenuItem key={section.id} onSelect={() => {
              destination.current = document.getElementById(section.id);
              if (destination.current) window.history.pushState(null, '', '#' + section.id);
            }}>{section.title}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="hidden flex-wrap gap-x-5 sm:flex">{sections.map(section =>
      <a href={`#${section.id}`} key={section.id} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline">{section.title}</a>)}</div></nav>
    {englishFallback && locale !== 'en' && <p className="mt-4 text-sm text-muted-foreground">{fallbackText ?? copy.englishFallback}</p>}
    <div className="divide-y divide-border">{sections.map(section => <section key={section.id} id={section.id} data-section={section.semanticId ?? section.id} tabIndex={-1} aria-labelledby={`${section.id}-title`}
      className="grid min-w-0 scroll-mt-24 gap-4 py-6 sm:py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] md:gap-8">
      <h2 id={`${section.id}-title`} className="text-xl leading-tight font-semibold tracking-tight text-primary sm:text-2xl">{section.title}</h2>
      <div className="min-w-0 max-w-prose space-y-4 text-base leading-7 break-words text-muted-foreground">{section.content}</div>
    </section>)}</div>{children}
  </div>;
}
