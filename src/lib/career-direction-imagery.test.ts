import { describe, expect, it } from 'vitest';
import type { ExplorerDirection } from '@/types/career-explorer';
import { canonicalCareerDirectionId, getCareerDirectionIllustration, supportedCareerDirectionIds } from './career-direction-imagery';
const direction = (id: string, url = 'https://xtara.ai/xtara-service/media/direction.hash.webp'): ExplorerDirection => ({
  id, title: 'Digital', summary: '', careerIds: [], industryIds: [], translationFallback: false,
  illustration: { url, alt: 'Localized published description', width: 960, height: 960 },
});
describe('canonical Career Direction imagery', () => {
  it('resolves canonical and legacy identities without owning image paths', () => {
    expect(supportedCareerDirectionIds).toHaveLength(17);
    expect(canonicalCareerDirectionId('technology')).toBe('digital-and-computing');
    const published = direction('digital-and-computing');
    expect(getCareerDirectionIllustration([published], 'technology')).toBe(published.illustration);
    expect(getCareerDirectionIllustration([published], published.id)).toBe(published.illustration);
  });
  it('follows changed published artwork and preserves localized metadata', () => {
    const updated = direction('digital-and-computing', 'https://example.com/new-immutable-art.webp');
    expect(getCareerDirectionIllustration([updated], 'technology')).toEqual(updated.illustration);
    expect(getCareerDirectionIllustration([direction('technology')], 'digital-and-computing')).not.toBeNull();
  });
  it('does not invent an asset on missing content, unknown IDs or unsafe URLs', () => {
    expect(getCareerDirectionIllustration(undefined, 'technology')).toBeNull();
    expect(getCareerDirectionIllustration([direction('digital-and-computing')], 'unknown')).toBeNull();
    expect(getCareerDirectionIllustration([], '__proto__')).toBeNull();
    expect(canonicalCareerDirectionId('__proto__')).toBeNull();
    expect(getCareerDirectionIllustration([{ ...direction('digital-and-computing'), illustration: undefined }], 'technology')).toBeNull();
    expect(getCareerDirectionIllustration([direction('digital-and-computing', 'javascript:alert(1)')], 'technology')).toBeNull();
  });
});
