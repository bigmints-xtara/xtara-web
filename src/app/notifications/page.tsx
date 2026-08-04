"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Settings } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";

const copy = {
  en: { title: "Notifications", description: "Important Career Path, learning, achievement, and account updates appear here.", caughtUp: "You're all caught up", empty: "There are no new notifications. Xtara will show important updates here without inventing an unread count.", settings: "Notification settings" },
  ml: { title: "അറിയിപ്പുകൾ", description: "കരിയർ വഴി, പഠനം, നേട്ടങ്ങൾ, അക്കൗണ്ട് എന്നിവയിലെ പ്രധാന മാറ്റങ്ങൾ ഇവിടെ കാണാം.", caughtUp: "പുതിയ അറിയിപ്പുകളൊന്നുമില്ല", empty: "ഇപ്പോൾ പുതിയ അറിയിപ്പുകളില്ല. പ്രധാന മാറ്റങ്ങൾ ഉണ്ടാകുമ്പോൾ Xtara ഇവിടെ കാണിക്കും.", settings: "അറിയിപ്പ് ക്രമീകരണങ്ങൾ" },
  hi: { title: "सूचनाएँ", description: "करियर पथ, सीखने, उपलब्धियों और खाते से जुड़े महत्वपूर्ण अपडेट यहाँ दिखेंगे।", caughtUp: "आपने सभी अपडेट देख लिए हैं", empty: "अभी कोई नई सूचना नहीं है। महत्वपूर्ण बदलाव होने पर Xtara उन्हें यहाँ दिखाएगा।", settings: "सूचना सेटिंग्स" },
  ta: { title: "அறிவிப்புகள்", description: "தொழில் பாதை, கற்றல், சாதனைகள் மற்றும் கணக்கின் முக்கிய புதுப்பிப்புகள் இங்கே தோன்றும்.", caughtUp: "புதிய அறிவிப்புகள் இல்லை", empty: "இப்போது புதிய அறிவிப்புகள் இல்லை. முக்கிய மாற்றங்கள் ஏற்பட்டால் Xtara அவற்றை இங்கே காண்பிக்கும்.", settings: "அறிவிப்பு அமைப்புகள்" },
} as const;

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { locale } = useTranslations();
  const text = copy[locale];
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=%2Fnotifications");
  }, [loading, router, user]);

  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <Navbar />
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-8 pb-28 sm:py-10 xl:pb-20">
      <header><div className="flex items-center gap-3"><Bell className="h-7 w-7 text-primary" /><h1 className="text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">{text.title}</h1></div><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{text.description}</p></header>
      <section className="mt-8 flex flex-1 items-center justify-center rounded-3xl border border-primary/10 bg-white px-6 py-16 text-center"><div><CheckCircle2 className="mx-auto h-14 w-14 text-primary" /><h2 className="mt-5 text-2xl font-semibold text-primary">{text.caughtUp}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{text.empty}</p><Button asChild variant="outline" className="mt-6 rounded-full"><Link href="/profile#preferences"><Settings className="h-4 w-4" />{text.settings}</Link></Button></div></section>
    </main>
    <Footer />
  </div>;
}
