"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { trackEvent } from "@/lib/analytics";

const featureIcons = [Users, ClipboardCheck, BarChart3, ShieldCheck];

export default function EducatorMarketingSection() {
  const { user } = useAuth();
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home.educators;
  const hasAccount = Boolean(user && !user.isAnonymous);

  return (
    <section id="educators" className="my-16 overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white sm:my-24 sm:px-10 sm:py-16 lg:px-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-200">{content.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl">{content.title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">{content.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
              <Link
                href={hasAccount ? "/organization" : "/signup?mode=educator&next=%2Forganization%2Fsignup"}
                onClick={() => trackEvent({ action: "cta_click", category: "educators", label: hasAccount ? "home_educator_workspace" : "home_educator_signup" })}
              >
                {hasAccount ? content.primaryLoggedIn : content.primary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full text-white hover:bg-white/10 hover:text-white">
              <Link href="/educators">{content.secondary}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {content.features.map((feature, index) => {
            const Icon = featureIcons[index] ?? Users;
            return (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
