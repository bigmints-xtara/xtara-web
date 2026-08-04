import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getCatalog: vi.fn() }));

vi.mock('@/lib/admin-college-catalog', () => ({
  getAdminCollegeCatalog: mocks.getCatalog,
}));

import AdminCollegesPage from './page';

const college = {
  id: 'institution:10253', providerId: '10253', name: 'Amrita School of Medicine', aliases: [],
  type: 'school', city: 'Kochi', state: 'Kerala', country: 'India', website: 'https://example.edu',
};

describe('admin college catalogue', () => {
  beforeEach(() => {
    mocks.getCatalog.mockResolvedValue({
      release: { id: 'xtara-catalog-production-v1-b37269b3ea3e', status: 'ready', active: true, productionReady: true, activatedAt: '2026-07-25T00:00:00.000Z' },
      counts: { institutions: 16191, courseConcepts: 11655, courseOfferings: 140299, careerCourseLinks: 8924 },
      items: [college], pagination: { page: 1, limit: 25, total: 16191, totalPages: 648 },
      filters: { query: '', city: '', state: '', type: '' }, immutable: true,
    });
  });

  it('shows release health, exact catalogue counts, and a routed college detail link', async () => {
    render(<AdminCollegesPage />);

    expect(await screen.findByText('16,191')).toBeInTheDocument();
    expect(screen.getByText('140,299')).toBeInTheDocument();
    expect(screen.getByText('8,924')).toBeInTheDocument();
    expect(screen.getByText('xtara-catalog-production-v1-b37269b3ea3e')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Open Amrita School of Medicine' })).toHaveAttribute('href', '/admin/colleges/institution%3A10253');
    expect(screen.getByText('Release records are immutable')).toBeInTheDocument();
  });
});
