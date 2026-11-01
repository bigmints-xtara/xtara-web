'use client';
import AdminMasterDetail from '@/components/admin/AdminMasterDetail';
import AssessmentDefinitionEditor from '@/components/admin/editors/AssessmentDefinitionEditor';
import { assessmentDefinitionsConfig, type AssessmentDefinitionAdmin } from '@/lib/admin/configs/assessmentDefinitionsConfig';
export default function AssessmentDefinitionsPage() {
  return <div className="h-full"><AdminMasterDetail<AssessmentDefinitionAdmin> config={assessmentDefinitionsConfig} renderEditor={(entity, onSave, onCancel) => <AssessmentDefinitionEditor entity={entity} onSave={onSave} onCancel={onCancel} />} /></div>;
}
