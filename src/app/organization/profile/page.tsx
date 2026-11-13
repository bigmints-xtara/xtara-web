"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";

import { OrganizationLoading, OrganizationError } from "@/components/organization/OrganizationPageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";
import { logoutApiSession } from "@/lib/api/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { updatePersonalInfo } from "@/lib/firebase/profile-service";
import {
  getOrganizationStaffProfile,
  getOrganizationUnits,
  leaveOrganization,
  listOrganizationWorkspaces,
  selectOrganizationWorkspace,
  updateOrganizationStaffProfile,
  type OrganizationStaffProfile,
  type OrganizationUnit,
  type OrganizationWorkspace,
} from "@/lib/organization";

export default function EducatorProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { context, isStaff, loading: workspaceLoading, error: workspaceError, refresh } = useOrganizationWorkspace();
  const router = useRouter();
  const [staff, setStaff] = useState<OrganizationStaffProfile | null>(null);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [workspaces, setWorkspaces] = useState<OrganizationWorkspace[]>([]);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading || workspaceLoading) return;
    if (!user || user.isAnonymous) {
      router.replace("/login?mode=educator&next=%2Forganization%2Fprofile");
      return;
    }
    if (workspaceError) return;
    if (!isStaff) {
      router.replace("/profile");
      return;
    }
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return null;
      setLoading(true);
      setStaff(null);
      setError("");
      return Promise.all([getOrganizationStaffProfile(), getOrganizationUnits(), listOrganizationWorkspaces()]);
    })
      .then((result) => {
        if (!active || !result) return;
        const [profile, unitItems, workspaceItems] = result;
        setStaff(profile);
        setUnits(unitItems);
        setWorkspaces(workspaceItems);
        setTitle(profile.profile.title);
        setDepartment(profile.profile.department);
        setPhone(profile.profile.phone);
        setBio(profile.profile.bio);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Could not load your educator profile."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authLoading, isStaff, router, user, workspaceLoading, workspaceError, attempt, context?.organization.id]);

  useEffect(() => {
    setFullName(userProfile?.fullName || user?.displayName || "");
    setDisplayName(userProfile?.displayName || user?.displayName || "");
  }, [user, userProfile]);

  const assignedUnits = useMemo(() => {
    const assigned = new Set(staff?.unitIds || []);
    return units.filter((unit) => assigned.has(unit.id));
  }, [staff, units]);

  const save = async () => {
    if (!user || !fullName.trim()) return;
    setSaving(true); setError(""); setStatus("");
    try {
      await Promise.all([
        updatePersonalInfo(user.uid, { fullName, displayName }),
        updateOrganizationStaffProfile({ title, department, phone, bio }),
      ]);
      setStatus("Educator profile saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your educator profile.");
    } finally {
      setSaving(false);
    }
  };

  const switchWorkspace = async (membershipId: string) => {
    setSwitching(membershipId); setError("");
    try {
      await selectOrganizationWorkspace(membershipId);
      await refresh();
      router.push("/organization");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not switch institution workspace.");
      setSwitching("");
    }
  };

  const leave = async () => {
    if (!context || !window.confirm(`Leave ${context.organization.name}? Your educator access to this workspace will end.`)) return;
    setSaving(true); setError("");
    try {
      await leaveOrganization();
      await refresh();
      router.push("/organization");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not leave the institution workspace.");
      setSaving(false);
    }
  };

  const logout = async () => {
    await logoutApiSession().catch(() => undefined);
    await signOut(getFirebaseAuth());
    router.push("/");
  };

  if (workspaceError) return <OrganizationError message={workspaceError.message} onRetry={() => void refresh()} />;
  if (authLoading || workspaceLoading || loading || !user || !isStaff) return <OrganizationLoading />;
  if (!staff) return <OrganizationError message={error || "Could not load your educator profile."} onRetry={() => setAttempt((value) => value + 1)} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-5 py-8 pb-20 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><Badge variant="secondary">Educator account</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">My educator profile</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">Your professional details, assigned classes, institution access, and account security.</p></div>
          <Button type="button" variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
        </div>

        {status ? <p role="status" className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><Check className="mr-2 inline h-4 w-4" />{status}</p> : null}
        {error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-primary/10 shadow-none">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />Professional details</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field><Field label="Preferred name"><Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></Field><Field label="Role or title"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Class teacher" /></Field><Field label="Department"><Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Student guidance" /></Field><Field label="Phone"><Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" /></Field><Field label="Email"><Input value={user.email || ""} disabled /></Field></div>
              <Field label="Professional bio"><Textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={600} placeholder="How you support learners and the areas you cover." /></Field>
              <div className="flex justify-end"><Button type="button" onClick={save} disabled={saving || !fullName.trim()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? "Saving…" : "Save profile"}</Button></div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-primary" />Current workspace</CardTitle></CardHeader><CardContent><p className="font-semibold text-primary">{staff.organization.name}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{formatLabel(staff.role)}</Badge>{assignedUnits.map((unit) => <Badge key={unit.id} variant="outline">{unit.name}</Badge>)}</div>{!assignedUnits.length ? <p className="mt-3 text-sm text-slate-500">Institution-wide access</p> : null}</CardContent></Card>

            {workspaces.length > 1 ? <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="text-lg">Institution workspaces</CardTitle></CardHeader><CardContent className="space-y-3">{workspaces.map((workspace) => <button type="button" key={workspace.membershipId} disabled={workspace.selected || Boolean(switching)} onClick={() => switchWorkspace(workspace.membershipId)} className="flex w-full items-center justify-between rounded-2xl border border-primary/10 p-4 text-left disabled:bg-slate-50"><span><span className="block text-sm font-medium text-primary">{workspace.organization.name}</span><span className="mt-1 block text-xs text-slate-500">{formatLabel(workspace.role)} · {formatLabel(workspace.effectiveStatus)}</span></span>{workspace.selected ? <Check className="h-4 w-4 text-emerald-700" /> : switching === workspace.membershipId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}</button>)}</CardContent></Card> : null}

            <Card className="border-primary/10 shadow-none"><CardContent className="p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" /><p className="text-sm leading-6 text-slate-600">Educator accounts do not contain personal career assessments. Student information is available only through your assigned institution scope.</p></div>{staff.role === "owner" ? <p className="mt-4 text-sm text-amber-800">Institution owners must transfer ownership before leaving or deleting their account.</p> : <Button type="button" variant="ghost" className="mt-3 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={leave} disabled={saving}>Leave this workspace</Button>}</CardContent></Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
