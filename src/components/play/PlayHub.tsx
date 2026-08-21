"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Gamepad2, Loader2, Trophy, UsersRound } from "lucide-react";

import DownloadAppModal from "@/components/home/DownloadAppModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import {
  buildGameShelf,
  LEARN_LIBRARY_LIMIT,
  type LearnItem,
} from "@/components/learn/learn-content";
import {
  getMyCareerPathExperience,
  type MyCareerPathExperience,
} from "@/lib/experience-api";

const playCopy = {
  en: {
    eyebrow: "My Career Path",
    title: "Play",
    description: "Practise useful skills through games. Tournaments and rankings appear here when they are active.",
    games: "Games",
    gamesHelp: "Choose a game and practise while you play.",
    open: "Play",
    loading: "Loading games",
    loadError: "We could not load games right now.",
    retry: "Try again",
    gamesEmpty: "No games are available right now",
    gamesEmptyHelp: "New games will appear here when they are ready.",
    tournaments: "Tournaments",
    tournamentsEmpty: "No tournament is open right now",
    tournamentsHelp: "When a tournament opens, you will see its dates and rules here.",
    leaderboard: "Leaderboard",
    leaderboardEmpty: "The leaderboard is waiting for a tournament",
    leaderboardHelp: "Rankings will appear after a tournament begins.",
  },
  ml: {
    eyebrow: "എന്റെ കരിയർ വഴി",
    title: "കളിക്കാം",
    description: "ഗെയിമുകളിലൂടെ കഴിവുകൾ പരിശീലിക്കൂ. ടൂർണമെന്റുകളും റാങ്കിങ്ങും സജീവമാകുമ്പോൾ ഇവിടെ കാണാം.",
    games: "ഗെയിമുകൾ",
    gamesHelp: "ഒരു ഗെയിം തിരഞ്ഞെടുത്ത് കളിച്ചുകൊണ്ട് പരിശീലിക്കൂ.",
    open: "കളിക്കൂ",
    loading: "ഗെയിമുകൾ എടുക്കുന്നു",
    loadError: "ഇപ്പോൾ ഗെയിമുകൾ ലഭിച്ചില്ല.",
    retry: "വീണ്ടും ശ്രമിക്കൂ",
    gamesEmpty: "ഇപ്പോൾ കളിക്കാൻ ഗെയിമുകളൊന്നുമില്ല",
    gamesEmptyHelp: "പുതിയ ഗെയിമുകൾ തയ്യാറാകുമ്പോൾ ഇവിടെ കാണാം.",
    tournaments: "ടൂർണമെന്റുകൾ",
    tournamentsEmpty: "ഇപ്പോൾ ടൂർണമെന്റുകളൊന്നും തുറന്നിട്ടില്ല",
    tournamentsHelp: "ടൂർണമെന്റ് തുടങ്ങുമ്പോൾ തീയതിയും നിയമങ്ങളും ഇവിടെ കാണാം.",
    leaderboard: "ലീഡർബോർഡ്",
    leaderboardEmpty: "ടൂർണമെന്റ് തുടങ്ങുമ്പോൾ ലീഡർബോർഡ് കാണാം",
    leaderboardHelp: "ടൂർണമെന്റ് തുടങ്ങിയ ശേഷം റാങ്കിങ് ഇവിടെ വരും.",
  },
  hi: {
    eyebrow: "मेरा करियर पथ",
    title: "खेलें",
    description: "गेम के साथ उपयोगी कौशल का अभ्यास करें। टूर्नामेंट और रैंकिंग सक्रिय होने पर यहाँ दिखेंगे।",
    games: "गेम्स",
    gamesHelp: "कोई गेम चुनें और खेलते हुए अभ्यास करें।",
    open: "खेलें",
    loading: "गेम लोड हो रहे हैं",
    loadError: "अभी गेम लोड नहीं हो पाए।",
    retry: "फिर कोशिश करें",
    gamesEmpty: "अभी कोई गेम उपलब्ध नहीं है",
    gamesEmptyHelp: "नए गेम तैयार होने पर यहाँ दिखेंगे।",
    tournaments: "टूर्नामेंट",
    tournamentsEmpty: "अभी कोई टूर्नामेंट खुला नहीं है",
    tournamentsHelp: "टूर्नामेंट खुलने पर उसकी तारीखें और नियम यहाँ दिखेंगे।",
    leaderboard: "लीडरबोर्ड",
    leaderboardEmpty: "लीडरबोर्ड टूर्नामेंट का इंतज़ार कर रहा है",
    leaderboardHelp: "टूर्नामेंट शुरू होने के बाद रैंकिंग दिखेगी।",
  },
  ta: {
    eyebrow: "என் தொழில் பாதை",
    title: "விளையாடு",
    description: "விளையாட்டுகள் மூலம் பயனுள்ள திறன்களைப் பயிற்சி செய்யுங்கள். போட்டிகளும் தரவரிசையும் செயலில் இருக்கும் போது இங்கே தோன்றும்.",
    games: "விளையாட்டுகள்",
    gamesHelp: "ஒரு விளையாட்டைத் தேர்ந்தெடுத்து விளையாடிக்கொண்டே பயிற்சி செய்யுங்கள்.",
    open: "விளையாடு",
    loading: "விளையாட்டுகள் ஏற்றப்படுகின்றன",
    loadError: "இப்போது விளையாட்டுகளை ஏற்ற முடியவில்லை.",
    retry: "மீண்டும் முயற்சிக்கவும்",
    gamesEmpty: "இப்போது விளையாட்டுகள் எதுவும் கிடைக்கவில்லை",
    gamesEmptyHelp: "புதிய விளையாட்டுகள் தயாரானதும் இங்கே தோன்றும்.",
    tournaments: "போட்டிகள்",
    tournamentsEmpty: "இப்போது எந்தப் போட்டியும் திறக்கப்படவில்லை",
    tournamentsHelp: "போட்டி தொடங்கும் போது அதன் தேதிகளும் விதிகளும் இங்கே தோன்றும்.",
    leaderboard: "தரவரிசை",
    leaderboardEmpty: "தரவரிசை ஒரு போட்டிக்காக காத்திருக்கிறது",
    leaderboardHelp: "போட்டி தொடங்கிய பிறகு தரவரிசைகள் இங்கே தோன்றும்.",
  },
} as const;

export default function PlayHub() {
  const { user } = useAuth();
  const { locale } = useTranslations();
  const text = playCopy[locale];
  const [experience, setExperience] = useState<MyCareerPathExperience | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [requestVersion, setRequestVersion] = useState(0);
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
    return () => {
      active = false;
    };
  }, [locale, requestVersion, user?.uid]);

  const games = useMemo(
    () => experience ? buildGameShelf(experience, text.games, text.gamesHelp) : null,
    [experience, text],
  );

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-7 pb-28 sm:py-10 xl:pb-20">
      <section
        className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-amber-100 via-orange-50 to-sky-100 p-5 text-primary sm:p-8"
        aria-labelledby="play-page-title"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm">
          <Gamepad2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary/60">{text.eyebrow}</p>
        <h1 id="play-page-title" className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{text.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-primary/70 sm:text-base">{text.description}</p>
      </section>

      <section className="mt-9" aria-labelledby="play-games-title">
        <SectionHeading icon={Gamepad2} id="play-games-title" title={text.games} description={text.gamesHelp} />
        {loadState === "loading" ? (
          <div className="mt-4 flex min-h-40 items-center justify-center rounded-2xl border border-primary/10 bg-card" role="status">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />{text.loading}
          </div>
        ) : null}
        {loadState === "error" ? (
          <StatusCard icon={Gamepad2} title={text.loadError} description={text.gamesEmptyHelp}>
            <Button type="button" className="mt-4 rounded-full" onClick={() => {
              setLoadState("loading");
              setRequestVersion((value) => value + 1);
            }}>{text.retry}</Button>
          </StatusCard>
        ) : null}
        {loadState === "ready" && games?.items.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.items.map((item) => (
              <GameCard key={item.id} item={item} label={text.open} onOpen={() => setDownloadTitle(item.title)} />
            ))}
          </div>
        ) : null}
        {loadState === "ready" && !games?.items.length ? (
          <StatusCard icon={Gamepad2} title={text.gamesEmpty} description={text.gamesEmptyHelp} />
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="play-tournaments-title">
        <SectionHeading icon={CalendarDays} id="play-tournaments-title" title={text.tournaments} />
        <StatusCard icon={Trophy} title={text.tournamentsEmpty} description={text.tournamentsHelp} />
      </section>

      <section className="mt-10" aria-labelledby="play-leaderboard-title">
        <SectionHeading icon={Trophy} id="play-leaderboard-title" title={text.leaderboard} />
        <StatusCard icon={UsersRound} title={text.leaderboardEmpty} description={text.leaderboardHelp} />
      </section>

      <DownloadAppModal
        isOpen={Boolean(downloadTitle)}
        onClose={() => setDownloadTitle(null)}
        title={downloadTitle ?? ""}
      />
    </main>
  );
}
function SectionHeading({
  icon: Icon,
  id,
  title,
  description,
}: {
  icon: typeof Gamepad2;
  id: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/25 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 id={id} className="text-xl font-semibold text-primary sm:text-2xl">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}

function GameCard({ item, label, onOpen }: { item: LearnItem; label: string; onOpen: () => void }) {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-none">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-100 to-sky-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Gamepad2 className="absolute bottom-5 left-5 h-9 w-9 text-primary/70" />}
      </div>
      <CardContent className="flex min-h-36 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold text-card-foreground">{item.title}</h3>
        {item.meta ? <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p> : null}
        <Button type="button" variant="link" className="mt-auto h-auto w-fit p-0 pt-5 font-semibold" onClick={onOpen}>
          {label}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Gamepad2;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="mt-4 border-dashed border-primary/15 bg-card shadow-none">
      <CardContent className="flex items-start gap-4 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-card-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
