import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usersApi = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), revokeSessions: vi.fn() }));
vi.mock('@/lib/admin-users', () => ({ adminUsersApi: usersApi }));
vi.mock('next/navigation', () => ({ useParams: () => ({ uid: 'user-1' }) }));

import AdminUserDetailPage from './page';

const user = {
  uid: 'user-1', email: 'student@example.com', displayName: 'Student One', emailVerified: true,
  disabled: false, providers: ['password'], role: null, roleLabel: 'User', isCurrentUser: false,
  createdAt: '2026-07-20T10:00:00.000Z', lastSignInAt: '2026-07-25T10:00:00.000Z',
  profile: { currentGrade: 'Grade 10', city: 'Dubai', country: 'UAE' },
};

describe('AdminUserDetailPage', () => {
  beforeEach(() => {
    usersApi.get.mockReset();
    usersApi.update.mockReset();
    usersApi.revokeSessions.mockReset();
    usersApi.get.mockResolvedValue({ user });
    usersApi.update.mockResolvedValue({ user: { ...user, displayName: 'Student Updated', disabled: true } });
    usersApi.revokeSessions.mockResolvedValue({ uid: user.uid, revoked: true });
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('loads profile details and saves access changes with persisted readback', async () => {
    usersApi.get.mockResolvedValueOnce({ user }).mockResolvedValueOnce({ user: { ...user, displayName: 'Student Updated', disabled: true } });
    render(<AdminUserDetailPage />);

    expect((await screen.findAllByText('student@example.com')).length).toBeGreaterThan(0);
    expect(screen.getByText('Grade 10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Access' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Display name' }), { target: { value: 'Student Updated' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Disable sign-in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(usersApi.update).toHaveBeenCalledWith(user.uid, {
      displayName: 'Student Updated',
      disabled: true,
      adminRole: null,
    }));
    expect(await screen.findByText('User settings saved and verified.')).toBeInTheDocument();
    expect(usersApi.get).toHaveBeenCalledTimes(2);
  });

  it('revokes all sessions after confirmation', async () => {
    render(<AdminUserDetailPage />);
    await screen.findAllByText('student@example.com');
    fireEvent.click(screen.getByRole('tab', { name: 'Access' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revoke sessions' }));

    await waitFor(() => expect(usersApi.revokeSessions).toHaveBeenCalledWith(user.uid));
    expect(await screen.findByText(/All refresh sessions were revoked/)).toBeInTheDocument();
  });
});
