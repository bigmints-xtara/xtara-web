import { resolveExplorerDirection } from '@/lib/career-direction-imagery';
import type { CareerExplorerResponse, ExplorerCareer, ExplorerIllustration } from '@/types/career-explorer';

export function safeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function scene(source: { illustration?: ExplorerIllustration; title: string } | undefined) {
  if (!source?.illustration) return undefined;
  const art = source.illustration;
  const url = safeSourceUrl(art.url);
  return url ? { ...art, url, alt: art.alt.trim() || source.title } : undefined;
}

export function resolveCareerArtwork(
  catalogue: CareerExplorerResponse | undefined,
  career: ExplorerCareer | undefined,
  directionId?: string | null,
): { illustration?: ExplorerIllustration; contextTitle?: string } {
  const own = scene(career);
  if (own || !career?.parentCareerId || !catalogue) return { illustration: own };

  const seen = new Set([career.id]);
  let parentId: string | undefined = career.parentCareerId;
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = catalogue.careers.find(item => item.id === parentId);
    const illustration = scene(parent);
    if (illustration) return { illustration, contextTitle: parent?.title };
    parentId = parent?.parentCareerId;
  }

  const directions = career.directionIds.flatMap(id => resolveExplorerDirection(catalogue.directions, id) ?? []);
  const selected = resolveExplorerDirection(catalogue.directions, directionId);
  const candidates = selected && directions.some(item => item.id === selected.id) ? [selected, ...directions] : directions;
  for (const direction of candidates) {
    const illustration = scene(direction);
    if (illustration) return { illustration, contextTitle: direction.title };
  }
  return {};
}
