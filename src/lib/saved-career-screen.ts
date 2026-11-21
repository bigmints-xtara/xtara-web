import { z } from 'zod';
import { locales } from '@/i18n/config';

const text = z.string().min(1);
const block = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text }),
  z.object({
    kind: z.literal('heading'), text,
    phase: z.enum(['grades8To10', 'afterGrade10', 'afterGrade12']).optional(), current: z.boolean().optional(),
  }),
  z.object({ kind: z.literal('list'), items: z.array(text) }),
  z.object({ kind: z.literal('link'), label: text, url: z.string().regex(/^https?:\/\//i) }),
  z.object({
    kind: z.literal('offering'), matchLabel: text,
    offering: z.object({
      offeringId: text, institutionId: text, institutionName: text, title: text,
      city: z.string().optional(), state: z.string().optional(), match: z.enum(['direct', 'adjacent']),
    }),
  }),
  z.object({ kind: z.literal('action'), action: z.enum(['browse_study', 'all_states', 'retry']), label: text }),
]);

const screen = z.object({
  schemaVersion: z.literal(1), careerId: text, title: text, summary: z.string(), locale: z.enum(locales),
  englishFallback: z.boolean(), grade: z.string().optional(),
  tabs: z.array(z.object({
    id: z.enum(['overview', 'study']), title: text, sectionIds: z.array(text),
  })).optional().catch(undefined),
  sections: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9_-]*$/), title: text, blocks: z.array(block),
  })).min(1),
});

export type SavedCareerBlock = z.infer<typeof block>;
export type SavedCareerScreen = z.infer<typeof screen>;

// Older deployments and partially compatible API revisions use the existing editorial reader.
export function parseSavedCareerScreen(value: unknown): SavedCareerScreen | undefined {
  const parsed = screen.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
