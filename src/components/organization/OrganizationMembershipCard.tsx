"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarClock, Loader2, LogOut, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getOrganizationContext, leaveOrganization, type OrganizationContext } from "@/lib/organization";

export default function OrganizationMembershipCard() {
  const { user } = useAuth();
  const [context, setContext] = useState<OrganizationContext | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    let active = true;
    getOrganizationContext().then((value) => {
      if (active && value?.membership.role === "student") setContext(value);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [user]);

  if (!context) return null;

  const leave = async () => {
    setLeaving(true);
    setError("");
    try {
      await leaveOrganization();
      setContext(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not leave the institution.");
      setLeaving(false);
    }
  };

  return (
    <section className="site-frame" aria-labelledby="institution-membership-title">
      <Card className="gap-0 border-border bg-card py-0 shadow-none">
        <CardContent className="grid gap-x-4 gap-y-2 p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6">
          <div aria-hidden="true" className="hidden size-11 items-center justify-center rounded-2xl bg-primary/5 text-primary sm:row-span-2 sm:flex">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0 sm:col-start-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="institution-membership-title" className="font-semibold text-primary">{context.organization.name}</h2>
              <Badge variant="secondary">Student member</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Your account and assessment remain yours. Assigned educators see only the guidance information you agreed to share.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-start-3 sm:row-start-1 sm:self-start">
            <CalendarClock aria-hidden="true" className="size-4" />Institution access: {formatLabel(context.effectiveStatus)}
          </div>
          <div className="sm:col-span-2 sm:col-start-2">
          {context.accessMode === "none" ? <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />The institution can no longer access your shared guidance. Your personal Xtara journey continues normally.</div> : null}
          {confirming ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-medium text-amber-950">Leave {context.organization.name}?</p><p className="mt-1 text-sm leading-6 text-amber-900/80">This ends institutional sharing and removes you from its classes. Your Xtara account, assessment, directions, and progress stay with you.</p><div className="mt-3 flex gap-2"><Button type="button" variant="destructive" size="sm" disabled={leaving} onClick={leave}>{leaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}{leaving ? "Leaving…" : "Confirm leave"}</Button><Button type="button" variant="outline" size="sm" disabled={leaving} onClick={() => setConfirming(false)}>Keep membership</Button></div></div> : <Button type="button" variant="ghost" size="sm" className="-ms-3 text-muted-foreground" onClick={() => setConfirming(true)}><LogOut className="mr-2 h-4 w-4" />Leave institution</Button>}
          {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
