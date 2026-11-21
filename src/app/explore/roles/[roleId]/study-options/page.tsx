import { Suspense } from "react";
import { notFound } from "next/navigation";
import StudyOptions from "@/components/careers/StudyOptions";

export default async function StudyOptionsPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/.test(roleId)) notFound();

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
      <StudyOptions careerId={roleId} />
    </Suspense>
  );
}
