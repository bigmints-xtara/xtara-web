"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { ConversationJournal, useConversationCopy } from "@/components/guidance/ConversationJournal";
import journey from "@/components/journey/journey.module.css";

export default function StudentGuidancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { c } = useConversationCopy();
  useEffect(() => {
    if (!loading && (!user || user.isAnonymous)) router.replace("/login?next=%2Fguidance");
  }, [user, loading, router]);

  return <div className={journey.surface}>
    <Navbar />
    <main className={`site-frame ${journey.studentDashboard} pt-6 pb-24 sm:pt-9`}>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">
        <ArrowLeft size={16} aria-hidden="true" />{c.back}
      </Link>
      {(loading || (user && !user.isAnonymous)) && <ConversationJournal />}
    </main>
    <Footer />
  </div>;
}
