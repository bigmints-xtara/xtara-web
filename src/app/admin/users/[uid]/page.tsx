'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Save, ShieldCheck, UserRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminUsersApi, type AdminUser } from '@/lib/admin-users';
import type { AdminRole } from '@/lib/admin-access';
import { cn } from '@/lib/utils';

export default function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [role, setRole] = useState<AdminRole | 'user'>('user');
  const [tab, setTab] = useState<'overview' | 'access'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const applyUser = (next: AdminUser) => {
    setUser(next);
    setDisplayName(next.displayName);
    setDisabled(next.disabled);
    setRole(next.role || 'user');
  };

  useEffect(() => {
    let cancelled = false;
    adminUsersApi.get(uid)
      .then(({ user: loaded }) => { if (!cancelled) applyUser(loaded); })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load this user'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminUsersApi.update(user.uid, { displayName, disabled, adminRole: role === 'user' ? null : role });
      const readback = await adminUsersApi.get(user.uid);
      applyUser(readback.user);
      setMessage('User settings saved and verified.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save user settings');
    } finally {
      setSaving(false);
    }
  };

  const revokeSessions = async () => {
    if (!user || !confirm(`Sign ${user.displayName} out of all devices?`)) return;
    setRevoking(true);
    setMessage('');
    setError('');
    try {
      await adminUsersApi.revokeSessions(user.uid);
      setMessage('All refresh sessions were revoked. Existing clients must sign in again.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to revoke sessions');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Loading user…</div>;
  if (!user) return <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="font-medium">Unable to open user</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild className="mt-5" variant="outline"><Link href="/admin/users">Back to users</Link></Button></div></div>;

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/20">
      <div className="shrink-0 border-b bg-background px-4 pt-4 sm:px-6">
        <Button asChild className="-ml-2" size="sm" variant="ghost"><Link href="/admin/users"><ArrowLeft />Back to users</Link></Button>
        <div className="mt-3 flex items-center gap-3 pb-4">
          <Avatar className="size-11"><AvatarImage alt={user.displayName} src={user.photoUrl} /><AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-xl font-semibold">{user.displayName}</h1><Badge variant={user.disabled ? 'destructive' : 'outline'}>{user.disabled ? 'Disabled' : 'Active'}</Badge><Badge variant="secondary">{user.roleLabel}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{user.email || user.uid}</p></div>
        </div>
        <div aria-label="User management views" className="flex gap-1" role="tablist">
          <TabButton active={tab === 'overview'} icon={UserRound} label="Overview" onClick={() => setTab('overview')} />
          <TabButton active={tab === 'access'} icon={ShieldCheck} label="Access" onClick={() => setTab('access')} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          {message ? <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{message}</div> : null}

          {tab === 'overview' ? (
            <div className="grid gap-5 md:grid-cols-2" role="tabpanel">
              <Card><CardHeader><CardTitle>Account</CardTitle><CardDescription>Firebase identity and sign-in history.</CardDescription></CardHeader><CardContent><Details rows={[
                ['Email', user.email || 'Not provided'], ['Email verified', user.emailVerified ? 'Yes' : 'No'], ['Phone', user.phoneNumber || 'Not provided'], ['Providers', user.providers.join(', ') || 'Anonymous'], ['Created', formatDate(user.createdAt)], ['Last sign in', formatDate(user.lastSignInAt, 'Never')], ['User ID', user.uid],
              ]} /></CardContent></Card>
              <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Career-guidance context saved by this user.</CardDescription></CardHeader><CardContent><Details rows={[
                ['Full name', user.profile.fullName || user.displayName], ['Grade', user.profile.currentGrade || user.profile.gradeStage || 'Not provided'], ['Education board', user.profile.educationBoard || 'Not provided'], ['Stream', user.profile.currentStream || 'Not provided'], ['Location', [user.profile.city, user.profile.state, user.profile.country].filter(Boolean).join(', ') || 'Not provided'], ['Profile updated', formatDate(user.profileUpdatedAt, 'Not recorded')],
              ]} /></CardContent></Card>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={save} role="tabpanel">
              <Card><CardHeader><CardTitle>Identity and role</CardTitle><CardDescription>Changes are server-authorized and written to the admin audit log.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">Display name<Input disabled={user.isCurrentUser} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} /></label>
                <label className="space-y-2 text-sm font-medium">Platform role<Select disabled={user.isCurrentUser} onValueChange={(value) => setRole(value as AdminRole | 'user')} value={role}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="editor">Content editor</SelectItem><SelectItem value="admin">Administrator</SelectItem><SelectItem value="super_admin">Super admin</SelectItem></SelectContent></Select></label>
                <label className="flex items-start gap-3 rounded-lg border p-4 sm:col-span-2"><input aria-label="Disable sign-in" checked={disabled} className="mt-0.5 size-4 accent-[var(--destructive)]" disabled={user.isCurrentUser} onChange={(event) => setDisabled(event.target.checked)} type="checkbox" /><span><span className="block text-sm font-medium">Disable sign-in</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Blocks new sign-ins and revokes refresh sessions when saved.</span></span></label>
                {user.isCurrentUser ? <p className="text-xs text-muted-foreground sm:col-span-2">Your own super-admin role and sign-in access are protected. Manage another account to change these settings.</p> : null}
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Sessions</CardTitle><CardDescription>Force this user to authenticate again on every device.</CardDescription></CardHeader><CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><p className="max-w-xl text-sm text-muted-foreground">Revoking sessions does not delete the account or its data.</p><Button disabled={revoking || user.isCurrentUser} onClick={revokeSessions} type="button" variant="outline">{revoking ? <Loader2 className="animate-spin" /> : <KeyRound />}Revoke sessions</Button></CardContent></Card>
              <div className="flex justify-end"><Button disabled={saving || user.isCurrentUser || !displayName.trim()} type="submit">{saving ? <Loader2 className="animate-spin" /> : <Save />}Save changes</Button></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof UserRound; label: string; onClick: () => void }) {
  return <button aria-selected={active} className={cn('relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active && 'text-foreground after:bg-primary')} onClick={onClick} role="tab" type="button"><Icon className="size-4" />{label}</button>;
}

function Details({ rows }: { rows: Array<[string, string]> }) {
  return <dl className="space-y-4">{rows.map(([label, value]) => <div className="grid gap-1 sm:grid-cols-[9rem_1fr]" key={label}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="break-words text-sm">{value}</dd></div>)}</dl>;
}

function formatDate(value?: string, fallback = 'Not recorded') {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
