import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const membersApi = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/lib/admin-members', () => ({ adminMembersApi: membersApi }));

import AdminAccessSettings from './AdminAccessSettings';

const currentMember = {
  uid: 'super-1',
  email: 'me@bigmints.com',
  displayName: 'Me',
  role: 'super_admin' as const,
  roleLabel: 'Super admin',
  permissions: ['members:manage'],
  isCurrentUser: true,
};

describe('AdminAccessSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membersApi.list.mockResolvedValue({
      members: [currentMember],
      currentRole: 'super_admin',
      permissions: ['members:manage'],
    });
  });

  it('loads members and prevents the current super admin from changing or removing themselves', async () => {
    render(<AdminAccessSettings />);

    expect(await screen.findByText('me@bigmints.com')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Role for me@bigmints.com' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove me@bigmints.com' })).toBeDisabled();
  });

  it('adds an existing account as an editor and reads the result into the member list', async () => {
    const added = {
      ...currentMember,
      uid: 'editor-1',
      email: 'editor@example.com',
      displayName: 'Editor',
      role: 'editor' as const,
      roleLabel: 'Content editor',
      permissions: ['content:read', 'content:write'],
      isCurrentUser: false,
    };
    membersApi.add.mockResolvedValue({ member: added });
    render(<AdminAccessSettings />);

    await screen.findByText('me@bigmints.com');
    fireEvent.change(screen.getByRole('textbox', { name: 'Admin email' }), {
      target: { value: 'editor@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add access' }));

    await waitFor(() => expect(membersApi.add).toHaveBeenCalledWith({
      email: 'editor@example.com',
      role: 'editor',
    }));
    expect(await screen.findByText('editor@example.com')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('content editor access');
  });
});
