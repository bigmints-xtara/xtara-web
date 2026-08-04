"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LogIn, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { trackEvent } from "@/lib/analytics";

const Hero = () => {
  const { user } = useAuth();
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home.hero;
  const isLoggedIn = Boolean(user && !user.isAnonymous);
  const primaryHref = isLoggedIn ? "/dashboard" : "/assessment";

  return (
    <section id="hero" className="relative overflow-hidden bg-[#f4f8fb] px-5 py-14 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {content.eyebrow}
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-primary sm:text-5xl md:text-6xl lg:text-7xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {content.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-13 rounded-full px-7 text-base shadow-lg shadow-primary/10">
              <Link
                href={primaryHref}
                onClick={() => trackEvent({ action: "cta_click", category: "engagement", label: isLoggedIn ? "home_open_path" : "home_start_assessment" })}
              >
                {isLoggedIn ? content.primaryLoggedIn : content.primaryLoggedOut}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!isLoggedIn ? (
              <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-primary/15 bg-white px-7 text-base">
                <Link
                  href="/login"
                  onClick={() => trackEvent({ action: "login_click", category: "engagement", label: "home_hero_login" })}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {content.login}
                </Link>
              </Button>
            ) : null}
          </div>

          <ul className="mt-7 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {content.proofs.map((proof) => (
              <li key={proof} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {proof}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute inset-x-8 bottom-2 top-10 rounded-[2.75rem] bg-primary/15 shadow-2xl shadow-primary/15" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.75rem] border-4 border-white shadow-2xl shadow-primary/10">
            <Image
              src="/images/home/hero-career-exploration.jpg"
              alt={content.imageAlt}
              width={1400}
              height={1600}
              priority
              sizes="(min-width: 1024px) 44vw, 90vw"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-4 left-0 max-w-[250px] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur sm:bottom-8 sm:-left-5 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{content.resultLabel}</p>
            <p className="mt-1 text-base font-semibold text-primary sm:text-lg">{content.resultTitle}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{content.resultDescription}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
