'use client';

import { useParams } from 'next/navigation';

import AdminContentEditorPage from '@/components/admin/AdminContentEditorPage';

export default function AdminContentRecordRoute() {
  const params = useParams<{ contentType: string; recordId: string }>();
  return <AdminContentEditorPage contentType={params.contentType} key={`${params.contentType}:${params.recordId}`} recordId={params.recordId} />;
}
