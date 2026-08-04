"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Gamepad2, Play, Puzzle, Sparkles } from "lucide-react";

import DownloadAppModal from "@/components/home/DownloadAppModal";
import StorySlideshow from "@/components/home/StorySlideshow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { getMyCareerPathExperience, type MyCareerPathExperience } from "@/lib/experience-api";
import type { Story } from "@/lib/firebase/firestore-service";
import {
  buildLearnShelves,
  findRecommendedItem,
  learnCopy,
  LEARN_LIBRARY_LIMIT,
  ROOT_SHELF_LIMIT,
  type LearnItem,
  type LearnSectionId,
  type LearnShelf,
} from "./learn-content";

const sectionIcons = {
  stories: BookOpen,
  sparks: Sparkles,
  games: Gamepad2,
  challenges: Puzzle,
  reads: BookOpen,
} satisfies Record<LearnSectionId, typeof BookOpen>;

export default function LearnHub() {
  const { user } = useAuth();
  const { locale } = useTranslations();
  const text = learnCopy[locale];
  const [experience, setExperience] = useState<MyCareerPathExperience | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [downloadTitle, setDownloadTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    getMyCareerPathExperience(locale, LEARN_LIBRARY_LIMIT)
      .then((next) => {
        if (!active) return;
        setExperience(next);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) setLoadState("error");
      });
    return () => { active = false; };
  }, [locale, requestVersion, user?.uid]);

  const shelves = useMemo(
    () => experience ? buildLearnShelves(experience, text) : [],
    [experience, text],
  );
  const visibleShelves = shelves.filter((shelf) => shelf.items.length > 0);
  const continueItem = experience ? findRecommendedItem(experience, shelves) : null;

  const openItem = (item: LearnItem) => {
    if (item.story) setSelectedStory(item.story);
    else if (item.opensDownload) setDownloadTitle(item.title);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-7 pb-28 sm:py-10 xl:pb-20">
      <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-5 text-primary sm:p-8" aria-labelledby="learn-page-title">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm"><BookOpen className="h-5 w-5" /></span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary/60">{text.eyebrow}</p>
            <h1 id="learn-page-title" className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{text.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary/70 sm:text-base">{text.description}</p>
          </div>
          {loadState === "ready" && experience ? (
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                <span>{text.progress}</span>
                <span>{experience.progress.completed}/{experience.progress.total}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPercentage(experience.progress.completed, experience.progress.total)}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-primary/60">{text.progressHelp}</p>
            </div>
          ) : null}
        </div>

        {loadState === "ready" && continueItem ? (
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-primary p-4 text-primary-foreground sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15"><Play className="h-5 w-5 fill-current" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-white/65">{text.continue}</p>
              <h2 id="continue-learning-title" className="mt-1 line-clamp-2 font-semibold sm:text-lg">{continueItem.title}</h2>
            </div>
            <LearningAction item={continueItem} label={text.open} onOpen={openItem} iconOnly />
          </div>
        ) : null}
      </section>

      {loadState === "loading" ? <LearnLoading /> : null}
      {loadState === "error" ? (
        <LoadMessage
          title={text.loadError}
          description={text.emptyHelp}
          action={text.retry}
          onAction={() => {
            setLoadState("loading");
            setRequestVersion((value) => value + 1);
          }}
        />
      ) : null}

      {loadState === "ready" && visibleShelves.length ? (
        <div className="mt-9 space-y-10">
          {visibleShelves.map((shelf) => (
            <LearningShelf key={shelf.id} shelf={shelf} viewAll={text.viewAll} open={text.open} onOpen={openItem} />
          ))}
        </div>
      ) : null}

      {loadState === "ready" && !visibleShelves.length ? (
        <LoadMessage title={text.empty} description={text.emptyHelp} />
      ) : null}

      {selectedStory ? (
        <StorySlideshow
          story={selectedStory}
          isOpen
          onClose={() => setSelectedStory(null)}
          onComplete={() => setRequestVersion((value) => value + 1)}
          userId={user?.uid}
        />
      ) : null}
      <DownloadAppModal isOpen={Boolean(downloadTitle)} onClose={() => setDownloadTitle(null)} title={downloadTitle ?? ""} />
    </main>
  );
}

function LearningShelf({ shelf, viewAll, open, onOpen }: {
  shelf: LearnShelf;
  viewAll: string;
  open: string;
  onOpen: (item: LearnItem) => void;
}) {
  const Icon = sectionIcons[shelf.id];
  const items = shelf.items.slice(0, ROOT_SHELF_LIMIT);
  return (
    <section aria-labelledby={`learn-${shelf.id}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/25 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 id={`learn-${shelf.id}`} className="text-xl font-semibold text-primary sm:text-2xl">{shelf.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{shelf.description}</p>
        </div>
      </div>
      {shelf.id === "stories" ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2" data-testid="story-carousel">
          {items.map((item) => <StoryBubble key={item.id} item={item} onOpen={onOpen} />)}
          <ViewAllCard href={`/learn/${shelf.id}`} label={viewAll} compact />
        </div>
      ) : (
        <div className="mt-4 grid auto-cols-[minmax(14rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <LearningCard key={item.id} item={item} shelf={shelf} openLabel={open} onOpen={onOpen} />
          ))}
          <ViewAllCard href={`/learn/${shelf.id}`} label={viewAll} />
        </div>
      )}
    </section>
  );
}

function StoryBubble({ item, onOpen }: { item: LearnItem; onOpen: (item: LearnItem) => void }) {
  return (
    <button type="button" onClick={() => onOpen(item)} className="w-[5.25rem] shrink-0 text-center">
      <span className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full border-[3px] border-accent bg-card text-primary">
        {/* Remote editorial images are already validated by the API and may
            come from more than one configured CDN. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-6 w-6" />}
      </span>
      <span className="mt-2 line-clamp-2 text-xs font-semibold leading-4 text-foreground">{item.title}</span>
    </button>
  );
}

function LearningCard({ item, shelf, openLabel, onOpen }: {
  item: LearnItem;
  shelf: LearnShelf;
  openLabel: string;
  onOpen: (item: LearnItem) => void;
}) {
  const Icon = sectionIcons[shelf.id];
  return (
    <Card className="min-h-56 overflow-hidden border-border bg-card shadow-none">
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-sky-100 to-emerald-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Icon className="absolute bottom-4 left-4 h-8 w-8 text-primary/70" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm">{shelf.title}</span>
      </div>
      <CardContent className="flex min-h-36 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-6 text-card-foreground">{item.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{item.meta || shelf.description}</p>
        <div className="mt-auto pt-4"><LearningAction item={item} label={openLabel} onOpen={onOpen} /></div>
      </CardContent>
    </Card>
  );
}

function LearningAction({ item, label, onOpen, iconOnly = false }: {
  item: LearnItem;
  label: string;
  onOpen: (item: LearnItem) => void;
  iconOnly?: boolean;
}) {
  const content = iconOnly ? <><span className="sr-only">{label}</span><ArrowRight className="h-5 w-5" /></> : <>{label}<ArrowRight className="h-4 w-4" /></>;
  const className = iconOnly ? "h-10 w-10 rounded-full bg-white/15 p-0 text-white hover:bg-white/25" : "h-auto p-0 font-semibold text-primary";
  if (item.href) return <Button asChild variant="ghost" className={className}><Link href={item.href}>{content}</Link></Button>;
  return <Button variant="ghost" className={className} onClick={() => onOpen(item)}>{content}</Button>;
}

function ViewAllCard({ href, label, compact = false }: { href: string; label: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={compact
        ? "flex w-[5.25rem] shrink-0 flex-col items-center text-center text-xs font-semibold text-primary"
        : "flex min-h-44 min-w-40 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-card p-5 text-center text-sm font-semibold text-primary hover:border-primary/45"}
    >
      <span className={compact ? "flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-dashed border-primary/35 bg-card" : ""}>
        <ArrowRight className="h-5 w-5" />
      </span>
      <span className={compact ? "mt-2 leading-4" : "mt-3"}>{label}</span>
    </Link>
  );
}

function LearnLoading() {
  return (
    <div className="mt-8 space-y-8" aria-label="Loading learning activities">
      <div className="h-20 animate-pulse rounded-2xl bg-white/55" />
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-3"><div className="h-7 w-40 animate-pulse rounded bg-muted" /><div className="h-44 animate-pulse rounded-2xl bg-muted" /></div>
      ))}
    </div>
  );
}

function progressPercentage(completed: number, total: number) {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

function LoadMessage({ title, description, action, onAction }: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-7 text-center">
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && onAction ? <Button className="mt-5 rounded-full" onClick={onAction}>{action}</Button> : null}
    </div>
  );
}
