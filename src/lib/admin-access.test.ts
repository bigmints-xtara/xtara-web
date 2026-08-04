import { describe, expect, it } from 'vitest';

import { canManageSystem, canManageUsers, canPublishContent, resolveAdminRole } from './admin-access';

describe('admin access helpers', () => {
  it('resolves explicit and legacy admin roles', () => {
    expect(resolveAdminRole({ adminRole: 'super_admin' } as never)).toBe('super_admin');
    expect(resolveAdminRole({ roles: { isAdmin: true } } as never)).toBe('admin');
    expect(resolveAdminRole({ isEditor: true } as never)).toBe('editor');
    expect(resolveAdminRole({} as never)).toBeNull();
  });

  it('keeps system and publication controls away from editors', () => {
    expect(canManageSystem('admin')).toBe(true);
    expect(canManageSystem('editor')).toBe(false);
    expect(canPublishContent('super_admin')).toBe(true);
    expect(canPublishContent('editor')).toBe(false);
    expect(canManageUsers('super_admin')).toBe(true);
    expect(canManageUsers('admin')).toBe(false);
  });
});
