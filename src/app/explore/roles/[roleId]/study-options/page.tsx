import { Suspense } from "react";
import { notFound } from "next/navigation";
import StudyOptions from "@/components/careers/StudyOptions";
import { isStudyOptionsCareer } from "@/lib/study-options";

export default async function StudyOptionsPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  if (!isStudyOptionsCareer(roleId)) notFound();

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
      <StudyOptions careerId={roleId} />
    </Suspense>
  );
}
