import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Header from "@/components/Header";
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
    mocks.useAuth.mockReturnValue({ user: { uid: "user-1" } });
  });

  it("keeps organization staff inside the educator workspace", () => {
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: true, loading: false });
    renderHeader();
    expect(screen.getByRole("link", { name: "Xtara Logo" })).toHaveAttribute("href", "/organization");
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/organization");
    expect(screen.getByRole("link", { name: "My profile" })).toHaveAttribute("href", "/organization/profile");
    expect(screen.queryByRole("link", { name: "My Career Path" })).not.toBeInTheDocument();
  });

  it("preserves the personal career path for learners", () => {
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false });
    renderHeader();
    expect(screen.getByRole("link", { name: "Xtara Logo" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getAllByRole("link", { name: "Career" })[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.getAllByRole("link", { name: "Learn" })[0]).toHaveAttribute("href", "/learn");
    expect(screen.getAllByRole("link", { name: "Achievements" })[0]).toHaveAttribute("href", "/achievements");
    expect(screen.getAllByRole("link", { name: "Profile" })[0]).toHaveAttribute("href", "/profile");
    expect(screen.getAllByRole("link", { name: "Notifications" })[0]).toHaveAttribute("href", "/notifications");
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
