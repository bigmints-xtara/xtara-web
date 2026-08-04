"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Building2, CheckCircle2, Compass, Loader2, ShieldCheck, UserRound } from "lucide-react";

import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";
import {
  getOrganizationStudentProfile,
  getOrganizationUnits,
  type OrganizationMember,
  type OrganizationUnit,
} from "@/lib/organization";

export default function OrganizationStudentProfilePage() {
  const params = useParams<{ membershipId: string }>();
  const membershipId = decodeURIComponent(String(params.membershipId || ""));
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isStaff, loading: workspaceLoading } = useOrganizationWorkspace();
  const [student, setStudent] = useState<OrganizationMember | null>(null);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || workspaceLoading) return;
    if (!user) {
      router.replace(`/login?mode=educator&next=${encodeURIComponent(`/organization/students/${membershipId}`)}`);
      return;
    }
    if (!isStaff) {
      router.replace("/dashboard");
      return;
    }
    let active = true;
    Promise.all([getOrganizationStudentProfile(membershipId), getOrganizationUnits()])
      .then(([profile, unitItems]) => { if (active) { setStudent(profile); setUnits(unitItems); } })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Could not load this learner profile."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authLoading, isStaff, membershipId, router, user, workspaceLoading]);

  const unitNames = useMemo(() => {
    const names = new Map(units.map((unit) => [unit.id, unit.name]));
    return student?.unitIds.map((id) => names.get(id)).filter((name): name is string => Boolean(name)) || [];
  }, [student, units]);

  if (authLoading || workspaceLoading || loading || !user || !isStaff) return <LoadingPage />;
  if (!student) return <EmptyState error={error} />;

  const summary = student.assessmentSummary;
  const progress = student.directionProgress;

  return (
    <div className="min-h-screen bg-[#f7fafc] text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-8 pb-20 sm:py-12">
        <Button asChild variant="ghost" className="-ml-3"><Link href="/organization#learners"><ArrowLeft className="mr-2 h-4 w-4" />Back to learners</Link></Button>

        <section className="mt-5 overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-7 w-7" /></span><div><p className="text-sm text-white/60">Learner guidance profile</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{student.displayName}</h1></div></div><div className="flex flex-wrap gap-2">{unitNames.map((name) => <Badge key={name} className="border-white/20 bg-white/10 text-white" variant="outline">{name}</Badge>)}</div></div>
        </section>

        <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>This view contains only the guidance information this learner agreed to share with assigned educators. Private answers and family context are not shown.</p></div>
        {error ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" />Assessment summary</CardTitle></CardHeader><CardContent>{student.assessmentStatus === "completed" && summary ? <div className="space-y-5"><div className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />Assessment completed{summary.stage ? ` · ${formatLabel(summary.stage)}` : ""}</div><InsightList label="Career directions" values={summary.areas?.map((item) => item.title) || []} /><InsightList label="Signals and strengths" values={summary.signals?.map((item) => item.title) || []} /></div> : <p className="text-sm leading-6 text-slate-500">A compatible assessment summary has not been completed or shared yet.</p>}</CardContent></Card>

          <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5 text-primary" />Direction progress</CardTitle></CardHeader><CardContent>{progress ? <div className="space-y-4"><Metric label="Dream careers selected" value={String(progress.selectedCareerCount)} /><Metric label="Next actions completed" value={String(progress.completedActions)} />{progress.reviewOn ? <Metric label="Review date" value={formatDate(progress.reviewOn)} /> : null}</div> : <p className="text-sm leading-6 text-slate-500">No direction plan is shared yet. This learner may need a conversation to choose the next practical step.</p>}</CardContent></Card>
        </div>

        <Card className="mt-6 border-primary/10 shadow-none"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-primary">Suggested educator follow-up</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use the shared directions and progress above to ask what the learner wants to investigate next. Xtara does not present these signals as a ranking or final career verdict.</p></div><Badge variant="secondary" className="w-fit">{progress ? "Review progress" : "Conversation needed"}</Badge></CardContent></Card>
      </main>
    </div>
  );
}

function InsightList({ label, values }: { label: string; values: string[] }) {
  return <div><p className="text-sm font-medium text-primary">{label}</p><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((value) => <Badge key={value} variant="secondary" className="whitespace-normal text-left">{value}</Badge>) : <span className="text-sm text-slate-500">Not shared yet</span>}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-600">{label}</span><span className="font-semibold text-primary">{value}</span></div>;
}

function EmptyState({ error }: { error: string }) {
  return <div className="min-h-screen bg-[#f7fafc]"><Header /><main className="mx-auto max-w-lg px-5 py-24 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-semibold text-primary">Learner profile unavailable</h1><p className="mt-3 leading-7 text-slate-600">{error || "This learner is outside your assigned institution scope."}</p><Button asChild className="mt-6"><Link href="/organization">Return to workspace</Link></Button></main></div>;
}

function LoadingPage() { return <div className="flex min-h-svh items-center justify-center bg-[#f7fafc]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>; }
function formatLabel(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
