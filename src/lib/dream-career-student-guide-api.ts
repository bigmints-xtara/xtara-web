import { parseSavedCareerScreen } from '@/lib/saved-career-screen';
import { xtaraApi } from '@/lib/api/client';
import { xtaraApiOperationPath } from '@/lib/api/generated/xtara-api-operations';
import type {
  CareerStudentContextResponse,
  DreamCareerGuideLocale,
  DreamCareerStudentGuideResponse,
} from '@/types/dream-career-student-guide';

export async function getDreamCareerStudentGuide(
  careerId: string,
  options: {
    locale: DreamCareerGuideLocale;
    location?: { city?: string; state?: string; country?: string };
    signal?: AbortSignal;
  },
): Promise<DreamCareerStudentGuideResponse> {
  const path = xtaraApiOperationPath('getDreamCareersCareerIdStudentGuide', { careerId });
  const query = new URLSearchParams({ locale: options.locale });
  appendLocation(query, options.location);
  return xtaraApi.get<DreamCareerStudentGuideResponse>(`${path}?${query.toString()}`, {
    signal: options.signal,
  });
}

export async function getDreamCareerStudentContext(
  careerId: string,
  options: { signal?: AbortSignal; expectedUserId?: string; screenLocale?: DreamCareerGuideLocale } = {},
): Promise<CareerStudentContextResponse> {
  const path = xtaraApiOperationPath('getMeDreamCareersCareerIdStudentContext', { careerId });
  const query = options.screenLocale ? `?${new URLSearchParams({ screen: '1', locale: options.screenLocale })}` : '';
  const context = await xtaraApi.get<CareerStudentContextResponse>(path + query, { signal: options.signal, expectedUserId: options.expectedUserId });
  return context.screen ? { ...context, screen: parseSavedCareerScreen(context.screen) } : context;
}

function appendLocation(
  query: URLSearchParams,
  location: { city?: string; state?: string; country?: string } | undefined,
) {
  if (!location) return;
  for (const key of ['city', 'state', 'country'] as const) {
    const value = location[key]?.trim();
    if (value) query.set(key, value);
  }
}
