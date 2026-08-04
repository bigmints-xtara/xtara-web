"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, ShieldCheck } from "lucide-react";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { createOrganization, getOrganizationContext, type OrganizationContext } from "@/lib/organization";

export default function OrganizationSignupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<OrganizationContext["organization"]["kind"]>("school");
  const [academicYear, setAcademicYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?mode=educator&next=%2Forganization%2Fsignup");
      return;
    }
    getOrganizationContext().then((context) => {
      if (context) router.replace(context.membership.role === "student" ? "/dashboard" : "/organization");
    }).catch(() => undefined);
  }, [authLoading, router, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createOrganization({ name, kind, academicYear: academicYear || undefined });
      router.push("/organization");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the institution workspace.");
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-[#f7fafc] text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Building2 /></div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Create your institution workspace</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">Set up the school or educational institution that will organize classes and support learners in Xtara.</p>

        <Card className="mt-8 border-primary/10 shadow-none">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-5" onSubmit={submit}>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Institution name</span><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required placeholder="Example Public School" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Institution type</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="school">School</option><option value="college">College</option><option value="university">University</option><option value="educational_institution">Educational institution</option></select></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Academic year <span className="font-normal text-slate-400">(optional)</span></span><Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} maxLength={40} placeholder="2026–27" /></label>
              <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Xtara creates a time-limited trial. Learners keep their personal accounts and data if institution access later ends.</span></div>
              {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" disabled={submitting || !name.trim()}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{submitting ? "Creating…" : "Create workspace"}</Button><Button asChild type="button" variant="outline"><Link href="/dashboard">Return to learner dashboard</Link></Button></div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function LoadingPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7fafc]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}
