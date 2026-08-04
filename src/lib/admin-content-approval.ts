import { xtaraApi } from '@/lib/api/client';

export type AdminContentApprovalResult = {
  approved: Array<{ id: string; reviewedBy: string; reviewedAt: string }>;
  failed: Array<{ id: string; error: string }>;
};

export const adminContentApprovalApi = {
  approve: (contentType: string, ids: string[]) =>
    xtaraApi.post<AdminContentApprovalResult>(
      `/admin/content/${encodeURIComponent(contentType)}/approve`,
      { ids },
    ),
};
