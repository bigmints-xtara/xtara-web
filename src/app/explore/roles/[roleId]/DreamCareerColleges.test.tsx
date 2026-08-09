import { render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assessmentV2StorageKey, type DiscoveryResult } from '@/lib/assessment-v2';
import { createAreaDirectionPlan, directionStorageKey, setDreamCareers } from '@/lib/direction';

const mocks = vi.hoisted(() => ({ getCareer: vi.fn(), searchColleges: vi.fn() }));

vi.mock('@/components/Header', () => ({ default: () => <header>Header</header> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/components/career-path/SlideshowOverlay', () => ({ default: () => null }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/curated-career-api', () => ({ getPublishedDreamCareer: mocks.getCareer }));
vi.mock('@/lib/firebase/college-service', () => ({
  CollegeService: { searchCollegesByCareer: mocks.searchColleges },
}));

import DreamCareerPage from './page';

const assessment: DiscoveryResult = {
  definitionId: 'career-discovery', version: '3.0.0', stage: 'grade8', locale: 'en',
  createdAt: '2026-07-21T00:00:00.000Z', answers: {},
  signals: [{ id: 'creativeExpression', evidence: 'repeated', evidenceRefs: [] }], traits: [],
  areas: [{ id: 'design', evidence: 'developing', evidenceRefs: [], roleIds: ['ux-designer'] }],
  context: { familyInfluence: null, familyPriorities: [], weaknessPatterns: [] }, syncStatus: 'synced',
};

describe('Dream Career college mappings', () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };

  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ roleId: 'ux-designer' });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    localStorage.clear();
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify(assessment));
    localStorage.setItem(directionStorageKey, JSON.stringify(setDreamCareers(createAreaDirectionPlan('design'), ['ux-designer'])));
    mocks.getCareer.mockResolvedValue({
      id: 'ux-designer', slug: 'ux-designer', recordType: 'career_role', schemaVersion: 1,
      version: 3, status: 'published', published: true, inReview: false, defaultLocale: 'en',
      translations: {
        en: {
          title: 'Experience Designer',
          summary: 'Shapes clear services around real learner needs.',
          dailyWork: ['Interview learners about a difficult workflow'],
          workSetting: 'Product, research, and service teams',
          pathway: 'Study design and build a portfolio from tested projects.',
          tradeoffs: ['Feedback can require substantial rework'],
          specializations: ['Service design'],
          tryThis: 'Test a paper prototype with another learner.',
        },
      },
      futureDirectionIds: ['design'], primaryFutureDirectionId: 'design',
      skillIds: ['user-research'], toolIds: [], sourceIds: ['ncs'], regulated: false,
      review: { reviewedBy: 'editor', reviewedAt: '2026-08-01T00:00:00.000Z' },
      provenance: { origin: 'editorial', sourceVersion: 'test', sourceIds: ['ncs'], legacyDocumentIds: [] },
    });
    mocks.searchColleges.mockResolvedValue([{
      id: 'institution:design-1', name: 'National Institute of Design', type: 'institute',
      city: 'Ahmedabad', state: 'Gujarat', country: 'India',
      courses: [{ name: 'Bachelor of Design', course: 'Bachelor of Design' }],
    }]);
  });

  it('loads mapped colleges directly on the Dream Career page', async () => {
    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Courses to learn' })).toBeInTheDocument();
    expect(await screen.findByText('National Institute of Design · Ahmedabad')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Design')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'National Institute of Design · Ahmedabad' })).toHaveAttribute('href', '/colleges/institution%3Adesign-1');
    expect(mocks.searchColleges).toHaveBeenCalledWith('ux-designer', 6);
  });

  it('renders every rich field from the Dream Career detail contract', async () => {
    render(<DreamCareerPage />);

    expect(await screen.findByRole('heading', { name: 'Experience Designer' })).toBeInTheDocument();
    expect(screen.getByText('Shapes clear services around real learner needs.')).toBeInTheDocument();
    expect(screen.getByText('Interview learners about a difficult workflow')).toBeInTheDocument();
    expect(screen.getByText('Product, research, and service teams')).toBeInTheDocument();
    expect(screen.getByText('Study design and build a portfolio from tested projects.')).toBeInTheDocument();
    expect(screen.getByText('Feedback can require substantial rework')).toBeInTheDocument();
    expect(screen.getByText('Service design')).toBeInTheDocument();
    expect(screen.getByText('Test a paper prototype with another learner.')).toBeInTheDocument();
    expect(mocks.getCareer).toHaveBeenCalledWith('ux-designer');
  });
});
