"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/i18n/language-provider";
import { organizationProfileCopy } from "@/lib/organization-profile-copy";
import { useQueryClient } from "@tanstack/react-query";
import { xtaraApi } from "@/lib/api/client";
import type { UserProfile } from "@/lib/firebase/auth-helpers";
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
  const { locale } = useTranslations();
  const copy = organizationProfileCopy[locale];
  const { user, userProfile, loading: authLoading } = useAuth();
  const { context, isStaff, loading: workspaceLoading, error: workspaceError, refresh } = useOrganizationWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const owner = useRef({ uid: user?.uid, membershipId: context?.membership.id });
  owner.current = { uid: user?.uid, membershipId: context?.membership.id };
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
      setSaving(false);
      setStatus("");
      setError("");
      return Promise.all([getOrganizationStaffProfile(user.uid), getOrganizationUnits(), listOrganizationWorkspaces()]);
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
  }, [authLoading, isStaff, router, user, workspaceLoading, workspaceError, attempt, context?.organization.id, context?.membership.id]);

  const initializedOwner = useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !user || initializedOwner.current === user.uid) return;
    initializedOwner.current = user.uid;
    setFullName(userProfile?.fullName ?? user.displayName ?? "");
    setDisplayName(userProfile?.displayName ?? user.displayName ?? "");
  }, [authLoading, user, userProfile]);

  const assignedUnits = useMemo(() => {
    const assigned = new Set(staff?.unitIds || []);
    return units.filter((unit) => assigned.has(unit.id));
  }, [staff, units]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !staff || !fullName.trim() || saving) return;
    const uid = user.uid;
    const membershipId = staff.membershipId;
    const current = () => owner.current.uid === uid
      && owner.current.membershipId === membershipId
      && getFirebaseAuth().currentUser?.uid === uid;
    const names = { fullName: fullName.trim(), displayName: displayName.trim() };
    const details = { title: title.trim(), department: department.trim(), phone: phone.trim(), bio: bio.trim() };
    setSaving(true); setError(""); setStatus("");
    try {
      if (!current()) throw new Error(copy.accountChanged);
      // Wait for both writes to settle before allowing retry; one failure must not
      // leave a second request running behind an enabled Save button.
      const writes = await Promise.allSettled([
        updatePersonalInfo(uid, names),
        updateOrganizationStaffProfile(details, uid),
      ]);
      const failure = writes.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      const [account, savedStaff] = await Promise.all([
        xtaraApi.get<UserProfile>("/me", { expectedUserId: uid, cache: "no-store" }),
        getOrganizationStaffProfile(uid),
      ]);
      if (!current()) return;
      if (account.uid !== uid || account.fullName !== names.fullName || account.displayName !== names.displayName
        || savedStaff.membershipId !== membershipId
        || Object.entries(details).some(([key, value]) => savedStaff.profile[key as keyof typeof details] !== value)) {
        throw new Error(copy.verifyError);
      }
      queryClient.setQueryData(["auth", "userProfile", uid], account);
      setStaff(savedStaff);
      setFullName(account.fullName ?? ""); setDisplayName(account.displayName ?? "");
      setTitle(savedStaff.profile.title); setDepartment(savedStaff.profile.department);
      setPhone(savedStaff.profile.phone); setBio(savedStaff.profile.bio);
      setStatus(copy.saved);
    } catch (reason) {
      if (current()) setError(`${reason instanceof Error ? reason.message : copy.saveError} ${copy.retryHint}`);
    } finally {
      if (current()) setSaving(false);
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
          <div><Badge variant="secondary">{copy.account}</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{copy.heading}</h1><p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{copy.description}</p></div>
          <Button type="button" variant="outline" disabled={saving} onClick={logout}><LogOut className="mr-2 h-4 w-4" />{copy.signOut}</Button>
        </div>

        {status ? <p role="status" className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><Check className="mr-2 inline h-4 w-4" />{status}</p> : null}
        {error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-primary/10 shadow-none">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" />{copy.details}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={save}>
                <fieldset disabled={saving || Boolean(switching)} className="space-y-5 disabled:opacity-70">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={copy.fullName}><Input autoComplete="name" required maxLength={200} value={fullName} onChange={(event) => { setFullName(event.target.value); setStatus(""); }} /></Field>
                    <Field label={copy.title}><Input autoComplete="organization-title" maxLength={100} value={title} onChange={(event) => { setTitle(event.target.value); setStatus(""); }} placeholder={copy.titleExample} /></Field>
                    <Field label={copy.phone}><Input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => { setPhone(event.target.value); setStatus(""); }} /></Field>
                  </div>
                  <Field label={copy.email}><Input type="email" value={user.email || ""} readOnly aria-describedby="profile-email-note" /></Field>
                  <p id="profile-email-note" className="text-sm text-muted-foreground">{copy.emailNote}</p>
                  <details className="rounded-xl border p-4" open={Boolean(department || bio) || undefined}>
                    <summary className="cursor-pointer font-medium">{copy.more}</summary>
                    <div className="mt-4 space-y-4">
                      <Field label={copy.department}><Input maxLength={100} value={department} onChange={(event) => { setDepartment(event.target.value); setStatus(""); }} placeholder={copy.departmentExample} /></Field>
                      <Field label={copy.bio}><Textarea value={bio} onChange={(event) => { setBio(event.target.value); setStatus(""); }} maxLength={600} placeholder={copy.bioExample} /></Field>
                    </div>
                  </details>
                  <div className="flex justify-end"><Button type="submit" disabled={!fullName.trim()}>{saving ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? copy.saving : copy.save}</Button></div>
                </fieldset>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-primary" />{copy.school}</CardTitle></CardHeader><CardContent><p className="font-semibold text-primary">{staff.organization.name}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{formatLabel(staff.role)}</Badge>{assignedUnits.map((unit) => <Badge key={unit.id} variant="outline">{unit.name}</Badge>)}</div>{!assignedUnits.length ? <p className="mt-3 text-sm text-muted-foreground">{staff.role === "owner" || staff.role === "admin" ? copy.allClasses : copy.noClasses}</p> : null}</CardContent></Card>

            {workspaces.length > 1 ? <Card className="border-primary/10 shadow-none"><CardHeader><CardTitle className="text-lg">{copy.schools}</CardTitle></CardHeader><CardContent className="space-y-3">{workspaces.map((workspace) => <button type="button" key={workspace.membershipId} disabled={workspace.selected || Boolean(switching) || saving} onClick={() => switchWorkspace(workspace.membershipId)} className="flex w-full items-center justify-between rounded-2xl border border-primary/10 p-4 text-left disabled:bg-muted"><span><span className="block text-sm font-medium text-primary">{workspace.organization.name}</span><span className="mt-1 block text-xs text-muted-foreground">{formatLabel(workspace.role)} · {formatLabel(workspace.effectiveStatus)}</span></span>{workspace.selected ? <Check className="h-4 w-4 text-emerald-700" /> : switching === workspace.membershipId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}</button>)}</CardContent></Card> : null}

            <Card className="border-primary/10 shadow-none"><CardContent className="p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" /><p className="text-sm leading-6 text-muted-foreground">{copy.privacy}</p></div>{staff.role === "owner" ? <p className="mt-4 text-sm text-amber-800">{copy.ownerNote}</p> : <Button type="button" variant="ghost" className="mt-3 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={leave} disabled={saving}>{copy.leave}</Button>}</CardContent></Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-foreground">{label}</span>{children}</label>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
