import { describe, expect, it } from 'vitest';
import { markDiscoveryCacheOwner, reconcileDiscoveryCacheOwner } from './discovery-cache-owner';
describe('account discovery cache provenance', () => {
  it('preserves anonymous drafts but clears account data on account switch and sign-out', () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } });
    values.set('xtara_assessment_v2', 'guest draft');
    reconcileDiscoveryCacheOwner('account-a');
    expect(values.get('xtara_assessment_v2')).toBe('guest draft');
    markDiscoveryCacheOwner('account-a');
    values.set('xtara_pathway_profile_v1', 'account-a profile');
    reconcileDiscoveryCacheOwner('account-b');
    expect(values.has('xtara_assessment_v2')).toBe(false);
    expect(values.has('xtara_pathway_profile_v1')).toBe(false);
    markDiscoveryCacheOwner('account-b');
    values.set('xtara_my_direction_v1', 'account-b direction');
    reconcileDiscoveryCacheOwner(null);
    expect(values.has('xtara_my_direction_v1')).toBe(false);
  });
});
