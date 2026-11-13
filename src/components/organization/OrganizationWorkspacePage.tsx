"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  UserRoundCheck,
  CheckCircle2,
  CalendarClock,
  Copy,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { OrganizationLoading, OrganizationError } from "@/components/organization/OrganizationPageState";
import { TeacherOverview, TeacherStudentList } from "./TeacherGuidance";
import NavigationPending from "@/components/organization/NavigationPending";
import { useTranslations } from "@/i18n/language-provider";
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

export default function OrganizationWorkspacePage({ section = "overview" }: { section?: "overview" | "learners" | "classes" }) {
  const { t } = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [dashboard, setDashboard] = useState<OrganizationDashboard | null>(null);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCode, setNewCode] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setDashboard(null);
    setUnits([]);
    try {
      const nextContext = await getOrganizationContext();
      setContext(nextContext);
      if (!nextContext) {
        return;
      }
      if (nextContext.membership.role === "student") {
        router.replace("/dashboard");
        return;
      }
      if (nextContext.accessMode === "none") {
        return;
      }
      const [nextDashboard, nextUnits] = await Promise.all([
        section === "classes" ? Promise.resolve(null) : getOrganizationDashboard(),
        section === "overview" ? Promise.resolve([]) : getOrganizationUnits(),
      ]);
      setDashboard(nextDashboard);
      setUnits(nextUnits);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load institution workspace.");
    } finally {
      setLoading(false);
    }
  }, [router, section]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.isAnonymous) {
      const destination = section === "overview" ? "/organization" : `/organization/${section}`;
      router.replace(`/login?mode=educator&next=${encodeURIComponent(destination)}`);
      return;
    }
    const timer = window.setTimeout(() => {
      refresh().catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Could not load the institution workspace.");
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, refresh, router, user, section]);

  useEffect(() => {
    if (section !== "overview") return;
    const destination = window.location.hash.slice(1);
    if (destination === "learners" || destination === "classes") router.replace(`/organization/${destination}`);
  }, [router, section]);

  if (authLoading || loading || !user || user.isAnonymous || context?.membership.role === "student") return <OrganizationLoading />;
  if (error) return <OrganizationError message={error} onRetry={() => void refresh()} />;
  if (!context) return <NoWorkspace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-5 py-8 pb-20 sm:py-10">
        <section className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
          <h1 className="text-xl font-semibold tracking-tight">{context.organization.name}</h1>
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">{formatRole(context.membership.role)}</Badge><Badge variant="outline">{formatLabel(context.effectiveStatus)}</Badge></div>
        </section>

        {context.accessMode !== "full" ? <LifecycleNotice context={context} /> : null}
        {section !== "overview" ? <h2 className="mt-7 text-2xl font-semibold">{t(`header.nav.${section}`)}</h2> : null}
        {context.accessMode !== "none" ? <>
          {section === "overview" && dashboard ? <>
            <TeacherOverview dashboard={dashboard} />
          </> : null}
          {section === "learners" && dashboard ? <div className="mt-6 space-y-6">
            <TeacherStudentList students={dashboard.students} />
            {context.permissions.includes("members.manage") ? <LearnerRoster dashboard={dashboard} units={units} canManage={context.accessMode === "full" && context.permissions.includes("members.manage")} onRemoved={refresh} /> : null}
            {context.accessMode === "full" && context.permissions.includes("invitations.manage") ? <CreateInvitationCard role={context.membership.role} units={units} onCreated={setNewCode} /> : null}
          </div> : null}
          {section === "classes" ? <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <UnitScope units={units} role={context.membership.role} />
            {context.accessMode === "full" && context.permissions.includes("units.manage") ? <CreateUnitCard units={units} onCreated={refresh} /> : null}
          </div> : null}
        </> : null}

        {newCode ? <InvitationCodeDialog code={newCode} onClose={() => setNewCode("")} /> : null}
      </main>
    </div>
  );
}

function LearnerRoster({ dashboard, units, canManage, onRemoved }: {
  dashboard: OrganizationDashboard;
  units: OrganizationUnit[];
  canManage: boolean;
  onRemoved: () => Promise<void>;
}) {
  const [removing, setRemoving] = useState("");
  const [removeError, setRemoveError] = useState("");
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]));
  const remove = async (membershipId: string, learnerName: string) => {
    if (!window.confirm(`Remove ${learnerName} from your authorized institution scope? Their personal Xtara data will remain intact.`)) return;
    setRemoving(membershipId);
    setRemoveError("");
    try {
      await removeOrganizationMember(membershipId);
      await onRemoved();
    } catch (reason) {
      setRemoveError(reason instanceof Error ? reason.message : "Could not remove learner.");
    } finally {
      setRemoving("");
    }
  };
  return <Card id="learners" className="scroll-mt-24 border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-xl"><GraduationCap className="h-5 w-5 text-primary" />Learner guidance</CardTitle><p className="text-sm text-muted-foreground">Only learners inside your authorized class or institution scope are shown.</p></CardHeader><CardContent className="p-0">{removeError ? <p role="alert" className="px-6 py-3 text-destructive">{removeError}</p> : null}<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y bg-muted text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Learner</th><th className="px-4 py-3 font-medium">Class or group</th><th className="px-4 py-3 font-medium">Assessment</th><th className="px-4 py-3 font-medium">Direction</th>{canManage ? <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th> : null}</tr></thead><tbody>{dashboard.students.map((student) => <tr key={student.id} className="border-b last:border-0"><td className="px-6 py-4"><Link href={`/organization/students/${encodeURIComponent(student.id)}`} className="font-medium text-primary underline-offset-4 hover:underline">{student.displayName}<NavigationPending /></Link><p className="mt-1 text-xs text-muted-foreground">Sharing: {formatLabel(student.consentStatus)}</p></td><td className="px-4 py-4 text-muted-foreground">{student.unitIds.map((id) => unitNames.get(id)).filter(Boolean).join(", ") || "—"}</td><td className="px-4 py-4"><Badge variant={student.assessmentStatus === "completed" ? "secondary" : "outline"}>{formatLabel(student.assessmentStatus)}</Badge></td><td className="px-4 py-4 text-muted-foreground">{student.directionProgress ? `${student.directionProgress.completedActions} actions complete` : "Not shared"}</td>{canManage ? <td className="px-4 py-4 text-right"><Button type="button" size="sm" variant="ghost" className="text-muted-foreground" disabled={Boolean(removing)} onClick={() => void remove(student.id, student.displayName)}>{removing === student.id ? <Loader2 aria-label="Removing learner" className="mr-2 h-4 w-4 animate-spin" /> : null}Remove</Button></td> : null}</tr>)}{!dashboard.students.length ? <tr><td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-muted-foreground">Invite learners to a class to begin the guidance workspace.</td></tr> : null}</tbody></table></div></CardContent></Card>;
}

function UnitScope({ units, role }: { units: OrganizationUnit[]; role: OrganizationRole }) {
  const institutionWide = role === "owner" || role === "admin";
  return <Card id="classes" className="scroll-mt-24 border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-primary" />{institutionWide ? "Institution scope" : "Assigned classes"}</CardTitle><p className="text-sm text-muted-foreground">{institutionWide ? "Your role can work across the institution." : "Learners and insights are limited to these classes and their child groups."}</p></CardHeader><CardContent><div className="flex flex-wrap gap-2">{units.length ? units.map((unit) => <Badge key={unit.id} variant="outline">{unit.name}</Badge>) : <Badge variant="secondary">Institution-wide</Badge>}</div></CardContent></Card>;
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
  return <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRoundCheck className="h-5 w-5 text-primary" />Create an invitation</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><select aria-label="Invitation role" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={invitedRole} onChange={(event) => setInvitedRole(event.target.value as typeof invitedRole)}><option value="student">Student</option>{staffRoles ? <><option value="admin">Organization admin</option><option value="unit_admin">Class admin</option><option value="educator">Educator</option><option value="counselor">Counselor</option></> : null}</select><select aria-label="Assigned class or group" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={unitId} onChange={(event) => setUnitId(event.target.value)} required={unitRequired}><option value="">{unitRequired ? "Choose class or group" : "Institution-wide"}</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>{invitedRole === "student" ? <label className="block space-y-1"><span className="text-xs text-muted-foreground">Maximum learners</span><Input type="number" min={1} max={500} value={maxUses} onChange={(event) => setMaxUses(Number(event.target.value))} /></label> : <Input type="email" placeholder="educator@example.edu" value={email} onChange={(event) => setEmail(event.target.value)} required />}{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<Button type="submit" disabled={saving || (unitRequired && !unitId)} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create invitation</Button></form></CardContent></Card>;
}

function LifecycleNotice({ context }: { context: OrganizationContext }) {
  return <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><CalendarClock className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-medium">{context.accessMode === "read_only" ? "Read-only grace period" : "Institution access has ended"}</p><p className="mt-1 text-amber-900/80">{context.accessMode === "read_only" ? `Changes and new invitations are disabled. Grace ends ${formatDate(context.organization.graceEndsAt)}.` : "Learner accounts and assessments remain available to each learner, but this institution workspace can no longer view them."}</p></div></div>;
}

function InvitationCodeDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = typeof window === "undefined" ? code : `${window.location.origin}/join/${encodeURIComponent(code)}`;
  const copy = async () => { await navigator.clipboard.writeText(joinUrl); setCopied(true); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5" role="dialog" aria-modal="true" aria-labelledby="invite-code-title"><Card className="w-full max-w-lg"><CardContent className="p-7"><ShieldCheck className="h-8 w-8 text-emerald-700" /><h2 id="invite-code-title" className="mt-4 text-2xl font-semibold text-primary">Invitation created</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This is the only time the full code is returned. Share the link through a trusted channel.</p><div className="mt-5 break-all rounded-xl bg-muted p-4 font-mono text-sm text-primary">{joinUrl}</div><div className="mt-5 flex gap-3"><Button type="button" onClick={copy}>{copied ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy link"}</Button><Button type="button" variant="outline" onClick={onClose}>Done</Button></div></CardContent></Card></div>;
}

function NoWorkspace() {
  return <div className="min-h-screen bg-background"><main className="mx-auto max-w-xl px-5 py-24 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-semibold text-primary">No institution workspace yet</h1><p className="mt-3 leading-7 text-muted-foreground">Create a school or educational institution workspace, or join one using an invitation.</p><Button asChild className="mt-6"><Link href="/organization/signup">Create institution workspace</Link></Button></main></div>;
}

function formatRole(value: string) { return value === "unit_admin" ? "Class admin" : formatLabel(value); }
function formatLabel(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
