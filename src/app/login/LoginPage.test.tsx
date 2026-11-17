import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Answer the questions first" })).toHaveAttribute("href", "/assessment");
  });

  it("shows educator login and preserves the requested organization destination", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("mode=educator&next=%2Forganization") as ReturnType<typeof useSearchParams>,
    );
    renderLogin();
    expect(screen.getByRole("heading", { name: "Educator login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Educator" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByText(/your school decides which classes/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/signup?mode=educator&next=%2Forganization",
    );
  });

  it("keeps the account continuation pointed at location", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("saveDiscovery=1&next=%2Fassessment%2Fpathway") as ReturnType<typeof useSearchParams>,
    );
    renderLogin();

    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/signup?saveDiscovery=1&next=%2Fassessment%2Fpathway",
    );
  });

  it("reveals and hides the password without changing it or submitting", () => {
    renderLogin();
    const password = screen.getByLabelText("Password", { exact: true });
    fireEvent.change(password, { target: { value: "example-only-password" } });
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("example-only-password");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveValue("example-only-password");
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });
});

function renderLogin() {
  return render(
    <LanguageProvider initialLocale="en">
      <LoginPage />
    </LanguageProvider>,
  );
}
