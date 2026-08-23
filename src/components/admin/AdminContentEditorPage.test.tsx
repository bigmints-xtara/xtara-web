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
const versions = vi.hoisted(() => ({ history: vi.fn(), createDraft: vi.fn(), saveDraft: vi.fn(), action: vi.fn() }));
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
vi.mock('@/lib/career-content-versions', () => ({ careerContentVersionsApi: versions }));
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
    Object.values(versions).forEach((mock) => mock.mockReset());
    versions.history.mockResolvedValue({ live: null, active: null, versions: [] });
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

  it('shows the separate draft, review, approval, and live-promotion flow for a published career', async () => {
    const live = {
      ...createEmptyDreamCareer(), id: 'versioned-role', slug: 'versioned-role',
      status: 'published' as const, published: true, draft: false,
      translations: {
        ...createEmptyDreamCareer().translations,
        en: { ...createEmptyDreamCareer().translations.en, title: 'Versioned Career', summary: 'Current live summary.' },
      },
    };
    const base = {
      id: 'dream_careers__versioned-role__v000002', schemaVersion: 1 as const,
      collectionName: 'dream_careers' as const, recordId: live.id, revision: 2,
      content: { ...live, status: 'draft', published: false, draft: true },
      basedOnVersionId: 'dream_careers__versioned-role__v000001',
      createdAt: '2026-08-23T08:00:00.000Z', createdBy: 'editor-1',
      updatedAt: '2026-08-23T08:00:00.000Z', updatedBy: 'editor-1',
    };
    const draft = { ...base, lockVersion: 1, status: 'draft' as const };
    const inReview = { ...draft, lockVersion: 2, status: 'inReview' as const };
    const approved = { ...inReview, lockVersion: 3, status: 'approved' as const };
    const promotedVersion = { ...approved, lockVersion: 4, status: 'live' as const };
    const promotedRecord = {
      ...live,
      version: 2,
      versionControl: { liveVersionId: promotedVersion.id, revision: promotedVersion.revision },
      translations: { ...live.translations, en: { ...live.translations.en, summary: 'Promoted summary.' } },
    };
    service.getById.mockResolvedValueOnce(live).mockResolvedValueOnce(promotedRecord);
    versions.createDraft.mockResolvedValue(draft);
    versions.action
      .mockResolvedValueOnce(inReview)
      .mockResolvedValueOnce(approved)
      .mockResolvedValueOnce(promotedVersion);
    versions.history
      .mockResolvedValueOnce({ live: null, active: null, versions: [] })
      .mockResolvedValueOnce({ live: null, active: draft, versions: [draft] })
      .mockResolvedValueOnce({ live: null, active: inReview, versions: [inReview] })
      .mockResolvedValueOnce({ live: null, active: approved, versions: [approved] })
      .mockResolvedValueOnce({ live: promotedVersion, active: null, versions: [promotedVersion] });

    render(<AdminContentEditorPage contentType="dream-careers" recordId={live.id} />);
    await screen.findByRole('heading', { name: 'Versioned Career', level: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'Create draft' }));
    expect(await screen.findByRole('button', { name: 'Submit for review' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByRole('button', { name: 'Approve version' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Approve version' }));
    expect(await screen.findByRole('button', { name: 'Promote to live' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Promote to live' }));

    expect(await screen.findByText('Version 2 is live and verified.')).toBeInTheDocument();
    expect(versions.action).toHaveBeenNthCalledWith(3, 'dream_careers', live.id, approved, 'promote');
    expect(service.update).not.toHaveBeenCalled();
  });

  it.each([
    ['a stale live version ID', { liveVersionId: 'dream_careers__versioned-role__v000001', revision: 2 }],
    ['a stale live revision', { liveVersionId: 'dream_careers__versioned-role__v000002', revision: 1 }],
    ['missing version metadata', undefined],
    ['malformed version metadata', []],
  ])('does not verify promotion when canonical readback has %s', async (_caseName, versionControl) => {
    const live = {
      ...createEmptyDreamCareer(), id: 'versioned-role', slug: 'versioned-role',
      status: 'published' as const, published: true, draft: false,
      translations: {
        ...createEmptyDreamCareer().translations,
        en: { ...createEmptyDreamCareer().translations.en, title: 'Versioned Career', summary: 'Current live summary.' },
      },
    };
    const approved = {
      id: 'dream_careers__versioned-role__v000002', schemaVersion: 1 as const,
      collectionName: 'dream_careers' as const, recordId: live.id, revision: 2, lockVersion: 3,
      status: 'approved' as const, content: { ...live, status: 'draft', published: false, draft: true },
      basedOnVersionId: 'dream_careers__versioned-role__v000001',
      createdAt: '2026-08-23T08:00:00.000Z', createdBy: 'editor-1',
      updatedAt: '2026-08-23T08:00:00.000Z', updatedBy: 'editor-1',
    };
    const promotedVersion = { ...approved, lockVersion: 4, status: 'live' as const };
    const canonical = {
      ...live,
      version: 2,
      ...(versionControl ? { versionControl } : {}),
    };
    service.getById.mockResolvedValueOnce(live).mockResolvedValueOnce(canonical);
    versions.action.mockResolvedValueOnce(promotedVersion);
    versions.history
      .mockResolvedValueOnce({ live: null, active: approved, versions: [approved] })
      .mockResolvedValueOnce({ live: promotedVersion, active: null, versions: [promotedVersion] });

    render(<AdminContentEditorPage contentType="dream-careers" recordId={live.id} />);
    await screen.findByRole('heading', { name: 'Versioned Career', level: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'Promote to live' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Promotion completed, but canonical live readback could not verify the promoted version.');
    expect(screen.queryByText('Version 2 is live and verified.')).not.toBeInTheDocument();
  });

  it('does not verify promotion when canonical readback fails', async () => {
    const live = {
      ...createEmptyDreamCareer(), id: 'versioned-role', slug: 'versioned-role',
      status: 'published' as const, published: true, draft: false,
      translations: {
        ...createEmptyDreamCareer().translations,
        en: { ...createEmptyDreamCareer().translations.en, title: 'Versioned Career', summary: 'Current live summary.' },
      },
    };
    const approved = {
      id: 'dream_careers__versioned-role__v000002', schemaVersion: 1 as const,
      collectionName: 'dream_careers' as const, recordId: live.id, revision: 2, lockVersion: 3,
      status: 'approved' as const, content: { ...live, status: 'draft', published: false, draft: true },
      basedOnVersionId: 'dream_careers__versioned-role__v000001',
      createdAt: '2026-08-23T08:00:00.000Z', createdBy: 'editor-1',
      updatedAt: '2026-08-23T08:00:00.000Z', updatedBy: 'editor-1',
    };
    const promotedVersion = { ...approved, lockVersion: 4, status: 'live' as const };
    service.getById.mockResolvedValueOnce(live).mockRejectedValueOnce(new Error('Readback request failed'));
    versions.action.mockResolvedValueOnce(promotedVersion);
    versions.history.mockResolvedValueOnce({ live: null, active: approved, versions: [approved] });

    render(<AdminContentEditorPage contentType="dream-careers" recordId={live.id} />);
    await screen.findByRole('heading', { name: 'Versioned Career', level: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'Promote to live' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Promotion completed, but canonical live readback could not verify the promoted version.');
    expect(screen.queryByText('Version 2 is live and verified.')).not.toBeInTheDocument();
  });
});
