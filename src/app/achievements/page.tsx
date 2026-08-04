"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Gamepad2, Medal, Puzzle, Sparkles, Trophy } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { AchievementsService } from "@/lib/firebase/achievements-service";
import type { AchievementStats, MedalData, PointHistoryRecord, PointsByCategory, TierData, WeeklyGoalData } from "@/lib/firebase/achievements-service";

type RewardSummary = {
  totalPoints: number;
  tier: TierData | null;
  medals: MedalData;
  stats: AchievementStats;
  points: PointsByCategory;
  weekly: WeeklyGoalData;
  history: PointHistoryRecord[];
};

const emptyRewards: RewardSummary = {
  totalPoints: 0,
  tier: null,
  medals: { total: 0, common: 0, rare: 0, epic: 0 },
  stats: { games: 0, sparks: 0, challenges: 0, goodReads: 0 },
  points: { games: 0, sparks: 0, challenges: 0, goodReads: 0, streaks: 0 },
  weekly: { goodReads: { current: 0, target: 5 }, challenges: { current: 0, target: 5 }, sparks: { current: 0, target: 5 } },
  history: [],
};

const pageCopy = {
  en: { title: "Achievements", description: "See the progress and recognition you have earned through real learning activity.", summary: "Achievements summary", weekly: "Weekly progress", weeklyHelp: "Completed activity compared with this week's learning targets.", medals: "Medals", medalsHelp: "Recognition earned through meaningful learning.", history: "Points history", historyHelp: "Why points were added and when.", noHistory: "No points have been earned yet.", points: "Points", tier: "Current tier", common: "Common", rare: "Rare", epic: "Epic", datePending: "Date unavailable", learn: "Continue learning" },
  ml: { title: "നേട്ടങ്ങൾ", description: "പഠന പ്രവർത്തനങ്ങളിലൂടെ നേടിയ പുരോഗതിയും അംഗീകാരവും കാണൂ.", summary: "നേട്ടങ്ങളുടെ സംഗ്രഹം", weekly: "ആഴ്ചയിലെ പുരോഗതി", weeklyHelp: "ഈ ആഴ്ചയിലെ പഠന ലക്ഷ്യങ്ങളുമായി പൂർത്തിയാക്കിയ പ്രവർത്തനം താരതമ്യം ചെയ്യൂ.", medals: "മെഡലുകൾ", medalsHelp: "അർത്ഥവത്തായ പഠനത്തിലൂടെ നേടിയ അംഗീകാരം.", history: "പോയിന്റ് ചരിത്രം", historyHelp: "പോയിന്റുകൾ ലഭിച്ചതിന്റെ കാരണവും തീയതിയും.", noHistory: "ഇതുവരെ പോയിന്റുകൾ നേടിയിട്ടില്ല.", points: "പോയിന്റുകൾ", tier: "നിലവിലെ ടിയർ", common: "സാധാരണ", rare: "അപൂർവം", epic: "എപ്പിക്", datePending: "തീയതി ലഭ്യമല്ല", learn: "പഠനം തുടരൂ" },
  hi: { title: "अचीवमेंट्स", description: "वास्तविक सीखने की गतिविधियों से मिली प्रगति और पहचान देखें।", summary: "अचीवमेंट्स का सार", weekly: "साप्ताहिक प्रगति", weeklyHelp: "इस सप्ताह के सीखने के लक्ष्यों से पूरी की गई गतिविधियों की तुलना।", medals: "मेडल", medalsHelp: "सार्थक सीखने से मिली पहचान।", history: "पॉइंट्स का इतिहास", historyHelp: "पॉइंट कब और क्यों मिले।", noHistory: "अभी तक कोई पॉइंट नहीं मिला है।", points: "पॉइंट्स", tier: "मौजूदा टियर", common: "कॉमन", rare: "रेयर", epic: "एपिक", datePending: "तारीख उपलब्ध नहीं", learn: "सीखना जारी रखें" },
  ta: { title: "சாதனைகள்", description: "உண்மையான கற்றல் செயல்பாடுகள் மூலம் பெற்ற முன்னேற்றத்தையும் அங்கீகாரத்தையும் பாருங்கள்.", summary: "சாதனைகளின் சுருக்கம்", weekly: "வாராந்திர முன்னேற்றம்", weeklyHelp: "இந்த வார கற்றல் இலக்குகளுடன் முடித்த செயல்பாடுகளை ஒப்பிடுங்கள்.", medals: "பதக்கங்கள்", medalsHelp: "பயனுள்ள கற்றல் மூலம் பெற்ற அங்கீகாரம்.", history: "புள்ளிகள் வரலாறு", historyHelp: "புள்ளிகள் ஏன், எப்போது சேர்க்கப்பட்டன.", noHistory: "இன்னும் புள்ளிகள் பெறப்படவில்லை.", points: "புள்ளிகள்", tier: "தற்போதைய நிலை", common: "பொது", rare: "அரிது", epic: "எபிக்", datePending: "தேதி கிடைக்கவில்லை", learn: "கற்றலைத் தொடரவும்" },
} as const;

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale, t } = useTranslations();
  const text = pageCopy[locale];
  const router = useRouter();
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<RewardSummary>(emptyRewards);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=%2Fachievements");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const service = new AchievementsService();
    Promise.all([
      service.getTotalPoints(user.uid), service.getTierData(user.uid), service.getMedalData(user.uid),
      service.getAchievementStats(user.uid), service.getPointsByCategory(user.uid), service.getWeeklyGoal(user.uid), service.getPointsHistory(user.uid),
    ]).then(([totalPoints, tier, medals, stats, points, weekly, history]) => {
      if (active) setRewards({ totalPoints, tier, medals, stats, points, weekly, history });
    }).catch(() => { if (active) setRewards(emptyRewards); }).finally(() => { if (active) setLoadedUserId(user.uid); });
    return () => { active = false; };
  }, [user]);

  if (authLoading || !user || loadedUserId !== user.uid) return <AchievementsSkeleton />;
  const activityCount = Object.values(rewards.stats).reduce((sum, count) => sum + count, 0);

  return <PageShell>
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 pb-28 sm:py-10 xl:pb-20">
      <header><h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">{text.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{text.description}</p></header>

      <section className="mt-7" aria-labelledby="achievements-summary-title">
        <Card className="overflow-hidden border-0 bg-primary text-white shadow-none"><CardContent className="p-6 sm:p-8"><div className="flex items-center gap-3"><Trophy className="h-6 w-6" /><h2 id="achievements-summary-title" className="text-xl font-semibold">{text.summary}</h2></div><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"><SummaryValue value={rewards.totalPoints.toLocaleString()} label={text.points} /><SummaryValue value={localizeTier(rewards.tier?.name || "starter", locale)} label={text.tier} /><SummaryValue value={String(rewards.medals.total)} label={text.medals} /></div></CardContent></Card>
      </section>

      <section className="mt-11" aria-labelledby="weekly-progress-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="weekly-progress-title" className="text-2xl font-semibold text-primary">{text.weekly}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text.weeklyHelp}</p></div><span className="text-sm font-semibold text-primary">{t("achievements.learning.total", { count: activityCount })}</span></div><div className="mt-5 grid gap-4 md:grid-cols-3"><WeeklyCard title={t("achievements.learning.sparks.title")} value={rewards.weekly.sparks} icon={Sparkles} /><WeeklyCard title={t("achievements.learning.challenges.title")} value={rewards.weekly.challenges} icon={Puzzle} /><WeeklyCard title={t("achievements.learning.reads.title")} value={rewards.weekly.goodReads} icon={BookOpen} /></div></section>

      <section className="mt-11" aria-labelledby="learning-evidence-title"><div className="flex items-end justify-between gap-4"><div><h2 id="learning-evidence-title" className="text-2xl font-semibold text-primary">{t("achievements.learning.title")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("achievements.learning.description")}</p></div><Button asChild variant="outline" className="hidden rounded-full sm:inline-flex"><Link href="/learn">{text.learn}<ArrowRight /></Link></Button></div><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><LearningCard title={t("achievements.learning.games.title")} count={rewards.stats.games} points={rewards.points.games} icon={Gamepad2} /><LearningCard title={t("achievements.learning.sparks.title")} count={rewards.stats.sparks} points={rewards.points.sparks} icon={Sparkles} /><LearningCard title={t("achievements.learning.challenges.title")} count={rewards.stats.challenges} points={rewards.points.challenges} icon={Puzzle} /><LearningCard title={t("achievements.learning.reads.title")} count={rewards.stats.goodReads} points={rewards.points.goodReads} icon={BookOpen} /></div></section>

      <section className="mt-11 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <Card className="border-primary/10 shadow-none"><CardContent className="p-6"><div className="flex items-center gap-3"><Medal className="h-6 w-6 text-primary" /><div><h2 className="text-xl font-semibold text-primary">{text.medals}</h2><p className="mt-1 text-sm text-muted-foreground">{text.medalsHelp}</p></div></div><div className="mt-6 grid grid-cols-3 gap-2 text-center"><RecognitionValue value={rewards.medals.common} label={text.common} /><RecognitionValue value={rewards.medals.rare} label={text.rare} /><RecognitionValue value={rewards.medals.epic} label={text.epic} /></div></CardContent></Card>
        <Card className="border-primary/10 shadow-none"><CardContent className="p-6"><h2 className="text-xl font-semibold text-primary">{text.history}</h2><p className="mt-1 text-sm text-muted-foreground">{text.historyHelp}</p>{rewards.history.length ? <ol className="mt-5 divide-y divide-primary/10">{rewards.history.slice(0, 10).map((item) => <li key={item.id} className="flex items-center gap-4 py-3"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-primary">{item.reason}</span><span className="mt-1 block text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleDateString(`${locale}-IN`) : text.datePending}</span></span><Badge variant="secondary">+{item.points}</Badge></li>)}</ol> : <p className="mt-5 rounded-xl bg-muted/45 p-4 text-sm text-muted-foreground">{text.noHistory}</p>}</CardContent></Card>
      </section>
    </main>
  </PageShell>;
}

function PageShell({ children }: { children: React.ReactNode }) { return <div className="flex min-h-screen flex-col bg-background text-foreground"><Navbar />{children}<Footer /></div>; }
function SummaryValue({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl bg-white/10 p-5"><div className="text-2xl font-semibold capitalize">{value}</div><div className="mt-1 text-xs text-white/65">{label}</div></div>; }
function RecognitionValue({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-muted/55 px-3 py-4"><div className="text-xl font-semibold text-primary">{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{label}</div></div>; }
function WeeklyCard({ title, value, icon: Icon }: { title: string; value: { current: number; target: number }; icon: typeof Sparkles }) { const percent = value.target ? Math.min(100, Math.round((value.current / value.target) * 100)) : 0; return <Card className="border-primary/10 shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-primary"><Icon className="h-5 w-5" /></span><span className="text-sm font-semibold text-primary">{value.current}/{value.target}</span></div><h3 className="mt-4 font-semibold text-primary">{title}</h3><Progress value={percent} className="mt-4 h-2" /></CardContent></Card>; }
function LearningCard({ title, count, points, icon: Icon }: { title: string; count: number; points: number; icon: typeof Sparkles }) { return <Card className="border-primary/10 shadow-none"><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold text-primary">{title}</h3><div className="mt-5 flex items-end justify-between border-t border-primary/10 pt-4"><div><div className="text-2xl font-semibold text-primary">{count}</div><div className="text-[11px] text-muted-foreground">completed</div></div><div className="text-right"><div className="text-sm font-semibold text-primary">{points}</div><div className="text-[11px] text-muted-foreground">points</div></div></div></CardContent></Card>; }
function AchievementsSkeleton() { return <PageShell><main className="mx-auto w-full max-w-7xl flex-1 animate-pulse px-5 py-10"><div className="h-10 w-64 rounded bg-muted" /><div className="mt-7 h-56 rounded-2xl bg-primary/10" /><div className="mt-10 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-44 rounded-2xl bg-muted" />)}</div></main></PageShell>; }
function localizeTier(tier: string, locale: "en" | "ml" | "hi" | "ta") { if (locale === "en") return tier; const names = locale === "ml" ? { starter: "തുടക്കം", bronze: "ബ്രോൺസ്", silver: "സിൽവർ", gold: "ഗോൾഡ്" } : locale === "hi" ? { starter: "शुरुआत", bronze: "ब्रॉन्ज़", silver: "सिल्वर", gold: "गोल्ड" } : { starter: "தொடக்கம்", bronze: "வெண்கலம்", silver: "வெள்ளி", gold: "தங்கம்" }; return names[tier.toLowerCase() as keyof typeof names] ?? tier; }
