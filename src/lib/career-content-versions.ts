import { xtaraApi } from '@/lib/api/client';

export type CareerContentVersionStatus = 'draft' | 'inReview' | 'approved' | 'live' | 'superseded' | 'discarded';

export interface CareerContentVersion {
  id: string;
  schemaVersion: 1;
  collectionName: 'dream_careers' | 'future_directions' | 'assessment_definitions';
  recordId: string;
  revision: number;
  lockVersion: number;
  status: CareerContentVersionStatus;
  content: Record<string, unknown>;
  basedOnVersionId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  promotedAt?: string;
  promotedBy?: string;
}

export interface CareerContentVersionHistory {
  live: CareerContentVersion | null;
  active: CareerContentVersion | null;
  versions: CareerContentVersion[];
}
export type CareerVersionAction = 'submit' | 'approve' | 'return-to-draft' | 'promote' | 'approve-english-guide' | 'promote-english-guide';

export function isEnglishCatalogueGuideCandidate(version?: CareerContentVersion | null) {
  const guide = version?.content?.studentGuide as { provenance?: { sourceVersion?: string } } | undefined;
  const translated = version?.content?.studentGuideTranslations;
  return version?.collectionName === 'dream_careers'
    && /^xtara-catalog:[a-f0-9]{40}:[a-f0-9]{64}$/.test(guide?.provenance?.sourceVersion ?? '')
    && (!translated || (typeof translated === 'object' && Object.keys(translated).length === 0));
}

function basePath(contentType: string, recordId: string): string {
  return `/admin/content/${encodeURIComponent(contentType)}/${encodeURIComponent(recordId)}/versions`;
}

export const careerContentVersionsApi = {
  history: (contentType: string, recordId: string) =>
    xtaraApi.get<CareerContentVersionHistory>(basePath(contentType, recordId)),
  createDraft: (contentType: string, recordId: string) =>
    xtaraApi.post<CareerContentVersion>(basePath(contentType, recordId)),
  saveDraft: (contentType: string, recordId: string, version: CareerContentVersion, content: Record<string, unknown>) =>
    xtaraApi.patch<CareerContentVersion>(
      `${basePath(contentType, recordId)}/${encodeURIComponent(version.id)}`,
      { content, lockVersion: version.lockVersion },
    ),
  action: (contentType: string, recordId: string, version: CareerContentVersion, action: CareerVersionAction) =>
    xtaraApi.post<CareerContentVersion>(
      `${basePath(contentType, recordId)}/${encodeURIComponent(version.id)}/${action}`,
      { lockVersion: version.lockVersion },
    ),
};
