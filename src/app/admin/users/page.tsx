'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserRoundCog } from 'lucide-react';
import AdminDataTable, { type AdminDataColumn } from '@/components/admin/AdminDataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminUsersApi, type AdminUser, type AdminUsersPage } from '@/lib/admin-users';
import { useAdminTableQuery, type AdminTableSelection } from '@/lib/admin-table';

const EMPTY: AdminUsersPage = { items: [], page: 1, pageSize: 25, total: 0, totalPages: 0, facets: [], groups: [], summaries: [] };

export default function AdminUsersPage() {
  const [query, setQuery] = useAdminTableQuery({ page: 1, pageSize: 25, search: '', filters: {}, sort: { field: 'createdAt', direction: 'desc' } });
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => { let active = true; adminUsersApi.list(query).then((data) => { if (active) { setResult(data); setError(null); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load users'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [query, reload]);
  const bulk = async (action: string, selection: AdminTableSelection) => { const response = await adminUsersApi.bulk(action, selection); setNotice(`${response.succeeded.length} succeeded${response.failed.length ? `; ${response.failed.length} failed` : ''}`); setReload((value) => value + 1); };
  const columns = useMemo<AdminDataColumn<AdminUser>[]>(() => [
    { id: 'displayName', label: 'User', sortable: true, cell: (user) => <div className="flex min-w-0 items-center gap-3"><Avatar className="size-9"><AvatarImage alt={user.displayName} src={user.photoUrl} /><AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{user.displayName}{user.isCurrentUser ? <span className="ml-2 text-xs text-muted-foreground">You</span> : null}</p><p className="truncate text-xs text-muted-foreground">{user.email || user.uid}</p></div></div> },
    { id: 'role', label: 'Role', sortable: true, cell: (user) => <Badge variant={user.role ? 'secondary' : 'outline'}>{user.roleLabel}</Badge> },
    { id: 'access', label: 'Access', sortable: true, cell: (user) => <Badge className={user.disabled ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-700'} variant={user.disabled ? 'destructive' : 'outline'}>{user.disabled ? 'Disabled' : 'Active'}</Badge> },
    { id: 'lastSignInAt', label: 'Last sign in', sortable: true, className: 'hidden lg:table-cell', cell: (user) => user.lastSignInAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.lastSignInAt)) : 'Never' },
    { id: 'actions', label: 'Actions', cell: (user) => <Button asChild size="sm" variant="outline"><Link aria-label={`Manage ${user.displayName}`} href={`/admin/users/${encodeURIComponent(user.uid)}`}><UserRoundCog />Manage</Link></Button> },
  ], []);

  return <div className="h-full overflow-y-auto bg-muted/20"><div className="mx-auto max-w-[100rem] space-y-5 p-4 sm:p-6 lg:p-8"><div><h1 className="text-2xl font-semibold tracking-tight">Users</h1><p className="mt-1 text-sm text-muted-foreground">Manage accounts, sign-in access, sessions and platform roles.</p></div>{notice ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}<AdminDataTable bulkActions={[{ value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable', destructive: true }, { value: 'revoke_sessions', label: 'Revoke sessions' }]} columns={columns} error={error} groupFields={[{ value: 'role', label: 'Role' }, { value: 'access', label: 'Access' }, { value: 'verification', label: 'Verification' }, { value: 'provider', label: 'Provider' }]} loading={loading} onBulkAction={bulk} onQueryChange={(next) => { setLoading(true); setQuery(next); }} query={query} result={result} rowId={(user) => user.uid} selectionResetKey={reload} title="Users" /></div></div>;
}
