"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ChevronRight, Loader2, RefreshCw, X } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { safeNotificationHref, useNotificationActions, useNotificationInbox, type XtaraNotification } from "@/lib/notifications";

const copy = {
  en: { title: "Notifications", description: "Important Career Path, learning, achievement, and account updates appear here.", caughtUp: "You're all caught up", empty: "There are no new notifications.", settings: "Notification settings", loading: "Loading notifications", loadError: "We could not load your notifications.", updateError: "We could not update that notification. Try again.", retry: "Try again", dismiss: "Dismiss", open: "Open update", unread: "New" },
  ml: { title: "അറിയിപ്പുകൾ", description: "കരിയർ വഴി, പഠനം, നേട്ടങ്ങൾ, അക്കൗണ്ട് എന്നിവയിലെ പ്രധാന മാറ്റങ്ങൾ ഇവിടെ കാണാം.", caughtUp: "പുതിയ അറിയിപ്പുകളൊന്നുമില്ല", empty: "ഇപ്പോൾ പുതിയ അറിയിപ്പുകളില്ല.", settings: "അറിയിപ്പ് ക്രമീകരണങ്ങൾ", loading: "അറിയിപ്പുകൾ ലോഡ് ചെയ്യുന്നു", loadError: "അറിയിപ്പുകൾ ലോഡ് ചെയ്യാനായില്ല.", updateError: "ആ അറിയിപ്പ് മാറ്റാനായില്ല. വീണ്ടും ശ്രമിക്കൂ.", retry: "വീണ്ടും ശ്രമിക്കൂ", dismiss: "ഒഴിവാക്കുക", open: "അപ്ഡേറ്റ് തുറക്കുക", unread: "പുതിയത്" },
  hi: { title: "सूचनाएँ", description: "करियर पथ, सीखने, उपलब्धियों और खाते से जुड़े महत्वपूर्ण अपडेट यहाँ दिखेंगे।", caughtUp: "आपने सभी अपडेट देख लिए हैं", empty: "अभी कोई नई सूचना नहीं है।", settings: "सूचना सेटिंग्स", loading: "सूचनाएँ लोड हो रही हैं", loadError: "सूचनाएँ लोड नहीं हो सकीं।", updateError: "यह सूचना अपडेट नहीं हो सकी। फिर कोशिश करें।", retry: "फिर कोशिश करें", dismiss: "हटाएँ", open: "अपडेट खोलें", unread: "नया" },
  ta: { title: "அறிவிப்புகள்", description: "தொழில் பாதை, கற்றல், சாதனைகள் மற்றும் கணக்கின் முக்கிய புதுப்பிப்புகள் இங்கே தோன்றும்.", caughtUp: "புதிய அறிவிப்புகள் இல்லை", empty: "இப்போது புதிய அறிவிப்புகள் இல்லை.", settings: "அறிவிப்பு அமைப்புகள்", loading: "அறிவிப்புகள் ஏற்றப்படுகின்றன", loadError: "அறிவிப்புகளை ஏற்ற முடியவில்லை.", updateError: "அந்த அறிவிப்பைப் புதுப்பிக்க முடியவில்லை. மீண்டும் முயல்க.", retry: "மீண்டும் முயல்க", dismiss: "நீக்கு", open: "புதுப்பிப்பைத் திற", unread: "புதியது" },
} as const;

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { locale } = useTranslations();
  const text = copy[locale];
  const router = useRouter();
  const inbox = useNotificationInbox(20, Boolean(user));
  const actions = useNotificationActions();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=%2Fnotifications");
  }, [loading, router, user]);

  const visible = (inbox.data?.items || []).filter((item) => item.state !== "dismissed");

  const openNotification = async (item: XtaraNotification) => {
    const href = safeNotificationHref(item.route);
    if (!href) return;
    if (item.state === "unread") await actions.read.mutateAsync(item.id).catch(() => undefined);
    router.push(href);
  };

  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <Navbar />
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-8 pb-28 sm:py-10 xl:pb-20">
      <header><div className="flex items-center gap-3"><Bell className="h-7 w-7 text-primary" /><h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">{text.title}</h1></div><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{text.description}</p></header>

      {loading || (user && inbox.isLoading) ? <InboxState icon={<Loader2 className="h-12 w-12 animate-spin" />} title={text.loading} /> : null}
      {!loading && user && inbox.isError ? <InboxState icon={<Bell className="h-12 w-12" />} title={text.loadError}><Button onClick={() => inbox.refetch()} variant="outline" className="mt-6 rounded-full"><RefreshCw className="h-4 w-4" />{text.retry}</Button></InboxState> : null}
      {actions.read.isError || actions.dismiss.isError ? <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{text.updateError}</p> : null}
      {!loading && user && inbox.isSuccess && visible.length === 0 ? <InboxState icon={<CheckCircle2 className="h-14 w-14" />} title={text.caughtUp} description={text.empty} /> : null}

      {!loading && user && visible.length > 0 ? <section className="mt-8 space-y-3" aria-live="polite">
        {visible.map((item) => {
          const href = safeNotificationHref(item.route);
          const unread = item.state === "unread";
          return <article key={item.id} className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${unread ? "border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30" : "border-primary/10 bg-card"}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-sky-600" : "bg-transparent"}`} aria-label={unread ? text.unread : undefined} />
              <button type="button" onClick={() => void openNotification(item)} disabled={!href} className="min-w-0 flex-1 text-left disabled:cursor-default">
                <span className="flex items-start justify-between gap-3"><span className="font-semibold text-primary">{item.title}</span>{href ? <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label={text.open} /> : null}</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.body}</span>
                <time className="mt-3 block text-xs text-muted-foreground" dateTime={item.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time>
              </button>
              <Button size="icon" variant="ghost" aria-label={`${text.dismiss}: ${item.title}`} disabled={actions.dismiss.isPending} onClick={() => actions.dismiss.mutate(item.id)}><X className="h-4 w-4" /></Button>
            </div>
          </article>;
        })}
      </section> : null}
    </main>
    <Footer />
  </div>;
}

function InboxState({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children?: React.ReactNode }) {
  return <section className="mt-8 flex flex-1 items-center justify-center rounded-3xl border border-primary/10 bg-card px-6 py-16 text-center"><div className="text-primary">{icon}<h2 className="mt-5 text-2xl font-semibold">{title}</h2>{description ? <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p> : null}{children}</div></section>;
}
