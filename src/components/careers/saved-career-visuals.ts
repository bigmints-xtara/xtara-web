import type { SavedCareerScreen, SavedSpecialization } from '@/lib/saved-career-screen';
import type { CareerExplorerResponse } from '@/types/career-explorer';
import { explorerCopy } from './explorer/copy';

/** Adapt the older screen only when its missing specialty section has published catalogue children. */
export function withCatalogueSpecializations(screen: SavedCareerScreen, catalogue?: CareerExplorerResponse): SavedCareerScreen {
  if (!catalogue || screen.sections.some(section => section.id === 'specializations')) return screen;
  const careers = new Map(catalogue.careers.map(career => [career.id, career]));
  const parent = careers.get(screen.careerId);
  const items: SavedSpecialization[] = [];
  for (const id of parent?.specializationIds ?? []) {
    const child = careers.get(id);
    if (child && child.id !== parent?.id) items.push({ id, title: child.title, overview: child.cardSummary || child.summary, illustration: child.illustration });
  }
  if (!items.length) return screen;

  const normalize = (label: string) => label.normalize('NFKC').trim().toLocaleLowerCase();
  const headings = new Set(Object.values(explorerCopy).map(copy => normalize(copy.specializations)));
  const title = explorerCopy[screen.locale].specializations;
  const childTitles = new Set(items.map(item => normalize(item.title)));
  const sections = screen.sections.map(section => {
    if (section.id !== 'work') return section;
    const blocks = section.blocks.flatMap((block, index, all) => {
      const heading = block.kind === 'heading' ? block : all[index - 1];
      const list = block.kind === 'list' ? block : all[index + 1];
      const legacyList = heading?.kind === 'heading' && headings.has(normalize(heading.text)) && list?.kind === 'list'
        && list.items.length > 0 && list.items.every(label => childTitles.has(normalize(label)));
      return legacyList && (block === heading || block === list) ? [] : [block];
    });
    return { ...section, blocks };
  });
  return { ...screen, sections: [...sections, { id: 'specializations', title, blocks: [{ kind: 'specializations', title, items }] }] };
}
