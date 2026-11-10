import { describe, expect, it } from 'vitest';

import { getCareerDirectionImage, supportedCareerDirectionIds } from './career-direction-imagery';

describe('career direction imagery', () => {
  it('covers every canonical and legacy Career Direction with a reusable local image', () => {
    expect(supportedCareerDirectionIds).toHaveLength(17);
    for (const directionId of supportedCareerDirectionIds) {
      expect(getCareerDirectionImage(directionId)).toMatch(/^\/images\/career-directions\/[a-z-]+\.webp$/);
    }
  });

  it('maps legacy directions to the canonical shared asset', () => {
    expect(getCareerDirectionImage('technology')).toBe(getCareerDirectionImage('digital-and-computing'));
    expect(getCareerDirectionImage('health')).toBe(getCareerDirectionImage('health-and-wellbeing'));
    expect(getCareerDirectionImage('science')).toBe(getCareerDirectionImage('science-and-discovery'));
    expect(getCareerDirectionImage('business')).toBe(getCareerDirectionImage('business-finance-and-entrepreneurship'));
    expect(getCareerDirectionImage('design')).toBe(getCareerDirectionImage('arts-design-and-creative-media'));
    expect(getCareerDirectionImage('society')).toBe(getCareerDirectionImage('education-and-human-development'));
  });

  it('does not guess imagery for an unknown direction', () => {
    expect(getCareerDirectionImage('unknown-direction')).toBeNull();
    expect(getCareerDirectionImage('__proto__')).toBeNull();
    expect(getCareerDirectionImage(null)).toBeNull();
  });
});
