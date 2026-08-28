const canonicalDirectionImages = {
  'arts-design-and-creative-media': '/images/career-directions/arts-design-and-creative-media.webp',
  'business-finance-and-entrepreneurship': '/images/career-directions/business-finance-and-entrepreneurship.webp',
  'communication-culture-and-society': '/images/career-directions/communication-culture-and-society.webp',
  'digital-and-computing': '/images/career-directions/digital-and-computing.webp',
  'education-and-human-development': '/images/career-directions/education-and-human-development.webp',
  'engineering-and-built-world': '/images/career-directions/engineering-and-built-world.webp',
  'environment-agriculture-and-sustainability': '/images/career-directions/environment-agriculture-and-sustainability.webp',
  'government-law-and-public-safety': '/images/career-directions/government-law-and-public-safety.webp',
  'health-and-wellbeing': '/images/career-directions/health-and-wellbeing.webp',
  'science-and-discovery': '/images/career-directions/science-and-discovery.webp',
  'travel-hospitality-sports-and-experiences': '/images/career-directions/travel-hospitality-sports-and-experiences.webp',
} as const;

const legacyDirectionAliases: Record<string, keyof typeof canonicalDirectionImages> = {
  business: 'business-finance-and-entrepreneurship',
  design: 'arts-design-and-creative-media',
  health: 'health-and-wellbeing',
  science: 'science-and-discovery',
  society: 'education-and-human-development',
  technology: 'digital-and-computing',
};

export const supportedCareerDirectionIds = [
  ...Object.keys(canonicalDirectionImages),
  ...Object.keys(legacyDirectionAliases),
].sort();

export function getCareerDirectionImage(directionId: string | null | undefined): string | null {
  if (!directionId) return null;
  const canonicalId = directionId in canonicalDirectionImages
    ? directionId as keyof typeof canonicalDirectionImages
    : legacyDirectionAliases[directionId];
  return canonicalId ? canonicalDirectionImages[canonicalId] : null;
}
