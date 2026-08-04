"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Gamepad2, Puzzle, Sparkles } from "lucide-react";

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
  learnCopy,
  LEARN_LIBRARY_LIMIT,
  type LearnItem,
  type LearnSectionId,
} from "./learn-content";

const sectionIds = new Set<LearnSectionId>(["stories", "sparks", "games", "challenges", "reads"]);
const icons = { stories: BookOpen, sparks: Sparkles, games: Gamepad2, challenges: Puzzle, reads: BookOpen } satisfies Record<LearnSectionId, typeof BookOpen>;

export default function LearnLibrary() {
  const params = useParams<{ section: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useTranslations();
  const text = learnCopy[locale];
  const section = sectionIds.has(params.section as LearnSectionId) ? params.section as LearnSectionId : null;
  const [experience, setExperience] = useState<MyCareerPathExperience | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [downloadTitle, setDownloadTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!section) {
      router.replace("/learn");
      return;
    }
    if (!user?.uid) return;
    let active = true;
    getMyCareerPathExperience(locale, LEARN_LIBRARY_LIMIT)
      .then((next) => {
        if (!active) return;
        setExperience(next);
        setLoadState("ready");
      })
      .catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, [locale, requestVersion, router, section, user?.uid]);

  const shelf = useMemo(
    () => experience && section ? buildLearnShelves(experience, text).find((candidate) => candidate.id === section) : null,
    [experience, section, text],
  );
  const Icon = section ? icons[section] : BookOpen;
  const fallbackHeading = section ? {
    stories: [text.stories, text.storiesHelp],
    sparks: [text.sparks, text.sparksHelp],
    games: [text.games, text.gamesHelp],
    challenges: [text.challenges, text.challengesHelp],
    reads: [text.reads, text.readsHelp],
  }[section] : ["", ""];

  const openItem = (item: LearnItem) => {
    if (item.story) setSelectedStory(item.story);
    else if (item.opensDownload) setDownloadTitle(item.title);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 pb-24 sm:py-10">
      <Button asChild variant="ghost" className="-ml-3 w-fit rounded-full text-muted-foreground">
        <Link href="/learn"><ArrowLeft className="h-4 w-4" />{text.back}</Link>
      </Button>
      <div className="mt-5 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-primary"><Icon className="h-6 w-6" /></span>
        <div><h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">{shelf?.title ?? fallbackHeading[0]}</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">{shelf?.description ?? fallbackHeading[1]}</p></div>
      </div>

      {loadState === "loading" ? <LibraryLoading /> : null}
      {loadState === "error" ? (
        <LibraryMessage title={text.loadError} description={text.emptyHelp} action={text.retry} onAction={() => { setLoadState("loading"); setRequestVersion((value) => value + 1); }} />
      ) : null}
      {loadState === "ready" && shelf?.items.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shelf.items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border bg-card shadow-none">
              <div className="relative h-36 overflow-hidden bg-gradient-to-br from-sky-100 to-emerald-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Icon className="absolute bottom-5 left-5 h-9 w-9 text-primary/70" />}
              </div>
              <CardContent className="flex h-full min-h-44 flex-col p-5">
                <h2 className="line-clamp-2 text-lg font-semibold text-card-foreground">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{item.meta || shelf.description}</p>
                <div className="mt-auto pt-6">
                  {item.href ? (
                    <Button asChild variant="link" className="h-auto p-0 font-semibold"><Link href={item.href}>{text.open}<ArrowRight className="h-4 w-4" /></Link></Button>
                  ) : (
                    <Button variant="link" className="h-auto p-0 font-semibold" onClick={() => openItem(item)}>{text.open}<ArrowRight className="h-4 w-4" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
      {loadState === "ready" && !shelf?.items.length ? <LibraryMessage title={text.empty} description={text.emptyHelp} /> : null}

      {selectedStory ? <StorySlideshow story={selectedStory} isOpen onClose={() => setSelectedStory(null)} onComplete={() => setRequestVersion((value) => value + 1)} userId={user?.uid} /> : null}
      <DownloadAppModal isOpen={Boolean(downloadTitle)} onClose={() => setDownloadTitle(null)} title={downloadTitle ?? ""} />
    </main>
  );
}

function LibraryLoading() {
  return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading learning activities">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-muted" />)}</div>;
}

function LibraryMessage({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center"><h2 className="text-xl font-semibold text-card-foreground">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p>{action && onAction ? <Button className="mt-5 rounded-full" onClick={onAction}>{action}</Button> : null}</div>;
}
