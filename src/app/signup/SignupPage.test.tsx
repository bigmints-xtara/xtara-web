import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignupPage from "@/app/signup/page";
import { LanguageProvider } from "@/i18n/language-provider";

describe("assessment signup continuation", () => {
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
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("saveDiscovery=1&next=%2Fdashboard") as ReturnType<typeof useSearchParams>,
    );
  });

  it("returns account holders to My Direction after saving choices", () => {
    render(
      <LanguageProvider initialLocale="en">
        <SignupPage />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Save your future plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?saveDiscovery=1&next=%2Fdashboard",
    );
  });
});
