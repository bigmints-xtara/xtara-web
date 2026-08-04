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

    expect(container.textContent).toContain("Turn “I don’t know” into a future worth exploring.");
    expect(container.textContent).toContain("Leave with direction, choices, and a next step.");
    expect(container.textContent).toContain("Make the next career conversation easier.");
    expect(container.textContent).toContain("Curated, not generated");
    expect(container.textContent).toContain("No perfect-match claims");

    expect(container.querySelectorAll('a[href="/assessment"]').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll('a[href="/login"]').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector('header a[href="/assessment"]')).toBeNull();
    expect(container.querySelector('img[alt="A joyful group of Indian school students"]')).not.toBeNull();
    expect(container.querySelector('img[alt="A young woman sharing a warm moment with an older family member"]')).not.toBeNull();
  });

  it("keeps the same value story available in Malayalam", () => {
    const content = getMessages("ml").trustedDiscovery.home;
    expect(content.hero.title).toContain("എനിക്ക് അറിയില്ല");
    expect(content.conversation.title).toContain("കരിയറിനെക്കുറിച്ച്");
    expect(content.cta.login).toContain("ലോഗിൻ");
  });
});
