'use client';

import AdminMasterDetail from '@/components/admin/AdminMasterDetail';
import { DreamCareerEditor } from '@/components/admin/editors/CuratedCareerEditors';
import { curatedDreamCareersConfig } from '@/lib/admin/configs/curatedDreamCareersConfig';
import type { CuratedDreamCareer } from '@/types/curated-career';

export default function AdminDreamCareersPage() {
  return (
    <div className="h-full">
      <AdminMasterDetail<CuratedDreamCareer>
        config={curatedDreamCareersConfig}
        renderEditor={(career, onSave, onCancel) => (
          <DreamCareerEditor
            entity={career}
            onSave={onSave}
            onCancel={onCancel}
          />
        )}
      />
    </div>
  );
}
