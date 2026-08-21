import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { LanguageProvider } from "@/i18n/language-provider";

describe("login modes", () => {
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
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
  });

  it("keeps the existing learner login journey", () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Student" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Open my career path" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore your career path first" })).toHaveAttribute("href", "/assessment");
  });

  it("shows educator login and preserves the requested organization destination", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("mode=educator&next=%2Forganization") as ReturnType<typeof useSearchParams>,
    );
    renderLogin();
    expect(screen.getByRole("heading", { name: "Educator login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Educator" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Open educator workspace" })).toBeInTheDocument();
    expect(screen.getByText(/institution membership determines educator access/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      "/signup?mode=educator&next=%2Forganization",
    );
  });

  it("keeps the account continuation pointed at location", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("saveDiscovery=1&next=%2Fassessment%2Fpathway") as ReturnType<typeof useSearchParams>,
    );
    renderLogin();

    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      "/signup?saveDiscovery=1&next=%2Fassessment%2Fpathway",
    );
  });
});

function renderLogin() {
  return render(
    <LanguageProvider initialLocale="en">
      <LoginPage />
    </LanguageProvider>,
  );
}
