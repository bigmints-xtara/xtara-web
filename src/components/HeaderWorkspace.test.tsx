import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Header from "@/components/Header";
import { mvpNavigationCopy } from "@/lib/mvp-navigation";
import { LanguageProvider } from "@/i18n/language-provider";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useOrganizationWorkspace: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/context/OrganizationContext", () => ({ useOrganizationWorkspace: mocks.useOrganizationWorkspace }));

describe("workspace-aware header", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const storage: Storage = {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => { values.delete(key); },
      setItem: (key, value) => { values.set(key, String(value)); },
    };
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    vi.mocked(usePathname).mockReturnValue("/");
    window.history.replaceState(null, "", "/");
    mocks.useAuth.mockReturnValue({ user: { uid: "user-1" } });
  });

  it.each(["en", "ml", "hi", "ta"] as const)("shows exactly three mobile destinations in %s", (locale) => {
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false });
    render(<LanguageProvider initialLocale={locale}><Header /></LanguageProvider>);
    const mobile = document.querySelector('nav.fixed');
    const links = mobile?.querySelectorAll('a');
    expect(links).toHaveLength(3);
    expect(Array.from(links || []).map((link) => link.textContent)).toEqual([
      mvpNavigationCopy[locale].myDirection, mvpNavigationCopy[locale].exploreCareers, mvpNavigationCopy[locale].profile,
    ]);
  });

  it("keeps organization staff inside the educator workspace", () => {
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: true, loading: false });
    renderHeader();
    expect(screen.getByRole("link", { name: "Xtara Logo" })).toHaveAttribute("href", "/organization");
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/organization");
    expect(screen.getByRole("link", { name: "Learners" })).toHaveAttribute("href", "/organization/learners");
    expect(screen.getByRole("link", { name: "Classes" })).toHaveAttribute("href", "/organization/classes");
    expect(screen.getByRole("link", { name: "My profile" })).toHaveAttribute("href", "/organization/profile");
    expect(screen.queryByRole("link", { name: "My Career Path" })).not.toBeInTheDocument();
  });

  it.each([
    ["/organization/profile/", "My profile", "page"],
    ["/organization/students/learner-1", "Learners", "page"],
    ["/organization/learners", "Learners", "page"],
    ["/organization/classes", "Classes", "page"],
  ] as const)("selects only the matching educator destination at %s", (pathname, name, current) => {
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: true, loading: false });
    vi.mocked(usePathname).mockReturnValue(pathname);
    renderHeader();
    expect(screen.getByRole("link", { name, current })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workspace" })).not.toHaveAttribute("aria-current");
  });

  it.each([
    ["/", "/#how-it-works", "How it works", "location"],
    ["/explore/roles/software-developer/study-options", "/explore/roles/software-developer/study-options", "Explore Careers", "page"],
    ["/dream-careers/software-developer", "/dream-careers/software-developer", "Explore Careers", "page"],
    ["/explorer", "/explorer", "Explore Careers", undefined],
  ] as const)("matches the public active destination at %s", (pathname, url, name, current) => {
    mocks.useAuth.mockReturnValue({ user: null });
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false });
    vi.mocked(usePathname).mockReturnValue(pathname);
    window.history.replaceState(null, "", url);
    renderHeader();
    const link = screen.getByRole("link", { name });
    if (current) expect(link).toHaveAttribute("aria-current", current);
    else expect(link).not.toHaveAttribute("aria-current");
  });

  it.each([null, { uid: "anonymous-1", isAnonymous: true }])("links visitors to the public Explorer", (user) => {
    mocks.useAuth.mockReturnValue({ user });
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false });
    renderHeader();
    expect(screen.getByRole("link", { name: "Explore Careers" })).toHaveAttribute("href", "/explore");
    expect(screen.getByRole("link", { name: "Xtara Logo" })).toHaveAttribute("href", "/");
  });

  it("preserves the personal career path for learners", () => {
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false });
    renderHeader();
    expect(screen.getByRole("link", { name: "Xtara Logo" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getAllByRole("link", { name: "My Direction" })[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: "Learn" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Achievements" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Explore Careers" })[0]).toHaveAttribute("href", "/explore");
    expect(screen.getAllByRole("link", { name: "Profile" })[0]).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("link", { name: "Notifications" })).not.toBeInTheDocument();
  });

  it("keeps institution setup out of the learner shell before membership exists", () => {
    vi.mocked(usePathname).mockReturnValue("/organization/signup");
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false, error: null });
    renderHeader();
    expect(screen.getByRole("link", { name: "Xtara Logo" })).toHaveAttribute("href", "/organization");
    expect(screen.queryByRole("link", { name: "My Career Path" })).not.toBeInTheDocument();
  });
});

function renderHeader() {
  return render(<LanguageProvider initialLocale="en"><Header /></LanguageProvider>);
}
