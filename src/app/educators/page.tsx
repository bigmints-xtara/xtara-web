"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  MessageCircleMore,
  ShieldCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { trackEvent } from "@/lib/analytics";

const featureIcons = [Users, ClipboardCheck, BarChart3, ShieldCheck];
const stepIcons = [Building2, GraduationCap, MessageCircleMore];

export default function EducatorsPage() {
  const { user } = useAuth();
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home.educators;
  const hasAccount = Boolean(user && !user.isAnonymous);
  const primaryHref = hasAccount ? "/organization" : "/signup?mode=educator&next=%2Forganization%2Fsignup";

  return (
    <div className="min-h-screen bg-[#f7fafc] text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden px-5 py-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0"><div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" /><div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" /></div>
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
            <div>
              <Badge variant="secondary" className="border border-primary/10 bg-white text-primary">{content.eyebrow}</Badge>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl md:text-6xl">{content.pageTitle}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{content.pageDescription}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href={primaryHref} onClick={() => trackEvent({ action: "cta_click", category: "educators", label: hasAccount ? "educator_page_workspace" : "educator_page_signup" })}>{hasAccount ? content.primaryLoggedIn : content.primary}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                {!hasAccount ? <Button asChild size="lg" variant="outline" className="rounded-full border-primary/15 bg-white px-7"><Link href="/login?mode=educator&next=%2Forganization">{content.login}</Link></Button> : null}
              </div>
              <ul className="mt-7 space-y-3 text-sm text-slate-600">{content.proofs.map((proof) => <li key={proof} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /></span>{proof}</li>)}</ul>
            </div>

            <DashboardPreview content={content.preview} />
          </div>
        </section>

        <section className="bg-white px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.capabilitiesEyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">{content.capabilitiesTitle}</h2><p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">{content.capabilitiesDescription}</p></div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{content.features.map((feature, index) => { const Icon = featureIcons[index] ?? Users; return <Card key={feature.title} className="border-primary/10 shadow-none"><CardContent className="p-6"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-semibold text-primary">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p></CardContent></Card>; })}</div>
          </div>
        </section>

        <section className="px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.stepsEyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">{content.stepsTitle}</h2><p className="mt-5 leading-7 text-slate-600">{content.stepsDescription}</p></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">{content.steps.map((step, index) => { const Icon = stepIcons[index] ?? Building2; return <div key={step.title} className="rounded-3xl border border-primary/10 bg-white p-6"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-primary/40">0{index + 1}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary"><Icon className="h-5 w-5" /></span></div><h3 className="mt-7 text-xl font-semibold text-primary">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p></div>; })}</div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:pb-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white sm:px-10 sm:py-16 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14">
            <div className="max-w-3xl"><ShieldCheck className="h-7 w-7 text-amber-300" /><h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{content.finalTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-white/70">{content.finalDescription}</p></div>
            <Button asChild size="lg" variant="secondary" className="mt-8 shrink-0 rounded-full px-7 lg:mt-0"><Link href={primaryHref}>{hasAccount ? content.primaryLoggedIn : content.primary}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DashboardPreview({ content }: { content: { label: string; title: string; classLabel: string; learnersLabel: string; assessedLabel: string; followUpLabel: string; learnerName: string; learnerStatus: string } }) {
  return (
    <div className="rounded-[2rem] border border-primary/10 bg-white p-5 shadow-2xl shadow-primary/10 sm:p-7">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/45">{content.label}</p><h2 className="mt-1 text-xl font-semibold text-primary">{content.title}</h2></div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white"><Building2 className="h-5 w-5" /></span></div>
      <div className="mt-6 grid grid-cols-3 gap-3"><PreviewMetric icon={Users} value="32" label={content.learnersLabel} /><PreviewMetric icon={ClipboardCheck} value="27" label={content.assessedLabel} /><PreviewMetric icon={UserRoundCheck} value="5" label={content.followUpLabel} /></div>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium text-slate-500">{content.classLabel}</p><p className="mt-1 font-semibold text-primary">{content.learnerName}</p></div><Badge variant="secondary">{content.learnerStatus}</Badge></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-3/4 rounded-full bg-emerald-500" /></div></div>
      <div className="mt-4 flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{content.label}</div>
    </div>
  );
}

function PreviewMetric({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return <div className="rounded-2xl border border-primary/10 p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-xl font-semibold text-primary">{value}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{label}</p></div>;
}
