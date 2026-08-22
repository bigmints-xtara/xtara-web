import { describe, expect, it } from 'vitest';

import { curatedDreamCareersConfig, translationLocaleCoverageState } from './curatedDreamCareersConfig';

const COVERAGE_TOKENS = ['T00000', 'T00001'];

function localeCoverage(locale: 'en' | 'ml' | 'hi' | 'ta', translated = locale === 'en' ? 2 : 0) {
  const translatedTokens = COVERAGE_TOKENS.slice(0, translated);
  return {
    canonical: locale === 'en',
    complete: translated === COVERAGE_TOKENS.length,
    totalFields: COVERAGE_TOKENS.length,
    translatedFieldTokens: locale === 'en' ? [] : translatedTokens,
    fieldStatus: Object.fromEntries(COVERAGE_TOKENS.map((token) => [
      token,
      locale === 'en' ? 'canonical' : translatedTokens.includes(token) ? 'translated' : 'missing',
    ])),
  };
}

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
        translationCoverage: {
          canonicalLocale: 'en',
          releaseBlocking: false,
          locales: Object.fromEntries((['en', 'ml', 'hi', 'ta'] as const).map((locale) => [
            locale,
            localeCoverage(locale, 2),
          ])),
        },
      },
      futureDirectionIds: ['technology'],
      skillIds: ['analysis'],
    }, 'translated-career');

    expect(curatedDreamCareersConfig.getSubtitle(career)).toBe(
      '4/4 languages • dream-careers-approved-52-e205d2beeb4c • run-20260819-001',
    );
  });

  it('reports truthful partial field coverage even when fallback-filled locale objects look complete', () => {
    const career = curatedDreamCareersConfig.fromFirestore({
      translations: {
        en: { title: 'English', summary: 'English summary' },
        hi: { title: 'हिंदी', summary: 'English fallback summary' },
      },
      detailProfile: { locale: 'en' },
      detailProfileTranslations: { hi: { locale: 'hi', work: { summary: 'English fallback' } } },
      translationOperation: {
        sourceReleaseId: 'release-partial',
        runId: 'run-partial',
        translationCoverage: {
          canonicalLocale: 'en',
          releaseBlocking: false,
          locales: {
            en: localeCoverage('en'),
            ml: localeCoverage('ml'),
            hi: localeCoverage('hi', 1),
            ta: localeCoverage('ta'),
          },
        },
      },
      futureDirectionIds: ['technology'],
      skillIds: ['analysis'],
    }, 'partial-career');

    expect(curatedDreamCareersConfig.getSubtitle(career)).toBe(
      '1/4 languages • release-partial • run-partial',
    );
  });

  it('does not infer translation coverage when the operation receipt has no coverage', () => {
    const career = curatedDreamCareersConfig.fromFirestore({
      translations: { en: { title: 'English', summary: 'English summary' } },
      detailProfile: { locale: 'en' },
      translationOperation: { sourceReleaseId: 'release-legacy', runId: 'run-legacy' },
      futureDirectionIds: ['technology'],
      skillIds: ['analysis'],
    }, 'legacy-career');

    expect(curatedDreamCareersConfig.getSubtitle(career)).toBe(
      'coverage unavailable • release-legacy • run-legacy',
    );
  });

  it('fails closed when coverage evidence is incomplete or contradictory', () => {
    const malformedReceipts = [
      { complete: true },
      { ...localeCoverage('hi', 1), complete: true },
      { ...localeCoverage('hi', 1), translatedFieldTokens: ['T00001'] },
    ];

    for (const receipt of malformedReceipts) {
      const career = curatedDreamCareersConfig.fromFirestore({
        translations: { en: { title: 'English', summary: 'English summary' } },
        translationOperation: {
          sourceReleaseId: 'release-malformed',
          runId: 'run-malformed',
          translationCoverage: {
            canonicalLocale: 'en',
            releaseBlocking: false,
            locales: {
              en: localeCoverage('en'),
              ml: localeCoverage('ml'),
              hi: receipt,
              ta: localeCoverage('ta'),
            },
          },
        },
      }, 'malformed-career');

      expect(translationLocaleCoverageState(career, 'en')).toBe('unavailable');
      expect(translationLocaleCoverageState(career, 'hi')).toBe('unavailable');
      expect(curatedDreamCareersConfig.getSubtitle(career)).toBe(
        'coverage unavailable • release-malformed • run-malformed',
      );
    }
  });
});
