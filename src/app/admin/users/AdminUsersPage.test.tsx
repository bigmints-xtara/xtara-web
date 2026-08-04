import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersApi = vi.hoisted(() => ({ list: vi.fn() }));
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
    usersApi.list.mockResolvedValue({ users, pageSize: 25, nextPageToken: 'next-token' });
  });

  it('renders a paginated user table with working management links', async () => {
    render(<AdminUsersPage />);

    expect(await screen.findByText('Student One')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage Student One' })).toHaveAttribute('href', '/admin/users/user-1');

    fireEvent.click(screen.getByRole('button', { name: 'Next users page' }));
    await waitFor(() => expect(usersApi.list).toHaveBeenLastCalledWith({
      pageSize: 25,
      pageToken: 'next-token',
      query: undefined,
    }));
  });

  it('runs exact account search through the server API', async () => {
    usersApi.list.mockResolvedValue({ users: [users[0]], pageSize: 25, query: 'student@example.com' });
    render(<AdminUsersPage />);

    await screen.findByText('Student One');
    fireEvent.change(screen.getByRole('textbox', { name: 'Exact email or user ID' }), { target: { value: 'student@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(usersApi.list).toHaveBeenLastCalledWith({
      pageSize: 25,
      pageToken: undefined,
      query: 'student@example.com',
    }));
  });
});
