import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMessages } from "@/i18n/messages";
import { LanguageProvider } from "@/i18n/language-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, userProfile: null, loading: false }),
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import Benefits from "@/components/Benefits/Benefits";
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import Header from "@/components/Header";
import Hero from "@/components/Hero";

describe("value-led homepage conversion journey", () => {
  let container: HTMLDivElement;
  let root: Root;
  let rendered: boolean;
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    rendered = false;
  });

  afterEach(() => {
    if (rendered) act(() => root.unmount());
    container.remove();
  });

  it("leads with student and parent outcomes and provides assessment and login paths", async () => {
    await act(async () => {
      root.render(
        <LanguageProvider initialLocale="en">
          <Header />
          <Hero />
          <main>
            <Benefits />
            <FAQ />
            <CTA />
          </main>
        </LanguageProvider>,
      );
      rendered = true;
    });

    expect(container.textContent).toContain("Your future starts with curiosity.");
    expect(container.textContent).toContain("Leave with direction, choices, and a next step.");
    expect(container.textContent).toContain("Make the next career conversation easier.");
    expect(container.textContent).toContain("Curated, not generated");
    expect(container.textContent).toContain("No perfect-match claims");

    expect(container.querySelectorAll('a[href="/assessment"]').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('a[href="/login"]').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('header a[href="/assessment"]')).toBeNull();
    expect(container.querySelector('a[href="/explore"]')).not.toBeNull();
  });

  it.each(["en", "ml", "hi", "ta"] as const)("keeps %s homepage within MVP scope", async (locale) => {
    const content = getMessages(locale).trustedDiscovery.home;
    await act(async () => {
      root.render(<LanguageProvider initialLocale={locale}><Hero /><Benefits /><FAQ /></LanguageProvider>);
      rendered = true;
    });
    for (const item of content.momentum.items) {
      expect(container.textContent).not.toContain(item.description);
    }
    expect(container.textContent).toContain("8–12");
    expect(container.textContent).toContain(content.hero.proofs[1]);
    const questions = container.querySelectorAll<HTMLButtonElement>("#faq button");
    await act(async () => questions[questions.length - 1].click());
    expect(container.textContent).toContain(content.questions.items.at(-1)!.answer);
    expect(container.querySelector('a[href="/assessment"]')).not.toBeNull();
  });

  it("pairs the Hindi language answer with the language question", () => {
    const items = getMessages("hi").trustedDiscovery.home.questions.items;
    expect(items[0].answer).not.toContain("तमिल");
    expect(items.at(-1)!.question).toBe("मैं कौन-सी भाषाएँ चुन सकता हूँ?");
    expect(items.at(-1)!.answer).toContain("अंग्रेज़ी, मलयालम, हिंदी या तमिल");
  });

  it("keeps the same value story available in Malayalam", () => {
    const content = getMessages("ml").trustedDiscovery.home;
    expect(content.hero.title).toContain("എനിക്ക് അറിയില്ല");
    expect(content.conversation.title).toContain("കരിയറിനെക്കുറിച്ച്");
    expect(content.cta.login).toContain("ലോഗിൻ");
  });
});
