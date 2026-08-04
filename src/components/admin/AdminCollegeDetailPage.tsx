'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Building2, ExternalLink, Eye, FileText, GraduationCap, Loader2, MapPin, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminCollegeDetail } from '@/lib/admin-college-catalog';
import type { CollegeInfo } from '@/lib/firebase/college-service';
import { cn } from '@/lib/utils';

export default function AdminCollegeDetailPage({ collegeId }: { collegeId: string }) {
  const [college, setCollege] = useState<CollegeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');

  useEffect(() => {
    let active = true;
    getAdminCollegeDetail(collegeId)
      .then((result) => { if (active) setCollege({ ...result, courses: result.courses || [] }); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to load this college.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [collegeId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/20">
      <div className="shrink-0 border-b bg-background px-4 pt-4 sm:px-6">
        <Button asChild className="-ml-2" size="sm" variant="ghost"><Link href="/admin/colleges"><ArrowLeft />Back to College catalogue</Link></Button>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><h1 className="truncate text-xl font-semibold tracking-tight">{college?.name || 'College record'}</h1><Badge variant="outline"><ShieldCheck />Read only</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">{college ? [college.city, college.state, college.country].filter(Boolean).join(', ') : `Record ${collegeId}`}</p>
          </div>
        </div>
        <div aria-label="College record views" className="flex gap-1" role="tablist">
          <CollegeTab active={activeTab === 'details'} icon={FileText} label="Details" onClick={() => setActiveTab('details')} />
          <CollegeTab active={activeTab === 'preview'} disabled={!college} icon={Eye} label="Preview" onClick={() => setActiveTab('preview')} />
        </div>
      </div>

      {loading ? <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading college…</div> : error || !college ? <div className="flex flex-1 items-center justify-center p-6 text-center"><div><p className="font-medium">Unable to open college</p><p className="mt-2 text-sm text-muted-foreground">{error || 'College not found.'}</p><Button asChild className="mt-5" variant="outline"><Link href="/admin/colleges">Back to catalogue</Link></Button></div></div> : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-background" role="tabpanel">
          {activeTab === 'details' ? <CollegeDetails college={college} /> : <CollegePreview college={college} />}
        </div>
      )}
    </div>
  );
}

function CollegeDetails({ college }: { college: CollegeInfo }) {
  return <div className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <Card className="shadow-none"><CardHeader><CardTitle>Institution record</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Detail label="Record ID" value={college.id} /><Detail label="Type" value={college.type} /><Detail label="Location" value={[college.city, college.state, college.country].filter(Boolean).join(', ')} /><Detail label="Address" value={college.address} /><Detail label="University" value={college.university} /><Detail label="Major stream" value={college.majorStream} /><Detail label="Founded" value={college.yearFounded} /><Detail label="Phone" value={college.phone} />{college.website ? <Button asChild className="sm:col-span-2 sm:w-fit" variant="outline"><a href={college.website} rel="noreferrer" target="_blank">Official website<ExternalLink /></a></Button> : null}</CardContent></Card>
    <Card className="self-start shadow-none"><CardHeader><CardTitle className="flex items-center justify-between">Course offerings<Badge variant="secondary">{college.courses.length}</Badge></CardTitle></CardHeader><CardContent>{college.courses.length ? <ul className="max-h-[36rem] space-y-2 overflow-y-auto">{college.courses.map((course, index) => <li className="rounded-lg border p-3 text-sm" key={`${course.course || course.name}-${index}`}><span className="flex gap-2 font-medium"><GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" />{course.course || course.name}</span>{course.level ? <span className="mt-1 block pl-6 text-xs text-muted-foreground">{course.level}</span> : null}</li>)}</ul> : <p className="text-sm text-muted-foreground">No course offerings are available for this institution.</p>}</CardContent></Card>
  </div>;
}

function CollegePreview({ college }: { college: CollegeInfo }) {
  return <div className="mx-auto max-w-4xl p-6 sm:p-10">
    <div className="rounded-2xl border bg-gradient-to-br from-background to-primary/5 p-7 sm:p-10">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 /></div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{college.type || 'College'}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{college.name}</h2>
      <p className="mt-4 flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" />{[college.city, college.state, college.country].filter(Boolean).join(', ') || 'Location not recorded'}</p>
      {college.university ? <p className="mt-3 text-sm text-muted-foreground">Affiliated with {college.university}</p> : null}
    </div>
    <section className="mt-7"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="size-5" />Courses</h3><Badge variant="secondary">{college.courses.length}</Badge></div>{college.courses.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{college.courses.slice(0, 12).map((course, index) => <Card className="shadow-none" key={`${course.course || course.name}-${index}`}><CardContent className="p-4"><p className="font-medium">{course.course || course.name}</p>{course.level ? <p className="mt-1 text-sm text-muted-foreground">{course.level}</p> : null}</CardContent></Card>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No courses are currently listed.</p>}</section>
  </div>;
}

function CollegeTab({ active, disabled, icon: Icon, label, onClick }: { active: boolean; disabled?: boolean; icon: typeof Eye; label: string; onClick: () => void }) {
  return <button aria-selected={active} className={cn('relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium text-muted-foreground after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-45', active && 'text-foreground after:bg-primary')} disabled={disabled} onClick={onClick} role="tab" type="button"><Icon className="size-4" />{label}</button>;
}

function Detail({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-xl border p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm font-medium">{value || 'Not recorded'}</p></div>;
}
