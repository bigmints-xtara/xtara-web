"use client";

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
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{content.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link
                href={isLoggedIn ? "/dashboard" : "/assessment"}
                onClick={() => trackEvent({ action: "cta_click", category: "engagement", label: isLoggedIn ? "home_final_open_path" : "home_final_assessment" })}
              >
                {isLoggedIn ? content.primaryLoggedIn : content.primary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!isLoggedIn ? (
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary/15 bg-white px-7">
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

        <div className="relative h-full min-h-[360px] w-full self-stretch lg:min-h-[480px]">
          <Image
            src="/images/home/family-supported-future.jpg"
            alt={content.imageAlt}
            width={1400}
            height={1500}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#eaf4fa] lg:via-transparent lg:to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default CTA;
