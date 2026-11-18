"use client";

import publicType from "@/components/MarketingLayout.module.css";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { trackEvent } from "@/lib/analytics";

const CTA = () => {
  const { user } = useAuth();
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home.cta;
  const isLoggedIn = Boolean(user && !user.isAnonymous);

  return (
    <section id="cta" className="mb-16 overflow-hidden rounded-[2rem] bg-[#eaf4fa] sm:mb-24">
      <div className="grid grid-cols-1 items-center lg:grid-cols-[1.15fr_0.85fr]">
        <div className="px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.eyebrow}</p>
          <h2 className={`mt-4 max-w-3xl font-semibold text-primary ${publicType.sectionTitle}`}>
            {content.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.description}</p>

          <div className="mt-8 flex flex-col flex-wrap gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-auto min-h-12 whitespace-normal rounded-full px-7 py-3">
              <Link
                href={isLoggedIn ? "/dashboard" : "/assessment"}
                onClick={() => trackEvent({ action: "cta_click", category: "engagement", label: isLoggedIn ? "home_final_open_path" : "home_final_assessment" })}
              >
                {isLoggedIn ? content.primaryLoggedIn : content.primary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!isLoggedIn ? (
              <Button asChild size="lg" variant="outline" className="h-auto min-h-12 whitespace-normal rounded-full border-primary/15 bg-white px-7 py-3">
                <Link
                  href="/login"
                  onClick={() => trackEvent({ action: "login_click", category: "engagement", label: "home_final_login" })}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {content.login}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="w-full px-4 pb-4 lg:p-6">
          <Image
            src="/images/home/exploring-together.webp"
            alt={content.imageAlt}
            width={1200}
            height={800}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="h-auto w-full rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
};

export default CTA;
