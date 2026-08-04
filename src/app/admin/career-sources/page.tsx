'use client';

import AdminMasterDetail from '@/components/admin/AdminMasterDetail';
import { CareerSourceEditor } from '@/components/admin/editors/CuratedCareerEditors';
import { careerSourcesConfig } from '@/lib/admin/configs/careerSourcesConfig';
import type { CuratedCareerSource } from '@/types/curated-career';

export default function AdminCareerSourcesPage() {
  return (
    <div className="h-full">
      <AdminMasterDetail<CuratedCareerSource>
        config={careerSourcesConfig}
        renderEditor={(source, onSave, onCancel) => (
          <CareerSourceEditor entity={source} onSave={onSave} onCancel={onCancel} />
        )}
      />
    </div>
  );
}
