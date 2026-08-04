import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Story } from '@/types/admin';

const service = vi.hoisted(() => ({
  create: vi.fn(),
  getById: vi.fn(),
  getPage: vi.fn(),
  update: vi.fn(),
}));
const approval = vi.hoisted(() => ({ approve: vi.fn() }));
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock('@/lib/services/adminService', () => ({
  AdminService: class {
    create = service.create;
    getById = service.getById;
    getPage = service.getPage;
    update = service.update;
  },
}));
vi.mock('@/lib/admin-content-approval', () => ({ adminContentApprovalApi: approval }));
vi.mock('@/context/AuthContext', () => ({ useAuth: auth.useAuth }));

import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
import AdminContentEditorPage from './AdminContentEditorPage';

const story: Story = {
  id: 'story-1',
  title: 'A real story',
  description: 'This is the learner-facing story preview.',
  image: '',
  career_clusters: ['technology'],
  published: false,
  draft: true,
  inReview: false,
  featured: false,
  ad: false,
  byXtara: true,
  careerRelevance: ['software developer'],
  futureDirectionIds: ['technology'],
  dreamCareerIds: ['software-developer'],
  skillIds: [],
  gradeStages: [],
  topics: [],
  slides: [],
};

describe('AdminContentEditorPage', () => {
  const push = vi.fn();
  const replace = vi.fn();

  beforeEach(() => {
    service.create.mockReset();
    service.getById.mockReset();
    service.getPage.mockReset();
    service.getPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 50, totalPages: 0, availableDomains: ['all'] });
    service.update.mockReset();
    approval.approve.mockReset();
    auth.useAuth.mockReturnValue({ userProfile: { adminRole: 'super_admin' } });
    vi.stubGlobal('confirm', vi.fn(() => true));
    push.mockReset();
    replace.mockReset();
    vi.mocked(useRouter).mockReturnValue({ push, replace } as unknown as ReturnType<typeof useRouter>);
  });

  it('loads a routed record and switches between its edit and real preview', async () => {
    service.getById.mockResolvedValue(story);
    render(<AdminContentEditorPage contentType="stories" recordId="story-1" />);

    await screen.findByRole('heading', { name: 'A real story', level: 1 });
    expect(screen.getByRole('link', { name: 'Back to Stories' })).toHaveAttribute('href', '/admin/stories');
    expect(screen.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByText('This is the learner-facing story preview.')).toBeInTheDocument();
    expect(screen.getByText('software developer')).toBeInTheDocument();
  });

  it('creates a record, reads it back, and replaces the new URL with its stable detail URL', async () => {
    service.create.mockResolvedValue('story-1');
    service.getById.mockResolvedValue(story);
    render(<AdminContentEditorPage contentType="stories" recordId="new" />);

    expect(screen.getByRole('tab', { name: 'Preview' })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Enter story title'), { target: { value: 'A real story' } });
    fireEvent.change(screen.getByPlaceholderText('Enter story description'), { target: { value: 'Complete story content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'A real story', description: 'Complete story content' })));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/stories/story-1'));
    expect(screen.getByRole('tab', { name: 'Preview' })).toBeEnabled();
  });

  it('approves a Dream Career from its detail page and verifies persisted readback', async () => {
    const draft = {
      ...createEmptyDreamCareer(),
      id: 'approval-role',
      slug: 'approval-role',
      translations: {
        ...createEmptyDreamCareer().translations,
        en: { ...createEmptyDreamCareer().translations.en, title: 'Approval Career', summary: 'Ready for review.' },
      },
    };
    const approved = { ...draft, status: 'inReview' as const, inReview: true, review: { reviewedBy: 'admin-1', reviewedAt: '2026-08-03T08:00:00.000Z' } };
    service.getById.mockResolvedValueOnce(draft).mockResolvedValueOnce(approved);
    approval.approve.mockResolvedValue({ approved: [{ id: draft.id, reviewedBy: 'admin-1', reviewedAt: '2026-08-03T08:00:00.000Z' }], failed: [] });

    render(<AdminContentEditorPage contentType="dream-careers" recordId={draft.id} />);
    await screen.findByRole('heading', { name: 'Approval Career', level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(approval.approve).toHaveBeenCalledWith('dream_careers', [draft.id]));
    expect(await screen.findByText('Approved and verified. This record is ready to publish.')).toBeInTheDocument();
    expect(screen.getAllByText('In review').length).toBeGreaterThan(0);
  });
});
