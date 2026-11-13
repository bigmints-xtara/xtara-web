import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/language-provider";
import { getMessages } from "@/i18n/messages";
import { OrganizationError, OrganizationLoading } from "./OrganizationPageState";
import NavigationPending from "./NavigationPending";

const state = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", async (original) => ({
  ...await original<typeof import("next/link")>(),
  useLinkStatus: () => state,
}));

describe("organization navigation feedback", () => {
  beforeEach(() => {
    state.pending = false;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
  });

  it.each(["en", "ml", "hi", "ta"] as const)("announces loading and retry in %s", (locale) => {
    const retry = vi.fn();
    const copy = getMessages(locale).organizationNavigation;
    const view = render(<LanguageProvider initialLocale={locale}><OrganizationLoading /></LanguageProvider>);
    expect(screen.getByRole("status")).toHaveTextContent(copy.loading);
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    view.rerender(<LanguageProvider initialLocale={locale}><OrganizationError message="Request failed" onRetry={retry} /></LanguageProvider>);
    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    fireEvent.click(screen.getByRole("button", { name: copy.retry }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("shows feedback while Next is opening a destination and clears it on arrival", () => {
    state.pending = true;
    const view = render(<LanguageProvider initialLocale="en"><NavigationPending /></LanguageProvider>);
    expect(screen.getByRole("status")).toHaveTextContent("Opening page");
    state.pending = false;
    view.rerender(<LanguageProvider initialLocale="en"><NavigationPending /></LanguageProvider>);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
