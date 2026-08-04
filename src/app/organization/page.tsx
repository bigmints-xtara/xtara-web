"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Copy,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";

import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  createOrganizationInvitation,
  createOrganizationUnit,
  getOrganizationContext,
  getOrganizationDashboard,
  getOrganizationUnits,
  removeOrganizationMember,
  type OrganizationContext,
  type OrganizationDashboard,
  type OrganizationRole,
  type OrganizationUnit,
} from "@/lib/organization";

export default function OrganizationDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [dashboard, setDashboard] = useState<OrganizationDashboard | null>(null);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCode, setNewCode] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    const nextContext = await getOrganizationContext();
    setContext(nextContext);
    if (!nextContext) {
      setLoading(false);
      return;
    }
    if (nextContext.membership.role === "student") {
      router.replace("/dashboard");
      return;
    }
    if (nextContext.accessMode === "none") {
      setLoading(false);
      return;
    }
    const [nextDashboard, nextUnits] = await Promise.all([
      getOrganizationDashboard(),
      getOrganizationUnits(),
    ]);
    setDashboard(nextDashboard);
    setUnits(nextUnits);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?mode=educator&next=%2Forganization");
      return;
    }
    const timer = window.setTimeout(() => {
      refresh().catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Could not load the institution workspace.");
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, refresh, router, user]);

  if (authLoading || loading || !user) return <LoadingPage />;
  if (!context) return <NoWorkspace />;

  return (
    <div className="min-h-screen bg-[#f7fafc] text-foreground">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-8 pb-20 sm:py-10">
        <section className="overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><Badge className="border-white/20 bg-white/10 text-white" variant="outline">{formatRole(context.membership.role)}</Badge><Badge className="border-white/20 bg-white/10 text-white" variant="outline">{formatLabel(context.effectiveStatus)}</Badge></div><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{context.organization.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Help learners understand their options, identify where support is needed, and follow through on practical next actions.</p></div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm"><p className="text-white/60">Access until</p><p className="mt-1 font-medium">{formatDate(context.organization.accessEndsAt)}</p></div>
          </div>
        </section>

        {context.accessMode !== "full" ? <LifecycleNotice context={context} /> : null}
        {error ? <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        {dashboard ? <>
          <SummaryGrid dashboard={dashboard} />
          <div className="mt-7 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
            <LearnerRoster
              dashboard={dashboard}
              units={units}
              canManage={context.accessMode === "full" && context.permissions.includes("members.manage")}
              onRemoved={refresh}
            />
            <div className="space-y-6">
              <UnitScope units={units} role={context.membership.role} />
              <CohortInsights dashboard={dashboard} />
              {context.accessMode === "full" && context.permissions.includes("units.manage") ? <CreateUnitCard units={units} onCreated={refresh} /> : null}
              {context.accessMode === "full" && context.permissions.includes("invitations.manage") ? <CreateInvitationCard role={context.membership.role} units={units} onCreated={setNewCode} /> : null}
            </div>
          </div>
        </> : null}

        {newCode ? <InvitationCodeDialog code={newCode} onClose={() => setNewCode("")} /> : null}
      </main>
    </div>
  );
}

function SummaryGrid({ dashboard }: { dashboard: OrganizationDashboard }) {
  const items = [
    { label: "Active learners", value: dashboard.summary.activeStudents, icon: Users },
    { label: "Assessment complete", value: dashboard.summary.assessmentCompleted, icon: CheckCircle2 },
    { label: "Awaiting assessment", value: dashboard.summary.awaitingAssessment, icon: ClipboardList },
    { label: "Needs follow-up", value: dashboard.summary.followUpNeeded, icon: UserRoundCheck },
  ];
  return <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Guidance summary">{items.map(({ label, value, icon: Icon }) => <Card key={label} className="border-primary/10 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-primary">{value}</p><p className="text-sm text-slate-500">{label}</p></div></CardContent></Card>)}</section>;
}

function LearnerRoster({ dashboard, units, canManage, onRemoved }: {
  dashboard: OrganizationDashboard;
  units: OrganizationUnit[];
  canManage: boolean;
  onRemoved: () => Promise<void>;
}) {
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]));
  const remove = async (membershipId: string, learnerName: string) => {
    if (!window.confirm(`Remove ${learnerName} from your authorized institution scope? Their personal Xtara data will remain intact.`)) return;
    await removeOrganizationMember(membershipId);
    await onRemoved();
  };
  return <Card id="learners" className="scroll-mt-24 border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-xl"><GraduationCap className="h-5 w-5 text-primary" />Learner guidance</CardTitle><p className="text-sm text-slate-500">Only learners inside your authorized class or institution scope are shown.</p></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3 font-medium">Learner</th><th className="px-4 py-3 font-medium">Class or group</th><th className="px-4 py-3 font-medium">Assessment</th><th className="px-4 py-3 font-medium">Direction</th>{canManage ? <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th> : null}</tr></thead><tbody>{dashboard.students.map((student) => <tr key={student.id} className="border-b last:border-0"><td className="px-6 py-4"><Link href={`/organization/students/${encodeURIComponent(student.id)}`} className="font-medium text-primary underline-offset-4 hover:underline">{student.displayName}</Link><p className="mt-1 text-xs text-slate-500">Sharing: {formatLabel(student.consentStatus)}</p></td><td className="px-4 py-4 text-slate-600">{student.unitIds.map((id) => unitNames.get(id)).filter(Boolean).join(", ") || "—"}</td><td className="px-4 py-4"><Badge variant={student.assessmentStatus === "completed" ? "secondary" : "outline"}>{formatLabel(student.assessmentStatus)}</Badge></td><td className="px-4 py-4 text-slate-600">{student.directionProgress ? `${student.directionProgress.completedActions} actions complete` : "Follow-up needed"}</td>{canManage ? <td className="px-4 py-4 text-right"><Button type="button" size="sm" variant="ghost" className="text-slate-500" onClick={() => remove(student.id, student.displayName)}>Remove</Button></td> : null}</tr>)}{!dashboard.students.length ? <tr><td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-slate-500">Invite learners to a class to begin the guidance workspace.</td></tr> : null}</tbody></table></div></CardContent></Card>;
}

function UnitScope({ units, role }: { units: OrganizationUnit[]; role: OrganizationRole }) {
  const institutionWide = role === "owner" || role === "admin";
  return <Card id="classes" className="scroll-mt-24 border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-primary" />{institutionWide ? "Institution scope" : "Assigned classes"}</CardTitle><p className="text-sm text-slate-500">{institutionWide ? "Your role can work across the institution." : "Learners and insights are limited to these classes and their child groups."}</p></CardHeader><CardContent><div className="flex flex-wrap gap-2">{units.length ? units.map((unit) => <Badge key={unit.id} variant="outline">{unit.name}</Badge>) : <Badge variant="secondary">Institution-wide</Badge>}</div></CardContent></Card>;
}

function CohortInsights({ dashboard }: { dashboard: OrganizationDashboard }) {
  return <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" />Cohort signals</CardTitle><p className="text-sm text-slate-500">Areas appear only when at least {dashboard.privacyThreshold} learners contribute.</p></CardHeader><CardContent className="space-y-3">{dashboard.cohortInsights.map((insight) => <div key={insight.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm font-medium text-primary">{insight.title}</span><Badge variant="outline">{insight.count} learners</Badge></div>)}{!dashboard.cohortInsights.length ? <p className="text-sm leading-6 text-slate-500">No cohort area has reached the privacy threshold yet. Individual rankings are never shown.</p> : null}</CardContent></Card>;
}

function CreateUnitCard({ units, onCreated }: { units: OrganizationUnit[]; onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("class");
  const [parentUnitId, setParentUnitId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(""); try { await createOrganizationUnit({ name, kind, parentUnitId: parentUnitId || undefined }); setName(""); await onCreated(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the class."); } finally { setSaving(false); } };
  return <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5 text-primary" />Add a class or group</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><Input aria-label="Class or group name" placeholder="Class 9A" value={name} onChange={(event) => setName(event.target.value)} required /><select aria-label="Unit type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value)}><option value="class">Class</option><option value="grade">Grade</option><option value="guidance_group">Guidance group</option><option value="department">Department</option></select>{units.length ? <select aria-label="Parent unit" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={parentUnitId} onChange={(event) => setParentUnitId(event.target.value)}><option value="">No parent unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select> : null}{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={saving || !name.trim()} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Add unit</Button></form></CardContent></Card>;
}

function CreateInvitationCard({ role, units, onCreated }: { role: OrganizationRole; units: OrganizationUnit[]; onCreated: (code: string) => void }) {
  const [invitedRole, setInvitedRole] = useState<Exclude<OrganizationRole, "owner">>("student");
  const [unitId, setUnitId] = useState("");
  const [email, setEmail] = useState("");
  const [maxUses, setMaxUses] = useState(40);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const staffRoles = role === "owner" || role === "admin";
  const unitRequired = invitedRole !== "admin";
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(""); try { const invitation = await createOrganizationInvitation({ role: invitedRole, unitIds: unitId ? [unitId] : [], email: invitedRole === "student" ? undefined : email, maxUses: invitedRole === "student" ? maxUses : 1 }); onCreated(invitation.code); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the invitation."); } finally { setSaving(false); } };
  return <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRoundCheck className="h-5 w-5 text-primary" />Create an invitation</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><select aria-label="Invitation role" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={invitedRole} onChange={(event) => setInvitedRole(event.target.value as typeof invitedRole)}><option value="student">Student</option>{staffRoles ? <><option value="admin">Organization admin</option><option value="unit_admin">Class admin</option><option value="educator">Educator</option><option value="counselor">Counselor</option></> : null}</select><select aria-label="Assigned class or group" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={unitId} onChange={(event) => setUnitId(event.target.value)} required={unitRequired}><option value="">{unitRequired ? "Choose class or group" : "Institution-wide"}</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>{invitedRole === "student" ? <label className="block space-y-1"><span className="text-xs text-slate-500">Maximum learners</span><Input type="number" min={1} max={500} value={maxUses} onChange={(event) => setMaxUses(Number(event.target.value))} /></label> : <Input type="email" placeholder="educator@example.edu" value={email} onChange={(event) => setEmail(event.target.value)} required />}{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={saving || (unitRequired && !unitId)} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create invitation</Button></form></CardContent></Card>;
}

function LifecycleNotice({ context }: { context: OrganizationContext }) {
  return <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><CalendarClock className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-medium">{context.accessMode === "read_only" ? "Read-only grace period" : "Institution access has ended"}</p><p className="mt-1 text-amber-900/80">{context.accessMode === "read_only" ? `Changes and new invitations are disabled. Grace ends ${formatDate(context.organization.graceEndsAt)}.` : "Learner accounts and assessments remain available to each learner, but this institution workspace can no longer view them."}</p></div></div>;
}

function InvitationCodeDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = typeof window === "undefined" ? code : `${window.location.origin}/join/${encodeURIComponent(code)}`;
  const copy = async () => { await navigator.clipboard.writeText(joinUrl); setCopied(true); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5" role="dialog" aria-modal="true" aria-labelledby="invite-code-title"><Card className="w-full max-w-lg"><CardContent className="p-7"><ShieldCheck className="h-8 w-8 text-emerald-700" /><h2 id="invite-code-title" className="mt-4 text-2xl font-semibold text-primary">Invitation created</h2><p className="mt-2 text-sm leading-6 text-slate-600">This is the only time the full code is returned. Share the link through a trusted channel.</p><div className="mt-5 break-all rounded-xl bg-slate-50 p-4 font-mono text-sm text-primary">{joinUrl}</div><div className="mt-5 flex gap-3"><Button type="button" onClick={copy}>{copied ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy link"}</Button><Button type="button" variant="outline" onClick={onClose}>Done</Button></div></CardContent></Card></div>;
}

function NoWorkspace() {
  return <div className="min-h-screen bg-[#f7fafc]"><Header /><main className="mx-auto max-w-xl px-5 py-24 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-semibold text-primary">No institution workspace yet</h1><p className="mt-3 leading-7 text-slate-600">Create a school or educational institution workspace, or join one using an invitation.</p><Button asChild className="mt-6"><Link href="/organization/signup">Create institution workspace</Link></Button></main></div>;
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-[#f7fafc]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>; }
function formatRole(value: string) { return value === "unit_admin" ? "Class admin" : formatLabel(value); }
function formatLabel(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
