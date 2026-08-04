"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Loader2, ShieldCheck, Users } from "lucide-react";

import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { assessmentV2StorageKey, parseDiscoveryResult } from "@/lib/assessment-v2";
import { xtaraApi, XtaraApiError } from "@/lib/api/client";
import {
  joinOrganization,
  previewOrganizationInvitation,
  type ConsentScope,
  type OrganizationInvitationPreview,
} from "@/lib/organization";
import { clearPendingOrganizationJoin, savePendingOrganizationJoin } from "@/lib/pending-organization-join";

const scopeCopy: Record<ConsentScope, { title: string; description: string; required?: boolean }> = {
  roster_status: {
    title: "Participation and onboarding status",
    description: "Your institution can see that you joined and whether your required steps are complete.",
    required: true,
  },
  assessment_summary: {
    title: "Assessment summary",
    description: "Assigned educators can see your directions and key signals, not a ranking or a perfect-career score.",
    required: true,
  },
  direction_progress: {
    title: "Direction progress",
    description: "Assigned educators can see which direction you are exploring and your progress.",
  },
  next_actions: {
    title: "Next actions",
    description: "Assigned educators can support the actions and review points you choose in Xtara.",
  },
  educator_follow_up: {
    title: "Educator follow-up",
    description: "Assigned educators can record prompts and follow-up dates connected to your guidance.",
  },
};

export default function JoinOrganizationPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const code = decodeURIComponent(String(params.code || "")).trim().toUpperCase();
  const [preview, setPreview] = useState<OrganizationInvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assessmentReady, setAssessmentReady] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>([]);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [joining, setJoining] = useState(false);
  const hasLocalAssessment = useSyncExternalStore(
    () => () => undefined,
    () => Boolean(parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey))),
    () => false,
  );

  useEffect(() => {
    let active = true;
    previewOrganizationInvitation(code)
      .then((value) => {
        if (!active) return;
        setPreview(value);
        setSelectedScopes([]);
      })
      .catch((reason) => active && setError(friendlyError(reason)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [code]);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    let active = true;
    xtaraApi.get<{ assessment?: unknown }>("/assessment/latest")
      .then((value) => active && setAssessmentReady(Boolean(value.assessment)))
      .catch(() => active && setAssessmentReady(false));
    return () => { active = false; };
  }, [user]);

  const nextPath = `/join/${encodeURIComponent(code)}`;
  const studentAuthQuery = `saveAssessment=1&next=${encodeURIComponent(nextPath)}`;
  const educatorAuthQuery = `mode=educator&next=${encodeURIComponent(nextPath)}`;
  const requiredScopesAccepted = useMemo(
    () => ["roster_status", "assessment_summary"].every((scope) => selectedScopes.includes(scope as ConsentScope)),
    [selectedScopes],
  );

  const beginAssessment = () => {
    savePendingOrganizationJoin(code);
    router.push("/assessment");
  };

  const acceptInvitation = async () => {
    if (!preview) return;
    setJoining(true);
    setError("");
    try {
      const context = await joinOrganization({
        code,
        consentScopes: preview.role === "student" ? selectedScopes : [],
        consentVersion: preview.consentVersion,
        guardianConfirmed: preview.role === "student" ? guardianConfirmed : undefined,
      });
      clearPendingOrganizationJoin();
      router.push(context.membership.role === "student" ? "/dashboard" : "/organization");
    } catch (reason) {
      setError(friendlyError(reason));
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return <PageShell><div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></PageShell>;
  }

  if (!preview) {
    return <PageShell><EmptyState title="This invitation is not available" description={error || "Ask your teacher or institution administrator for a current invitation code."} /></PageShell>;
  }

  const isStudentInvitation = preview.role === "student";
  const authenticated = Boolean(user && !user.isAnonymous);
  const activeAssessmentReady = authenticated ? assessmentReady : false;
  const canJoin = authenticated
    && (!isStudentInvitation || (activeAssessmentReady && requiredScopesAccepted && guardianConfirmed));

  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <Badge variant="secondary" className="border border-primary/10 bg-white text-primary">Institution invitation</Badge>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Join {preview.organization.name}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Your Xtara account and assessment remain yours. This invitation gives assigned educators only the guidance information described below.
        </p>

        <Card className="mt-7 border-primary/10 shadow-none">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Building2 /></div>
                <div><h2 className="text-xl font-semibold text-primary">{preview.organization.name}</h2><p className="mt-1 text-sm text-slate-500">{formatLabel(preview.organization.kind)}</p></div>
              </div>
              <Badge variant="outline">{formatLabel(preview.role)}</Badge>
            </div>
            {preview.units.length ? <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><Users className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-sm font-medium text-primary">Class or group</p><p className="mt-1 text-sm text-slate-600">{preview.units.map((unit) => unit.name).join(", ")}</p></div></div> : null}
            <p className="mt-4 text-xs text-slate-500">Invitation expires {formatDate(preview.expiresAt)}.</p>
          </CardContent>
        </Card>

        {isStudentInvitation ? (
          <section className="mt-7 rounded-3xl border border-primary/10 bg-white p-6 sm:p-8" aria-labelledby="sharing-title">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" /><div><h2 id="sharing-title" className="text-xl font-semibold text-primary">Choose what your educators can support</h2><p className="mt-2 text-sm leading-6 text-slate-600">Required items make the school guidance experience possible. Optional items can be changed in a future sharing-controls release.</p></div></div>
            <div className="mt-6 space-y-3">
              {preview.requestedConsentScopes.map((scope) => {
                const copy = scopeCopy[scope];
                const checked = selectedScopes.includes(scope);
                return (
                  <label key={scope} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 transition-colors has-[:checked]:border-primary/30 has-[:checked]:bg-primary/[0.025]">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--primary)]" checked={checked} onChange={(event) => setSelectedScopes((current) => event.target.checked ? [...new Set([...current, scope])] : current.filter((item) => item !== scope))} />
                    <span><span className="text-sm font-medium text-primary">{copy.title}{copy.required ? " · Required" : " · Optional"}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{copy.description}</span></span>
                  </label>
                );
              })}
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--primary)]" checked={guardianConfirmed} onChange={(event) => setGuardianConfirmed(event.target.checked)} />
                <span><span className="text-sm font-medium text-amber-950">Parent or guardian permission</span><span className="mt-1 block text-sm leading-6 text-amber-900/80">I confirm that my parent or guardian has given permission for me to join this institution in Xtara.</span></span>
              </label>
            </div>
          </section>
        ) : null}

        {error ? <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <div className="mt-7 rounded-3xl bg-primary p-6 text-white sm:p-8">
          {!authenticated && !isStudentInvitation ? (
            <>
              <h2 className="text-xl font-semibold">Sign in with your educator account</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">This staff invitation is tied to the invited email address. Sign in or create an account with that address to accept it.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="secondary"><Link href={`/login?${educatorAuthQuery}`}>Educator login<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link href={`/signup?${educatorAuthQuery}`}>Create educator account</Link></Button>
              </div>
            </>
          ) : !authenticated ? (
            <>
              <h2 className="text-xl font-semibold">Use your personal Xtara account</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">{hasLocalAssessment ? "Save the assessment you completed, then return here to join." : "Complete the standard Xtara assessment before creating your membership."}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {hasLocalAssessment ? <Button asChild variant="secondary"><Link href={`/signup?${studentAuthQuery}`}>Create account and save<ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <Button type="button" variant="secondary" onClick={beginAssessment}><GraduationCap className="mr-2 h-4 w-4" />Start assessment</Button>}
                <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link href={`/login?${studentAuthQuery}`}>I already have an account</Link></Button>
              </div>
            </>
          ) : isStudentInvitation && !activeAssessmentReady ? (
            <>
              <h2 className="text-xl font-semibold">Complete your assessment first</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">The institution membership will activate only after a completed assessment is saved to your account.</p>
              <Button type="button" variant="secondary" className="mt-5" onClick={beginAssessment}><GraduationCap className="mr-2 h-4 w-4" />Continue to assessment</Button>
            </>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /><span className="text-sm font-medium">{isStudentInvitation ? "Assessment saved" : "Invitation verified"}</span></div><p className="mt-2 max-w-md text-sm leading-6 text-white/75">Review the information above before activating your membership.</p></div>
              <Button type="button" variant="secondary" disabled={!canJoin || joining} onClick={acceptInvitation}>{joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{joining ? "Joining…" : "Join institution"}</Button>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7fafc] text-foreground"><Header />{children}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <main className="mx-auto max-w-lg px-5 py-24 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-5 text-2xl font-semibold text-primary">{title}</h1><p className="mt-3 leading-7 text-slate-600">{description}</p><Button asChild className="mt-6"><Link href="/">Return to Xtara</Link></Button></main>;
}

function friendlyError(error: unknown) {
  if (error instanceof XtaraApiError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
