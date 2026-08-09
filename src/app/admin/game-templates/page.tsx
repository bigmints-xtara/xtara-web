'use client';

import AdminMasterDetail from '@/components/admin/AdminMasterDetail';
import GameTemplateEditor from '@/components/admin/editors/GameTemplateEditor';
import { gameTemplatesConfig } from '@/lib/admin/configs/gameTemplatesConfig';
import type { GameTemplate } from '@/types/admin';

export default function AdminGameTemplatesPage() {
  return <AdminMasterDetail<GameTemplate> config={gameTemplatesConfig} renderEditor={(template, onSave, onCancel) => <GameTemplateEditor onCancel={onCancel} onSave={onSave} template={template} />} />;
}
