import { xtaraApi } from '@/lib/api/client';

export type CareerContentVersionStatus = 'draft' | 'inReview' | 'approved' | 'live' | 'superseded' | 'discarded';

export interface CareerContentVersion {
  id: string;
  schemaVersion: 1;
  collectionName: 'dream_careers' | 'future_directions';
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
  action: (contentType: string, recordId: string, version: CareerContentVersion, action: 'submit' | 'approve' | 'return-to-draft' | 'promote') =>
    xtaraApi.post<CareerContentVersion>(
      `${basePath(contentType, recordId)}/${encodeURIComponent(version.id)}/${action}`,
      { lockVersion: version.lockVersion },
    ),
};
