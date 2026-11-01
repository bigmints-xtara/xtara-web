"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Compass,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  MessageCircleMore,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/i18n/language-provider";
import { trackEvent } from "@/lib/analytics";
import { MVP_NAVIGATION_ENABLED } from "@/lib/mvp-navigation";

const outcomeIcons = [Compass, Sparkles, Route];
const momentumIcons = [BookOpenCheck, Gamepad2, GraduationCap, MessageCircleMore];
const trustIcons = [ShieldCheck, CheckCircle2, RefreshCcw, Users];

const Benefits = () => {
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home;

  return (
    <div>
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.outcomes.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">
            {content.outcomes.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.outcomes.description}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {content.outcomes.items.map((item, index) => {
            const Icon = outcomeIcons[index] ?? Compass;
            return (
              <Card key={item.step} className="group overflow-hidden border-primary/10 py-0 shadow-none transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary/45">{item.step}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/5 text-primary transition group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-[#fff8e9] px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-[460px]">
            <div className="absolute inset-x-6 bottom-0 top-12 rounded-[2.5rem] bg-amber-200/70" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-xl shadow-amber-900/10">
              <Image
                src="/images/home/family-career-conversation.jpg"
                alt={content.conversation.imageAlt}
                width={1400}
                height={1500}
                sizes="(min-width: 1024px) 38vw, 90vw"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.conversation.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">
              {content.conversation.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">{content.conversation.description}</p>

            <div className="mt-8 space-y-4">
              {[
                { label: content.conversation.studentLabel, value: content.conversation.studentValue, icon: Sparkles },
                { label: content.conversation.parentLabel, value: content.conversation.parentValue, icon: HeartHandshake },
                { label: content.conversation.togetherLabel, value: content.conversation.togetherValue, icon: MessageCircleMore },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-4 rounded-2xl bg-white/80 p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/55">{label}</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-primary">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="mt-8 rounded-full px-7">
              <Link
                href="/assessment"
                onClick={() => trackEvent({ action: "cta_click", category: "engagement", label: "home_conversation_assessment" })}
              >
                {content.conversation.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {!MVP_NAVIGATION_ENABLED && (
      <section className="py-16 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.momentum.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">
              {content.momentum.title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.momentum.description}</p>

            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {content.momentum.items.map((item, index) => {
                const Icon = momentumIcons[index] ?? Sparkles;
                return (
                  <div key={item.title} className="rounded-2xl border border-primary/10 bg-white p-5">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-4 font-semibold text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="absolute inset-x-6 bottom-6 top-8 rounded-[2.5rem] bg-sky-200/70" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-xl shadow-primary/10">
              <Image
                src="/images/home/student-guidance.jpg"
                alt={content.momentum.imageAlt}
                width={1400}
                height={1500}
                sizes="(min-width: 1024px) 38vw, 90vw"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-200">{content.trust.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl">{content.trust.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70">{content.trust.description}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {content.trust.items.map((item, index) => {
            const Icon = trustIcons[index] ?? ShieldCheck;
            return (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="h-5 w-5 text-amber-300" />
                <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Benefits;
