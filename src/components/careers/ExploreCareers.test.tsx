import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExploreCareers from './ExploreCareers';
import { getPublishedDreamCareers } from '@/lib/curated-career-api';
import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
vi.mock('@/components/Header', () => ({ default: () => <nav>Navigation</nav> }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/curated-career-api', () => ({ getPublishedDreamCareers: vi.fn() }));
describe('Explore Careers catalogue', () => {
  beforeEach(() => vi.mocked(getPublishedDreamCareers).mockReset());
  it('opens published career guides and excludes drafts', async () => {
    const career = { ...createEmptyDreamCareer(), id: 'doctor' };
    career.status = 'published';
    career.translations.en.title = 'Doctor'; career.translations.en.summary = 'Care for people';
    const draft = { ...createEmptyDreamCareer(), id: 'draft' }; draft.translations.en.title = 'Unreviewed';
    vi.mocked(getPublishedDreamCareers).mockResolvedValue([career, draft]);
    render(<ExploreCareers />);
    const title = await screen.findByRole('heading', { name: 'Doctor' });
    expect(title.closest('a')).toHaveAttribute('href', '/dream-careers/doctor');
    expect(screen.queryByText('Unreviewed')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'engineer' } });
    expect(screen.getByRole('status')).toHaveTextContent('No careers match');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'DOC' } });
    expect(screen.getByRole('heading', { name: 'Doctor' })).toBeInTheDocument();
  });
  it('offers retry after failure and an honest empty state', async () => {
    vi.mocked(getPublishedDreamCareers).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    render(<ExploreCareers />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('No careers are available yet. Please check again later.')).toBeInTheDocument();
    expect(getPublishedDreamCareers).toHaveBeenCalledTimes(2);
  });
});
