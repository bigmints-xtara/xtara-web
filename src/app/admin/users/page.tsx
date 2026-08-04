'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, Search, UserRoundCog, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminUsersApi, type AdminUser, type AdminUsersPage } from '@/lib/admin-users';

export default function AdminUsersPage() {
  const [result, setResult] = useState<AdminUsersPage>({ users: [], pageSize: 25 });
  const [pageSize, setPageSize] = useState(25);
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [previousTokens, setPreviousTokens] = useState<Array<string | undefined>>([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminUsersApi.list({ pageSize, pageToken, query: query || undefined })
      .then((page) => { if (!cancelled) setResult(page); })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Unable to load users'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pageSize, pageToken, query, refreshKey]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setPreviousTokens([]);
    setPageToken(undefined);
    setQuery(queryInput.trim());
    setRefreshKey((current) => current + 1);
  };

  const clearSearch = () => {
    setLoading(true);
    setError('');
    setQueryInput('');
    setQuery('');
    setPreviousTokens([]);
    setPageToken(undefined);
    setRefreshKey((current) => current + 1);
  };

  const nextPage = () => {
    if (!result.nextPageToken) return;
    setLoading(true);
    setError('');
    setPreviousTokens((current) => [...current, pageToken]);
    setPageToken(result.nextPageToken);
  };

  const previousPage = () => {
    if (!previousTokens.length) return;
    setLoading(true);
    setError('');
    const nextHistory = previousTokens.slice(0, -1);
    setPageToken(previousTokens[previousTokens.length - 1]);
    setPreviousTokens(nextHistory);
  };

  return (
    <div className="h-full overflow-y-auto bg-muted/20">
      <div className="mx-auto max-w-[96rem] space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage Xtara accounts, sign-in access, sessions, and platform roles.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" />Page {previousTokens.length + 1}</div>
        </div>

        <div className="rounded-xl border bg-background shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-end lg:justify-between">
            <form className="flex w-full max-w-xl flex-col gap-2 sm:flex-row" onSubmit={search}>
              <label className="flex-1 space-y-1.5 text-xs font-medium text-muted-foreground">
                Exact email or user ID
                <Input onChange={(event) => setQueryInput(event.target.value)} placeholder="user@example.com or Firebase UID" value={queryInput} />
              </label>
              <div className="flex items-end gap-2">
                <Button type="submit"><Search />Search</Button>
                {query ? <Button onClick={clearSearch} type="button" variant="outline">Clear</Button> : null}
              </div>
            </form>
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
              Rows per page
              <Select value={String(pageSize)} onValueChange={(value) => { setLoading(true); setError(''); setPageSize(Number(value)); setPageToken(undefined); setPreviousTokens([]); }}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent>
              </Select>
            </label>
          </div>

          {error ? <div className="border-b bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[52%] sm:w-[38%]">User</TableHead>
                <TableHead className="w-[24%] sm:w-[17%]">Role</TableHead>
                <TableHead className="hidden w-[14%] md:table-cell">Status</TableHead>
                <TableHead className="hidden w-[18%] lg:table-cell">Last sign in</TableHead>
                <TableHead className="w-[24%] text-right sm:w-[13%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell className="h-40 text-center text-muted-foreground" colSpan={5}><Loader2 className="mr-2 inline size-4 animate-spin" />Loading users…</TableCell></TableRow>
              ) : result.users.length ? result.users.map((user) => <UserRow key={user.uid} user={user} />) : (
                <TableRow><TableCell className="h-40 text-center text-muted-foreground" colSpan={5}>{query ? 'No account matched that exact email or user ID.' : 'No user accounts found.'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">{result.users.length} account{result.users.length === 1 ? '' : 's'} on this page</p>
            <div className="flex gap-2">
              <Button aria-label="Previous users page" disabled={loading || !previousTokens.length || Boolean(query)} onClick={previousPage} size="sm" variant="outline"><ChevronLeft />Previous</Button>
              <Button aria-label="Next users page" disabled={loading || !result.nextPageToken || Boolean(query)} onClick={nextPage} size="sm" variant="outline">Next<ChevronRight /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 shrink-0"><AvatarImage alt={user.displayName} src={user.photoUrl} /><AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-0"><p className="truncate font-medium">{user.displayName}{user.isCurrentUser ? <span className="ml-2 text-xs text-muted-foreground">You</span> : null}</p><p className="truncate text-xs text-muted-foreground">{user.email || user.uid}</p></div>
        </div>
      </TableCell>
      <TableCell><Badge variant={user.role ? 'secondary' : 'outline'}>{user.roleLabel}</Badge></TableCell>
      <TableCell className="hidden md:table-cell"><Badge className={user.disabled ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-700'} variant={user.disabled ? 'destructive' : 'outline'}>{user.disabled ? 'Disabled' : 'Active'}</Badge></TableCell>
      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(user.lastSignInAt, 'Never')}</TableCell>
      <TableCell className="text-right"><Button asChild className="px-2 sm:px-3" size="sm" variant="outline"><Link aria-label={`Manage ${user.displayName}`} href={`/admin/users/${encodeURIComponent(user.uid)}`}><UserRoundCog /><span className="sm:hidden">Edit</span><span className="hidden sm:inline">Manage</span></Link></Button></TableCell>
    </TableRow>
  );
}

function formatDate(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
