import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ExplorerScene } from './explorer/ExplorerScene';
import { Button } from '@/components/ui/button';
import type { SavedCareerBlock, SavedCareerScreen } from '@/lib/saved-career-screen';
import { savedCareerHref, studyOptionsHref } from '@/lib/study-options';
import SavedOfferingLink from './SavedOfferingLink';
import SavedCareerSections from './SavedCareerSections';

// Keep published web anchors stable across contract versions and native clients.
const anchors: Record<string, string> = { work: 'about-career', study: 'how-to-get-there', colleges: 'courses-and-colleges', skills: 'what-you-can-do-now', progression: 'career-progression', pay: 'pay-outlook', sources: 'sources' } as const;

export default function SavedCareerContractView({ screen, retry }: { screen: SavedCareerScreen; retry: () => void }) {
  const studyHref = studyOptionsHref(screen.careerId, savedCareerHref(screen.careerId));
  const render = (block: SavedCareerBlock, key: number) => {
    switch (block.kind) {
      case 'text': return <p key={key}>{block.text}</p>;
      case 'heading': return <h3 key={key} id={block.phase && `study-${block.phase}`} aria-current={block.current ? 'step' : undefined}
        className={block.current ? 'border-s-2 border-primary ps-3 font-semibold text-primary' : 'font-semibold text-foreground'}>{block.text}</h3>;
      case 'list': return <ul key={key} className="list-disc space-y-2 ps-5">{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
      case 'link': return <a key={key} href={block.url} target="_blank" rel="noreferrer" className="block w-fit text-sm font-medium text-primary underline">{block.label}</a>;
      case 'specializations': return <ul key={key} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {block.items.map(item => <li key={item.id} className="min-w-0">
          <Card className="h-full gap-0 rounded-xl py-0 shadow-none">
            <Link data-specialization-id={item.id} href={'/explore?' + new URLSearchParams({ career: item.id, step: 'work' })}
              className={'group grid h-full items-start gap-x-3 gap-y-2 rounded-xl p-4 focus-visible:outline-2 focus-visible:outline-ring ' +
                (item.illustration ? 'grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]')}>
              {item.illustration && <div className="row-span-2 aspect-square overflow-hidden rounded-lg bg-muted/40 sm:col-span-2 sm:row-span-1 sm:aspect-auto sm:h-32 [&>div]:h-full [&>div]:w-full">
                <ExplorerScene illustration={item.illustration} placeholder="" sizes="(max-width: 640px) 72px, 340px" />
              </div>}
              <h3 className="text-lg leading-snug font-semibold text-primary group-hover:underline">{item.title}</h3>
              <ArrowUpRight size={18} aria-hidden="true" className="mt-1 text-primary" />
              {item.overview && <p className="col-span-2 text-sm leading-relaxed text-muted-foreground">{item.overview}</p>}
            </Link>
          </Card>
        </li>)}
      </ul>;
      case 'offering': return <div key={block.offering.offeringId} className="rounded-xl border border-border bg-card px-4"><SavedOfferingLink careerId={screen.careerId} offering={block.offering} label={block.matchLabel} /></div>;
      case 'action':
        if (block.action === 'retry') return <Button key={key} onClick={retry}>{block.label}</Button>;
        return <Button key={key} asChild><Link href={block.action === 'all_states' ? studyHref + '&state=all' : studyHref}>{block.label}</Link></Button>;
    }
  };
  return <SavedCareerSections tabs={screen.tabs} locale={screen.locale} englishFallback={screen.englishFallback} sections={screen.sections.map(section => ({
    id: anchors[section.id] ?? `guide-section-${section.id}`, semanticId: section.id, title: section.title, content: section.blocks.map(render),
  }))} />;
}
