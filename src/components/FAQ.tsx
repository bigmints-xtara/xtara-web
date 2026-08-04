"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { useTranslations } from "@/i18n/language-provider";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { messages } = useTranslations();
  const content = messages.trustedDiscovery.home.questions;

  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary/60">{content.eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl md:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">{content.description}</p>
        </div>

        <div className="divide-y divide-primary/10 border-y border-primary/10">
          {content.items.map((faq, index) => {
            const isOpen = openIndex === index;
            const answerId = `home-faq-answer-${index}`;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenIndex((current) => current === index ? null : index)}
                  className="flex w-full items-start justify-between gap-5 py-6 text-left"
                >
                  <span className="text-lg font-semibold leading-7 text-primary sm:text-xl">{faq.question}</span>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen ? (
                  <div id={answerId} className="max-w-2xl pb-6 pr-12 text-sm leading-7 text-slate-600 sm:text-base">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
