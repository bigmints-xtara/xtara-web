import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersApi = vi.hoisted(() => ({ list: vi.fn(), bulk: vi.fn() }));
vi.mock('@/lib/admin-users', () => ({ adminUsersApi: usersApi }));

import AdminUsersPage from './page';

const users = [
  {
    uid: 'user-1', email: 'student@example.com', displayName: 'Student One', emailVerified: true,
    disabled: false, providers: ['password'], role: null, roleLabel: 'User', isCurrentUser: false, profile: {},
  },
  {
    uid: 'user-2', email: 'editor@example.com', displayName: 'Editor Two', emailVerified: true,
    disabled: true, providers: ['google.com'], role: 'editor', roleLabel: 'Content editor', isCurrentUser: false, profile: {},
  },
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersApi.list.mockImplementation(async (query) => ({ items: users, page: query.page, pageSize: query.pageSize, total: 52, totalPages: 3, facets: [], groups: [], summaries: [{ key: 'total', label: 'Matching', value: 52 }] }));
  });

  it('renders a paginated user table with working management links', async () => {
    render(<AdminUsersPage />);

    expect(await screen.findByText('Student One')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage Student One' })).toHaveAttribute('href', '/admin/users/user-1');

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(usersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, pageSize: 25 })));
  });

  it('runs exact account search through the server API', async () => {
    usersApi.list.mockResolvedValue({ items: [users[0]], page: 1, pageSize: 25, total: 1, totalPages: 1, facets: [], groups: [], summaries: [] });
    render(<AdminUsersPage />);

    await screen.findByText('Student One');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search Users' }), { target: { value: 'student@example.com' } });

    await waitFor(() => expect(usersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'student@example.com' })));
  });
});
