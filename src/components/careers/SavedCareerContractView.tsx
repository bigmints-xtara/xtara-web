import Link from 'next/link';
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
