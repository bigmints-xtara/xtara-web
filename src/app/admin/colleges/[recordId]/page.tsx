'use client';

import { useParams } from 'next/navigation';

import AdminCollegeDetailPage from '@/components/admin/AdminCollegeDetailPage';

export default function AdminCollegeRecordRoute() {
  const params = useParams<{ recordId: string }>();
  return <AdminCollegeDetailPage collegeId={decodeURIComponent(params.recordId)} key={params.recordId} />;
}
