'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck, Trash2, UserPlus, UsersRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XtaraApiError } from '@/lib/api/client';
import { adminMembersApi, type AdminMember, type AdminRole } from '@/lib/admin-members';

const ROLE_COPY: Record<AdminRole, { label: string; description: string }> = {
  super_admin: { label: 'Super admin', description: 'Full platform access, including administrators and roles.' },
  admin: { label: 'Administrator', description: 'Manage providers and all content, including publication and archives.' },
  editor: { label: 'Content editor', description: 'Create and edit drafts, submit reviews, and use the assistant.' },
};

export default function AdminAccessSettings() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminRole>>({});
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('editor');
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    adminMembersApi.list()
      .then((result) => {
        setMembers(result.members);
        setRoleDrafts(Object.fromEntries(result.members.map((member) => [member.uid, member.role])));
      })
      .catch((loadError) => {
        if (loadError instanceof XtaraApiError && loadError.status === 403) setRestricted(true);
        else setError(loadError instanceof Error ? loadError.message : 'Unable to load administrators');
      })
      .finally(() => setLoading(false));
  }, []);

  const roleCounts = useMemo(() => members.reduce((counts, member) => ({
    ...counts,
    [member.role]: (counts[member.role] || 0) + 1,
  }), {} as Partial<Record<AdminRole, number>>), [members]);

  const addMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || workingId) return;
    setWorkingId('new');
    setError(null);
    setNotice(null);
    try {
      const result = await adminMembersApi.add({ email: email.trim(), role: newRole });
      setMembers((current) => [...current.filter((member) => member.uid !== result.member.uid), result.member]);
      setRoleDrafts((current) => ({ ...current, [result.member.uid]: result.member.role }));
      setEmail('');
      setNotice(`${result.member.email} now has ${result.member.roleLabel.toLowerCase()} access.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add administrator');
    } finally {
      setWorkingId(null);
    }
  };

  const updateRole = async (member: AdminMember) => {
    const role = roleDrafts[member.uid] || member.role;
    if (role === member.role || workingId) return;
    setWorkingId(member.uid);
    setError(null);
    setNotice(null);
    try {
      const result = await adminMembersApi.update(member, role);
      setMembers((current) => current.map((item) => item.uid === member.uid ? result.member : item));
      setRoleDrafts((current) => ({ ...current, [member.uid]: result.member.role }));
      setNotice(`${result.member.email} is now ${result.member.roleLabel.toLowerCase()}.`);
    } catch (saveError) {
      setRoleDrafts((current) => ({ ...current, [member.uid]: member.role }));
      setError(saveError instanceof Error ? saveError.message : 'Unable to update role');
    } finally {
      setWorkingId(null);
    }
  };

  const removeMember = async (member: AdminMember) => {
    if (member.isCurrentUser || workingId) return;
    if (!confirm(`Remove admin access from “${member.email}”? Their Xtara account will remain active.`)) return;
    setWorkingId(member.uid);
    setError(null);
    setNotice(null);
    try {
      await adminMembersApi.remove(member.uid);
      setMembers((current) => current.filter((item) => item.uid !== member.uid));
      setNotice(`Removed admin access from ${member.email}.`);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove administrator');
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return <Card><CardContent className="flex items-center p-6 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Loading access controls…</CardContent></Card>;
  }

  if (restricted) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Access & roles</CardTitle><CardDescription>Only super admins can add administrators or change editor access.</CardDescription></CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-4 border-b sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle className="flex items-center gap-2"><UsersRound className="size-5" />Access & roles</CardTitle><CardDescription className="mt-1 max-w-2xl">Add an existing Xtara account, assign the minimum required role, and change or remove access at any time.</CardDescription></div>
        <div className="flex flex-wrap gap-2">
          {(['super_admin', 'admin', 'editor'] as const).map((role) => <Badge key={role} variant="outline">{roleCounts[role] || 0} {ROLE_COPY[role].label}</Badge>)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <form className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_13rem_auto] md:items-end" onSubmit={addMember}>
          <label className="space-y-2 text-sm font-medium">Existing Xtara account email<Input aria-label="Admin email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} /></label>
          <label className="space-y-2 text-sm font-medium">Role<Select onValueChange={(value) => setNewRole(value as AdminRole)} value={newRole}><SelectTrigger aria-label="New admin role"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE_COPY).map(([role, copy]) => <SelectItem key={role} value={role}>{copy.label}</SelectItem>)}</SelectContent></Select></label>
          <Button disabled={workingId !== null || !email.trim()} type="submit">{workingId === 'new' ? <Loader2 className="animate-spin" /> : <UserPlus />}Add access</Button>
          <p className="text-xs leading-5 text-muted-foreground md:col-span-3">The person must already have an Xtara account. New accounts are not created from the admin panel.</p>
        </form>

        {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
        {notice ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{notice}</p> : null}

        <div className="divide-y rounded-xl border">
          {members.map((member) => {
            const selectedRole = roleDrafts[member.uid] || member.role;
            const working = workingId === member.uid;
            return (
              <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_15rem_auto] lg:items-center" key={member.uid}>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10"><AvatarImage alt={member.displayName} src={member.photoUrl} /><AvatarFallback>{member.displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{member.displayName}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p><p className="mt-1 text-xs text-muted-foreground">{ROLE_COPY[member.role].description}</p></div>
                  {member.isCurrentUser ? <Badge className="shrink-0" variant="secondary">You</Badge> : null}
                </div>
                <Select disabled={member.isCurrentUser || working} onValueChange={(value) => setRoleDrafts((current) => ({ ...current, [member.uid]: value as AdminRole }))} value={selectedRole}>
                  <SelectTrigger aria-label={`Role for ${member.email}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROLE_COPY).map(([role, copy]) => <SelectItem key={role} value={role}>{copy.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex items-center justify-end gap-2">
                  <Button disabled={member.isCurrentUser || working || selectedRole === member.role} onClick={() => updateRole(member)} size="sm" type="button" variant="outline">{working ? <Loader2 className="animate-spin" /> : null}Update role</Button>
                  <Button aria-label={`Remove ${member.email}`} disabled={member.isCurrentUser || working} onClick={() => removeMember(member)} size="icon-sm" type="button" variant="ghost"><Trash2 /></Button>
                </div>
              </div>
            );
          })}
          {!members.length ? <div className="p-8 text-center text-sm text-muted-foreground">No administrators found.</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
