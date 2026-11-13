import type { Locale } from '@/i18n/config';
import type { DirectionOverview } from './direction-api';
const prefix = 'xtara_dashboard_v1:';
const maxAge = 24 * 60 * 60 * 1000;
const locales: Locale[] = ['en', 'ml', 'hi', 'ta'];
type Snapshot = { owner: string; locale: Locale; savedAt: number; overview: DirectionOverview | null };
const memory = new Map<Locale, Snapshot>();
const pending = new Map<string, Promise<DirectionOverview | null | undefined>>();
let generation = 0;
let activeOwner: string | null | undefined;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
function validOverview(value: unknown): value is DirectionOverview | null {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;
  const item = value as DirectionOverview;
  return typeof item.id === 'string' && !!item.id && typeof item.title === 'string'
    && typeof item.summary === 'string' && typeof item.reflectionPrompt === 'string'
    && strings(item.reasons) && strings(item.guidance) && Array.isArray(item.careers)
    && item.careers.every(c => c && typeof c.id === 'string' && typeof c.title === 'string' && typeof c.summary === 'string');
}
export function readDashboardCache(owner: string, locale: Locale, now = Date.now()): Snapshot | null {
  try {
    const value = memory.get(locale) ?? JSON.parse(localStorage.getItem(prefix + locale) || 'null');
    if (!value || value.owner !== owner || value.locale !== locale || typeof value.savedAt !== 'number'
      || now < value.savedAt || now - value.savedAt > maxAge || !validOverview(value.overview)) return null;
    return value;
  } catch { return null; }
}
export function invalidateDashboardCache() {
  generation += 1;
  memory.clear();
  pending.clear();
  for (const locale of locales) { try { localStorage.removeItem(prefix + locale); } catch { /* Storage may be unavailable. */ } }
}
export function reconcileDashboardCacheOwner(owner: string | null) {
  if (activeOwner !== undefined && activeOwner !== owner) invalidateDashboardCache();
  activeOwner = owner;
  for (const locale of locales) {
    try {
      const value = memory.get(locale) ?? JSON.parse(localStorage.getItem(prefix + locale) || 'null');
      if (value && value.owner !== owner) { invalidateDashboardCache(); return; }
    } catch { invalidateDashboardCache(); return; }
  }
  if (owner === null) invalidateDashboardCache();
}
/** Only cache a verified API projection, never compute account facts from drafts. */
export function refreshDashboardCache(owner: string, locale: Locale, load: () => Promise<DirectionOverview | null | undefined>) {
  const key = `${owner}:${locale}:${generation}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const started = generation;
  const request = load().then(overview => {
    if (started !== generation) throw new Error('Dashboard changed during refresh. Please retry.');
    if (validOverview(overview)) {
      const snapshot = { owner, locale, savedAt: Date.now(), overview };
      memory.set(locale, snapshot);
      try { localStorage.setItem(prefix + locale, JSON.stringify(snapshot)); } catch { /* Memory cache still works. */ }
    }
    return overview;
  }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
  pending.set(key, request);
  return request;
}
