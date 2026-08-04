import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Compass,
  Database,
  GraduationCap,
  HeartHandshake,
  MessageCircleMore,
  RefreshCcw,
  Route,
  Scale,
  School,
  SearchCheck,
  UserRoundSearch,
  Waypoints,
} from "lucide-react";

import Breadcrumb from "@/components/Breadcrumb";
import Container from "@/components/Container";
import CTA from "@/components/CTA";
import MarketingLayout from "@/components/MarketingLayout";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/messages";
import { getLocaleFromCookie } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);
  return {
    title: messages.about.metadata.title,
    description: messages.about.metadata.description,
    keywords: messages.about.metadata.keywords,
    openGraph: {
      title: messages.about.metadata.title,
      description: messages.about.metadata.description,
      images: [messages.about.metadata.ogImage],
    },
  };
}

const missionIcons = [UserRoundSearch, MessageCircleMore, Waypoints];
const journeyIcons = [Compass, BriefcaseBusiness, Route];
const trustIcons = [Database, SearchCheck, Scale, RefreshCcw];
const peopleIcons = [GraduationCap, HeartHandshake, School];

export default async function AboutPage() {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);
  const content = messages.about;

  return (
    <MarketingLayout>
      <Container className="!px-0">
        <div className="px-5 pb-16 pt-5 sm:px-8 sm:pb-24 sm:pt-7">
          <Breadcrumb
            items={[
              { label: messages.common.breadcrumb.home, href: "/" },
              { label: messages.common.breadcrumb.about },
            ]}
          />

          <section className="relative mt-2 overflow-hidden rounded-[2rem] bg-[#f4f8fb] px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="pointer-events-none absolute -left-24 top-12 size-72 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 size-64 rounded-full bg-amber-200/50 blur-3xl" />

            <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/60">{content.hero.eyebrow}</p>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-primary sm:text-5xl lg:text-6xl">
                  {content.hero.title}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  {content.hero.subtitle}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-12 rounded-full px-7">
                    <Link href="/assessment">
                      {content.hero.primary}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-primary/15 bg-white px-7">
                    <Link href="/login">{content.hero.login}</Link>
                  </Button>
                </div>

                <ul className="mt-7 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
                  {content.hero.proofs.map((proof) => (
                    <li key={proof} className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="size-3.5" />
                      </span>
                      {proof}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative mx-auto w-full max-w-[520px]">
                <div className="absolute inset-x-8 bottom-0 top-10 rounded-[2.5rem] bg-primary/10" />
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl shadow-primary/10">
                  <Image
                    src="/images/home/hero-career-exploration.jpg"
                    alt={content.hero.imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="relative mx-auto w-full max-w-[470px]">
              <div className="absolute inset-x-6 bottom-0 top-10 rounded-[2.5rem] bg-amber-100" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-4 border-white shadow-xl shadow-amber-900/10">
                <Image
                  src="/images/home/family-career-conversation.jpg"
                  alt={content.mission.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 38vw, 90vw"
                  className="object-cover object-center"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/60">{content.mission.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">
                {content.mission.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.mission.description}</p>

              <div className="mt-8 space-y-4">
                {content.mission.principles.map((principle, index) => {
                  const Icon = missionIcons[index] ?? Compass;
                  return (
                    <div key={principle.title} className="flex gap-4 rounded-2xl border border-primary/10 bg-white p-5">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/6 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-primary">{principle.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{principle.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] bg-primary text-white">
            <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">{content.story.eyebrow}</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl">{content.story.title}</h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/75">{content.story.description}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-5">
                    <GraduationCap className="size-5 text-amber-300" />
                    <h3 className="mt-4 font-semibold">{content.story.studentTitle}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{content.story.studentDescription}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-5">
                    <HeartHandshake className="size-5 text-amber-300" />
                    <h3 className="mt-4 font-semibold">{content.story.adultTitle}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{content.story.adultDescription}</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[380px] lg:min-h-[560px]">
                <Image
                  src="/images/home/student-guidance.jpg"
                  alt={content.story.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-primary lg:via-primary/10 lg:to-transparent" />
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/60">{content.journey.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">{content.journey.title}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.journey.description}</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {content.journey.steps.map((step, index) => {
                const Icon = journeyIcons[index] ?? Compass;
                return (
                  <div key={step.step} className="rounded-3xl border border-primary/10 bg-white p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary/45">{step.step}</span>
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/6 text-primary">
                        <Icon className="size-5" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-xl font-semibold text-primary">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] bg-[#f4f8fb] px-6 py-12 sm:px-10 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/60">{content.trust.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">{content.trust.title}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.trust.description}</p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {content.trust.items.map((item, index) => {
                const Icon = trustIcons[index] ?? SearchCheck;
                return (
                  <div key={item.title} className="rounded-2xl border border-primary/10 bg-white p-5">
                    <Icon className="size-5 text-primary" />
                    <h3 className="mt-4 font-semibold text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="py-16 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/60">{content.people.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">{content.people.title}</h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
              {content.people.items.map((item, index) => {
                const Icon = peopleIcons[index] ?? GraduationCap;
                return (
                  <div key={item.title} className="rounded-3xl border border-primary/10 bg-white p-6 text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/6 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <CTA />
        </div>
      </Container>
    </MarketingLayout>
  );
}
