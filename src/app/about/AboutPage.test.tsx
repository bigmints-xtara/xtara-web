import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/server", () => ({ getLocaleFromCookie: async () => "en" }));
vi.mock("@/components/MarketingLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/Breadcrumb", () => ({ default: () => <nav aria-label="Breadcrumb" /> }));
vi.mock("@/components/CTA", () => ({ default: () => <section>Final career path call to action</section> }));

import AboutPage from "@/app/about/page";
import { getMessages } from "@/i18n/messages";

describe("value-led About page", () => {
  it("explains Xtara without unsupported claims and leads into the real journey", async () => {
    render(await AboutPage());

    expect(screen.getByRole("heading", { name: "Career decisions should open possibilities—not close them too early." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore my career path" })).toHaveAttribute("href", "/assessment");
    expect(screen.getByRole("link", { name: "Log in to my plan" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("heading", { name: "Discover Career Directions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compare Dream Careers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Build My Career Path" })).toBeInTheDocument();
    expect(screen.getByText("Curated, not generated")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No perfect-match claims" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("AI-powered insights");
    expect(document.body.textContent).not.toContain("perfect career");
  });

  it("provides the same mission and trust story in Malayalam", () => {
    const about = getMessages("ml").about;
    expect(about.hero.title).toContain("സാധ്യതകൾ തുറക്കണം");
    expect(about.journey.steps).toHaveLength(3);
    expect(about.trust.items[0].title).toContain("ക്യൂറേറ്റ്");
    expect(about.people.items.map((item) => item.title)).toEqual(["വിദ്യാർത്ഥികൾ", "മാതാപിതാക്കൾ", "അധ്യാപകർ"]);
  });
});
