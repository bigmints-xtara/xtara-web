"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/i18n/language-provider";
import {
  getWeeklyPlan,
  saveWeeklyPlan,
  type WeeklyCommitmentInput,
  type WeeklyCommitmentKind,
  type WeeklyPlan,
} from "@/lib/weekly-plan-api";

const kinds: WeeklyCommitmentKind[] = ["sparks", "games", "challenges", "reads"];

const copy = {
  en: {
    title: "My goals this week",
    description: "Choose up to 3 small goals and see your progress.",
    reset: "Progress starts fresh every Monday.",
    selected: "{count} of 3 goals chosen",
    progress: "{completed} of {total} activities complete",
    change: "Change my goals",
    save: "Save my weekly goals",
    saving: "Saving…",
    max: "Choose up to 3 goals.",
    loadError: "Your weekly goals could not be loaded.",
    saveError: "Your weekly goals could not be saved. Try again.",
    retry: "Try again",
    increase: "Increase",
    decrease: "Decrease",
    kind: {
      sparks: "Read Sparks",
      games: "Play games",
      challenges: "Take challenges",
      reads: "Read useful articles",
    },
  },
  ml: {
    title: "ഈ ആഴ്ചയിലെ എന്റെ ലക്ഷ്യങ്ങൾ",
    description: "മൂന്ന് ചെറിയ ലക്ഷ്യങ്ങൾ വരെ തിരഞ്ഞെടുത്ത് പുരോഗതി കാണൂ.",
    reset: "എല്ലാ തിങ്കളാഴ്ചയും പുരോഗതി പുതുതായി തുടങ്ങും.",
    selected: "3 ലക്ഷ്യങ്ങളിൽ {count} തിരഞ്ഞെടുത്തു",
    progress: "{total} പ്രവർത്തനങ്ങളിൽ {completed} പൂർത്തിയായി",
    change: "ലക്ഷ്യങ്ങൾ മാറ്റാം",
    save: "ആഴ്ചയിലെ ലക്ഷ്യങ്ങൾ സൂക്ഷിക്കൂ",
    saving: "സൂക്ഷിക്കുന്നു…",
    max: "മൂന്ന് ലക്ഷ്യങ്ങൾ വരെ തിരഞ്ഞെടുക്കൂ.",
    loadError: "ആഴ്ചയിലെ ലക്ഷ്യങ്ങൾ ലഭിച്ചില്ല.",
    saveError: "ആഴ്ചയിലെ ലക്ഷ്യങ്ങൾ സൂക്ഷിക്കാനായില്ല. വീണ്ടും ശ്രമിക്കൂ.",
    retry: "വീണ്ടും ശ്രമിക്കൂ",
    increase: "കൂട്ടൂ",
    decrease: "കുറയ്ക്കൂ",
    kind: {
      sparks: "സ്പാർക്കുകൾ വായിക്കൂ",
      games: "ഗെയിമുകൾ കളിക്കൂ",
      challenges: "ചലഞ്ചുകൾ ചെയ്യൂ",
      reads: "ഉപയോഗമുള്ള ലേഖനങ്ങൾ വായിക്കൂ",
    },
  },
  hi: {
    title: "इस हफ्ते के मेरे लक्ष्य",
    description: "तीन छोटे लक्ष्य चुनें और अपनी प्रगति देखें।",
    reset: "प्रगति हर सोमवार फिर से शुरू होती है।",
    selected: "3 में से {count} लक्ष्य चुने",
    progress: "{total} में से {completed} गतिविधियाँ पूरी",
    change: "लक्ष्य बदलें",
    save: "हफ्ते के लक्ष्य सेव करें",
    saving: "सेव हो रहा है…",
    max: "तीन लक्ष्य तक चुनें।",
    loadError: "हफ्ते के लक्ष्य लोड नहीं हुए।",
    saveError: "हफ्ते के लक्ष्य सेव नहीं हुए। फिर कोशिश करें।",
    retry: "फिर कोशिश करें",
    increase: "बढ़ाएँ",
    decrease: "घटाएँ",
    kind: {
      sparks: "स्पार्क पढ़ें",
      games: "गेम खेलें",
      challenges: "चैलेंज करें",
      reads: "उपयोगी लेख पढ़ें",
    },
  },
  ta: {
    title: "இந்த வாரத்திற்கான என் இலக்குகள்",
    description: "மூன்று சிறிய இலக்குகள் வரை தேர்ந்தெடுத்து முன்னேற்றத்தைப் பாருங்கள்.",
    reset: "ஒவ்வொரு திங்கட்கிழமையும் முன்னேற்றம் புதிதாக தொடங்கும்.",
    selected: "3 இலக்குகளில் {count} தேர்ந்தெடுக்கப்பட்டன",
    progress: "{total} செயல்களில் {completed} முடிந்தன",
    change: "இலக்குகளை மாற்று",
    save: "வார இலக்குகளை சேமி",
    saving: "சேமிக்கிறது…",
    max: "மூன்று இலக்குகள் வரை தேர்ந்தெடுக்கவும்.",
    loadError: "வார இலக்குகளை ஏற்ற முடியவில்லை.",
    saveError: "வார இலக்குகளை சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்.",
    retry: "மீண்டும் முயலுங்கள்",
    increase: "அதிகரிக்கவும்",
    decrease: "குறைக்கவும்",
    kind: {
      sparks: "ஸ்பார்க்ஸ் படிக்கவும்",
      games: "விளையாட்டுகளை விளையாடவும்",
      challenges: "சவால்களை முயற்சிக்கவும்",
      reads: "பயனுள்ள கட்டுரைகளைப் படிக்கவும்",
    },
  },
} as const;

export default function WeeklyPlanCard() {
  const { locale } = useTranslations();
  const text = copy[locale];
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [draft, setDraft] = useState<Partial<Record<WeeklyCommitmentKind, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getWeeklyPlan();
      setPlan(next);
      setDraft(draftFrom(next.configured ? next.commitments : next.suggestions));
      setEditing(!next.configured);
    } catch {
      setError(text.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Locale changes only update copy; they do not need another API read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (kind: WeeklyCommitmentKind) => {
    setError("");
    setDraft((current) => {
      if (current[kind]) {
        const next = { ...current };
        delete next[kind];
        return next;
      }
      if (Object.keys(current).length >= 3) {
        setError(text.max);
        return current;
      }
      const target = plan?.suggestions.find((item) => item.kind === kind)?.target ?? 1;
      return { ...current, [kind]: target };
    });
  };

  const changeTarget = (kind: WeeklyCommitmentKind, delta: number) => {
    setDraft((current) => {
      const target = current[kind];
      if (!target) return current;
      return { ...current, [kind]: Math.min(7, Math.max(1, target + delta)) };
    });
  };

  const startEditing = () => {
    if (!plan) return;
    setDraft(draftFrom(plan.commitments));
    setEditing(true);
    setError("");
  };

  const save = async () => {
    const commitments = kinds.flatMap((kind): WeeklyCommitmentInput[] => (
      draft[kind] ? [{ kind, target: draft[kind]! }] : []
    ));
    if (!commitments.length || saving) return;
    setSaving(true);
    setError("");
    try {
      const next = await saveWeeklyPlan(commitments);
      setPlan(next);
      setDraft(draftFrom(next.commitments));
      setEditing(false);
    } catch {
      setError(text.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-none" data-testid="weekly-plan-card">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/25 text-primary">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-primary">{text.title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{text.description}</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            {text.saving}
          </div>
        ) : !plan ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert">
            <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error || text.loadError}</div>
            <Button type="button" variant="outline" className="mt-3 rounded-full" onClick={() => void load()}>{text.retry}</Button>
          </div>
        ) : editing ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-primary">
              {text.selected.replace("{count}", String(Object.keys(draft).length))}
            </p>
            <div className="mt-3 space-y-2">
              {kinds.map((kind) => {
                const selected = Boolean(draft[kind]);
                const target = draft[kind] ?? 1;
                return (
                  <div key={kind} className={`flex min-w-0 items-center gap-2 rounded-2xl border p-3 ${selected ? "border-primary/20 bg-secondary/15" : "border-primary/10"}`}>
                    <input
                      type="checkbox"
                      aria-label={text.kind[kind]}
                      checked={selected}
                      onChange={() => toggle(kind)}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                    <button type="button" onClick={() => toggle(kind)} className="min-w-0 flex-1 text-left text-sm font-semibold text-primary">
                      {text.kind[kind]}
                    </button>
                    {selected ? (
                      <div className="flex shrink-0 items-center">
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label={`${text.decrease} ${text.kind[kind]}`} onClick={() => changeTarget(kind, -1)} disabled={target <= 1}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-7 text-center text-sm font-semibold text-primary">{target}</span>
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label={`${text.increase} ${text.kind[kind]}`} onClick={() => changeTarget(kind, 1)} disabled={target >= 7}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
            <Button type="button" className="mt-4 w-full rounded-full" onClick={() => void save()} disabled={!Object.keys(draft).length || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? text.saving : text.save}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">{text.reset}</p>
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-primary">
              <span>{text.progress.replace("{completed}", String(plan.completed)).replace("{total}", String(plan.total))}</span>
              <span>{plan.completed}/{plan.total}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={plan.total} aria-valuenow={Math.min(plan.completed, plan.total)}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${plan.total ? Math.min(100, (plan.completed / plan.total) * 100) : 0}%` }} />
            </div>
            <ul className="mt-5 space-y-3">
              {plan.commitments.map((commitment) => (
                <li key={commitment.kind} className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${commitment.done ? "text-emerald-700" : "text-slate-300"}`} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{text.kind[commitment.kind]}</span>
                  <span className="text-sm font-semibold text-primary">{commitment.completed}/{commitment.target}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{text.reset}</p>
            <Button type="button" variant="outline" className="mt-4 w-full rounded-full" onClick={startEditing}>{text.change}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function draftFrom(commitments: WeeklyCommitmentInput[]) {
  return Object.fromEntries(
    commitments.slice(0, 3).map((item) => [item.kind, item.target]),
  ) as Partial<Record<WeeklyCommitmentKind, number>>;
}
