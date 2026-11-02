// Provenance for the shared offline cache. Unowned data is an anonymous draft;
// account-owned data must never become another account's or a guest's draft.
export const discoveryCacheOwnerKey = 'xtara_discovery_cache_owner_v1';
const keys = ['xtara_assessment_v2', 'xtara_assessment_stage_v1', 'xtara_my_direction_v1', 'xtara_pathway_profile_v1'];
export function preserveAnonymousDiscoveryDraft(): void {
  if (localStorage.getItem(discoveryCacheOwnerKey)) return;
  const draft = Object.fromEntries(keys.flatMap((key) => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
  if (Object.keys(draft).length) localStorage.setItem('xtara_anonymous_discovery_backup_v1', JSON.stringify(draft));
}
export function markDiscoveryCacheOwner(uid: string): void {
  localStorage.setItem(discoveryCacheOwnerKey, uid);
}
export function reconcileDiscoveryCacheOwner(uid: string | null): void {
  const owner = localStorage.getItem(discoveryCacheOwnerKey);
  if (owner && owner !== uid) {
    for (const key of keys) localStorage.removeItem(key);
    localStorage.removeItem(discoveryCacheOwnerKey);
  }
  // Restore only in an anonymous session, never import a guest draft into an
  // authenticated account or overwrite a newer guest assessment.
  if (uid === null && !localStorage.getItem('xtara_assessment_v2')) {
    try {
      const draft: unknown = JSON.parse(localStorage.getItem('xtara_anonymous_discovery_backup_v1') || 'null');
      if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
        for (const key of keys) {
          const value = (draft as Record<string, unknown>)[key];
          if (typeof value === 'string') localStorage.setItem(key, value);
        }
        localStorage.removeItem('xtara_anonymous_discovery_backup_v1');
      }
    } catch { /* A malformed backup never replaces account data. */ }
  }
  if (owner && owner !== uid) for (const event of ['xtara:assessment-result-changed', 'xtara:direction-changed', 'xtara:pathway-profile-changed']) window.dispatchEvent(new Event(event));
}
