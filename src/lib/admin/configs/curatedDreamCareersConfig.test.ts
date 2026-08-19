import { describe, expect, it } from 'vitest';

import { curatedDreamCareersConfig } from './curatedDreamCareersConfig';

describe('curatedDreamCareersConfig', () => {
  it('normalizes partial locale objects returned by older canonical records', () => {
    const career = curatedDreamCareersConfig.fromFirestore({
      slug: 'biomedical-engineer',
      recordType: 'career_role',
      translations: {
        en: { title: 'Biomedical Engineer', summary: 'Designs healthcare technology.' },
        ml: { title: 'ബയോമെഡിക്കൽ എഞ്ചിനീയർ', summary: 'ആരോഗ്യ സാങ്കേതികവിദ്യ രൂപകൽപ്പന ചെയ്യുന്നു.' },
      },
      futureDirectionIds: ['health-sciences'],
      skillIds: ['engineering'],
      toolIds: [],
      sourceIds: ['source-1'],
    }, 'biomedical-engineer');

    expect(career.translations.en).toMatchObject({
      title: 'Biomedical Engineer',
      summary: 'Designs healthcare technology.',
      dailyWork: [],
      tradeoffs: [],
      specializations: [],
    });
    expect(career.translations.ml).toMatchObject({
      title: 'ബയോമെഡിക്കൽ എഞ്ചിനീയർ',
      summary: 'ആരോഗ്യ സാങ്കേതികവിദ്യ രൂപകൽപ്പന ചെയ്യുന്നു.',
      dailyWork: [],
      tradeoffs: [],
      specializations: [],
    });
    expect(career.translations.hi).toMatchObject({
      title: '',
      summary: '',
      dailyWork: [],
      tradeoffs: [],
      specializations: [],
    });
  });

  it('preserves valid lists and removes non-string list values', () => {
    const career = curatedDreamCareersConfig.fromFirestore({
      translations: {
        en: {
          title: 'Biomedical Engineer',
          summary: 'Designs healthcare technology.',
          dailyWork: ['Design devices', 42, 'Test equipment'],
          tradeoffs: null,
          specializations: ['Biomechanics'],
        },
      },
    }, 'biomedical-engineer');

    expect(career.translations.en.dailyWork).toEqual(['Design devices', 'Test equipment']);
    expect(career.translations.en.tradeoffs).toEqual([]);
    expect(career.translations.en.specializations).toEqual(['Biomechanics']);
  });

  it('shows translation coverage, source release, and run in Admin list rows', () => {
    const localized = (title: string) => ({ title, summary: `${title} summary` });
    const career = curatedDreamCareersConfig.fromFirestore({
      translations: {
        en: localized('English'),
        ml: localized('Malayalam'),
        hi: localized('Hindi'),
        ta: localized('Tamil'),
      },
      detailProfile: { locale: 'en' },
      detailProfileTranslations: {
        ml: { locale: 'ml' },
        hi: { locale: 'hi' },
        ta: { locale: 'ta' },
      },
      translationOperation: {
        sourceReleaseId: 'dream-careers-approved-52-e205d2beeb4c',
        runId: 'run-20260819-001',
      },
      futureDirectionIds: ['technology'],
      skillIds: ['analysis'],
    }, 'translated-career');

    expect(curatedDreamCareersConfig.getSubtitle(career)).toBe(
      '4/4 languages • dream-careers-approved-52-e205d2beeb4c • run-20260819-001',
    );
  });
});
