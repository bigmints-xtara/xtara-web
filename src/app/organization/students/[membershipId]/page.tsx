"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";

import { OrganizationLoading, OrganizationError } from "@/components/organization/OrganizationPageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentAssessmentVisuals } from "@/components/organization/TeacherGuidance";
import { useTranslations } from "@/i18n/language-provider";
import { teacherGuidanceCopy } from "@/lib/teacher-guidance-copy";
import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";
import {
  getOrganizationStudentProfile,
  getOrganizationUnits,
  type OrganizationMember,
  type OrganizationUnit,
} from "@/lib/organization";

export default function OrganizationStudentProfilePage() {
  const { locale } = useTranslations();
  const copy = teacherGuidanceCopy(locale);
  const params = useParams<{ membershipId: string }>();
  const membershipId = decodeURIComponent(String(params.membershipId || ""));
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { context, isStaff, loading: workspaceLoading, error: workspaceError, refresh } = useOrganizationWorkspace();
  const [student, setStudent] = useState<OrganizationMember | null>(null);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading || workspaceLoading) return;
    if (!user || user.isAnonymous) {
      router.replace(`/login?mode=educator&next=${encodeURIComponent(`/organization/students/${membershipId}`)}`);
      return;
    }
    if (workspaceError) return;
    if (!isStaff) {
      router.replace("/dashboard");
      return;
    }
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return null;
      setLoading(true);
      setStudent(null);
      setError("");
      return Promise.all([getOrganizationStudentProfile(membershipId), getOrganizationUnits()]);
    })
      .then((result) => {
        if (!active || !result) return;
        const [profile, unitItems] = result;
        setStudent(profile);
        setUnits(unitItems);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Could not load this learner profile."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authLoading, isStaff, membershipId, router, user, workspaceLoading, workspaceError, attempt, context?.organization.id]);

  const unitNames = useMemo(() => {
    const names = new Map(units.map((unit) => [unit.id, unit.name]));
    return student?.unitIds.map((id) => names.get(id)).filter((name): name is string => Boolean(name)) || [];
  }, [student, units]);

  if (workspaceError) return <OrganizationError message={workspaceError.message} onRetry={() => void refresh()} />;
  if (authLoading || workspaceLoading || loading || !user || !isStaff) return <OrganizationLoading />;
  if (!student) return <OrganizationError message={error || "Learner profile unavailable."} onRetry={() => setAttempt((value) => value + 1)} />;


  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-5 py-8 pb-20 sm:py-12">
        <Button asChild variant="ghost" className="-ml-3"><Link href="/organization/learners"><ArrowLeft className="mr-2 h-4 w-4" />{copy.back}</Link></Button>

        <section className="mt-5 overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-7 w-7" /></span><div><p className="text-sm text-white/60">{copy.profile}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{student.displayName}</h1></div></div><div className="flex flex-wrap gap-2">{unitNames.map((name) => <Badge key={name} className="border-white/20 bg-white/10 text-white" variant="outline">{name}</Badge>)}</div></div>
        </section>

        <div className="mt-6 flex gap-3 rounded-2xl border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><p>{copy.privacyNote}</p></div>
        <StudentAssessmentVisuals student={student} />

      </main>
    </div>
  );
}
