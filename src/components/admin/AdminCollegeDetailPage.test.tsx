import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDetail: vi.fn() }));

vi.mock('@/lib/admin-college-catalog', () => ({ getAdminCollegeDetail: mocks.getDetail }));

import AdminCollegeDetailPage from './AdminCollegeDetailPage';

describe('AdminCollegeDetailPage', () => {
  it('loads a routed immutable record and renders its learner preview', async () => {
    mocks.getDetail.mockResolvedValue({
      id: 'institution:10253', name: 'Amrita School of Medicine', type: 'school', city: 'Kochi', state: 'Kerala', country: 'India',
      website: 'https://example.edu', university: 'Amrita University', courses: [{ name: 'MBBS', course: 'MBBS', level: 'undergraduate' }],
    });

    render(<AdminCollegeDetailPage collegeId="institution:10253" />);

    expect(await screen.findByRole('heading', { name: 'Amrita School of Medicine' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to College catalogue' })).toHaveAttribute('href', '/admin/colleges');
    expect(screen.getByText('institution:10253')).toBeInTheDocument();
    expect(screen.getByText('MBBS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(screen.getByRole('heading', { name: 'Amrita School of Medicine', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Affiliated with Amrita University')).toBeInTheDocument();
  });
});
