import { describe, expect, it } from 'vitest';
import type { CareerExplorerResponse, ExplorerCareer, ExplorerIllustration } from '@/types/career-explorer';
import { resolveCareerArtwork } from './career-artwork';

const image = (id: string, alt = ''): ExplorerIllustration => ({ url: `https://images.example.test/${id}.webp`, alt });
const career = (id: string, parentCareerId?: string, illustration?: ExplorerIllustration): ExplorerCareer => ({
  id, title: id, parentCareerId, illustration,
  summary: '', directionIds: ['engineering'], industryIds: [], activities: [], subjects: [],
  studyRoutes: [], relatedCareerIds: [], sources: [], translationFallback: false,
});
const catalogue = (...careers: ExplorerCareer[]): CareerExplorerResponse => ({
  schemaVersion: 1, locale: 'en', catalogSource: 'database', industries: [], careers,
  directions: [{
    id: 'engineering-and-built-world', title: 'Engineering & the Built World', summary: '',
    illustration: image('direction'), careerIds: [], industryIds: [], translationFallback: false,
  }],
});

describe('specialization artwork', () => {
  it.each([
    ['ayurveda-researcher', 'medical-research-scientist', 'scientist'],
    ['pediatric-cardiologist', 'cardiologist', 'doctor'],
    ['structural-engineer', 'civil-engineer', 'engineer'],
    ['water-resources-engineer', 'civil-engineer', 'engineer'],
  ])('uses the nearest illustrated ancestor for %s', (id, parentId, ancestorId) => {
    const child = career(id, parentId);
    const parent = career(parentId, ancestorId);
    const ancestor = career(ancestorId, undefined, image(ancestorId, 'Published ancestor scene'));
    expect(resolveCareerArtwork(catalogue(child, parent, ancestor), child)).toEqual({
      illustration: ancestor.illustration, contextTitle: ancestorId,
    });
    const illustratedParent = { ...parent, illustration: image(parentId) };
    expect(resolveCareerArtwork(catalogue(child, illustratedParent, ancestor), child).illustration?.alt).toBe(parentId);
  });

  it('falls back to the canonical member Direction when a parent is missing or cyclic', () => {
    const child = career('child', 'parent');
    const cyclicParent = career('parent', 'child', { url: 'file:///unsafe.webp', alt: 'Invalid' });
    for (const data of [catalogue(child), catalogue(child, cyclicParent)]) {
      expect(resolveCareerArtwork(data, child, 'engineering')).toEqual({
        illustration: image('direction', 'Engineering & the Built World'),
        contextTitle: 'Engineering & the Built World',
      });
    }
    expect(resolveCareerArtwork({ ...catalogue(child), directions: [] }, child).illustration).toBeUndefined();
  });
});
