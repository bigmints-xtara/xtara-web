'use client';

import AdminMasterDetail from '@/components/admin/AdminMasterDetail';
import { FutureDirectionEditor } from '@/components/admin/editors/CuratedCareerEditors';
import { futureDirectionsConfig } from '@/lib/admin/configs/futureDirectionsConfig';
import type { FutureDirection } from '@/types/curated-career';

export default function AdminFutureDirectionsPage() {
  return (
    <div className="h-full">
      <AdminMasterDetail<FutureDirection>
        config={futureDirectionsConfig}
        renderEditor={(direction, onSave, onCancel) => (
          <FutureDirectionEditor entity={direction} onSave={onSave} onCancel={onCancel} />
        )}
      />
    </div>
  );
}
