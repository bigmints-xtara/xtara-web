import type { ExplorerDirection, ExplorerIllustration } from '@/types/career-explorer';

const canonicalDirectionIds = [
  'arts-design-and-creative-media',
  'business-finance-and-entrepreneurship',
  'communication-culture-and-society',
  'digital-and-computing',
  'education-and-human-development',
  'engineering-and-built-world',
  'environment-agriculture-and-sustainability',
  'government-law-and-public-safety',
  'health-and-wellbeing',
  'science-and-discovery',
  'travel-hospitality-sports-and-experiences',
] as const;
type CanonicalDirectionId = typeof canonicalDirectionIds[number];

const legacyDirectionAliases: Record<string, CanonicalDirectionId> = {
  business: 'business-finance-and-entrepreneurship',
  design: 'arts-design-and-creative-media',
  health: 'health-and-wellbeing',
  science: 'science-and-discovery',
  society: 'education-and-human-development',
  technology: 'digital-and-computing',
};

export const supportedCareerDirectionIds = [
  ...canonicalDirectionIds,
  ...Object.keys(legacyDirectionAliases),
].sort();

export function canonicalCareerDirectionId(
  directionId: string | null | undefined,
): CanonicalDirectionId | null {
  if (!directionId) return null;
  if (canonicalDirectionIds.includes(directionId as CanonicalDirectionId)) {
    return directionId as CanonicalDirectionId;
  }
  return Object.prototype.hasOwnProperty.call(legacyDirectionAliases, directionId)
    ? legacyDirectionAliases[directionId]
    : null;
}

/** Resolve artwork from the same published catalogue as Explorer, never a local substitute. */
export function getCareerDirectionIllustration(
  directions: readonly ExplorerDirection[] | undefined,
  directionId: string | null | undefined,
): ExplorerIllustration | null {
  const canonicalId = canonicalCareerDirectionId(directionId);
  if (!directionId || !directions) return null;
  const direction = directions.find(item => item.id === directionId)
    ?? (canonicalId ? directions.find(item => canonicalCareerDirectionId(item.id) === canonicalId) : undefined);
  const illustration = direction?.illustration;
  if (!illustration) return null;
  try {
    const url = new URL(illustration.url);
    return ['http:', 'https:'].includes(url.protocol) ? illustration : null;
  } catch { return null; }
}
