import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppearanceBootstrap from "@/components/AppearanceBootstrap";
import { applyTheme } from "@/lib/appearance";

const mocks = vi.hoisted(() => ({
  user: { uid: "learner-1", isAnonymous: false } as { uid: string; isAnonymous: boolean } | null,
  get: vi.fn(),
}));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/api/client", () => ({ xtaraApi: { get: mocks.get } }));

type Preferences = { preferences: { theme: string } };
function deferred() {
  let resolve!: (value: Preferences) => void;
  const promise = new Promise<Preferences>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("global appearance", () => {
  let systemDark = false;
  let listeners: Set<() => void>;

  beforeEach(() => {
    mocks.user = { uid: "learner-1", isAnonymous: false };
    mocks.get.mockReset();
    systemDark = false;
    listeners = new Set();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      get matches() { return systemDark; },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    })));
    applyTheme("system");
  });

  afterEach(() => {
    cleanup();
    applyTheme("system");
    vi.unstubAllGlobals();
  });

  function changeSystem(dark: boolean) {
    systemDark = dark;
    act(() => { listeners.forEach((listener) => listener()); });
  }

  it("restores the saved preference on a fresh page mount using the signed-in account", async () => {
    mocks.get.mockResolvedValue({ preferences: { theme: "dark" } });
    const first = render(<AppearanceBootstrap />);
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(mocks.get).toHaveBeenCalledWith("/me/preferences", { expectedUserId: "learner-1" });
    expect(document.documentElement.style.colorScheme).toBe("dark");
    first.unmount();
    applyTheme("light");
    render(<AppearanceBootstrap />);
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it("resets on identity changes and ignores the previous account's late response", async () => {
    const previous = deferred();
    const next = deferred();
    mocks.get.mockReturnValueOnce(previous.promise).mockReturnValueOnce(next.promise);
    const view = render(<AppearanceBootstrap />);
    applyTheme("dark");
    mocks.user = { uid: "learner-2", isAnonymous: false };
    view.rerender(<AppearanceBootstrap />);
    expect(document.documentElement).not.toHaveClass("dark");
    await act(async () => previous.resolve({ preferences: { theme: "dark" } }));
    expect(document.documentElement).not.toHaveClass("dark");
    await act(async () => next.resolve({ preferences: { theme: "light" } }));
    expect(mocks.get).toHaveBeenLastCalledWith("/me/preferences", { expectedUserId: "learner-2" });
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("resets on logout and ignores a pending signed-in read", async () => {
    const request = deferred();
    mocks.get.mockReturnValue(request.promise);
    const view = render(<AppearanceBootstrap />);
    applyTheme("dark");
    mocks.user = null;
    view.rerender(<AppearanceBootstrap />);
    expect(document.documentElement).not.toHaveClass("dark");
    await act(async () => request.resolve({ preferences: { theme: "dark" } }));
    expect(document.documentElement).not.toHaveClass("dark");
    changeSystem(true);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("tracks OS changes for system mode and respects subsequent profile selections", async () => {
    mocks.get.mockResolvedValue({ preferences: { theme: "system" } });
    render(<AppearanceBootstrap />);
    await act(async () => {});
    changeSystem(true);
    expect(document.documentElement).toHaveClass("dark");
    applyTheme("light");
    changeSystem(false);
    changeSystem(true);
    expect(document.documentElement).not.toHaveClass("dark");
    applyTheme("dark");
    changeSystem(false);
    expect(document.documentElement).toHaveClass("dark");
    applyTheme("system");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("does not replace a newer settings selection with an older bootstrap read", async () => {
    const request = deferred();
    mocks.get.mockReturnValue(request.promise);
    render(<AppearanceBootstrap />);
    applyTheme("dark");
    await act(async () => request.resolve({ preferences: { theme: "light" } }));
    expect(document.documentElement).toHaveClass("dark");
    changeSystem(false);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("uses the system setting when preferences cannot be loaded", async () => {
    systemDark = true;
    mocks.get.mockRejectedValue(new Error("offline"));
    render(<AppearanceBootstrap />);
    await act(async () => {});
    expect(document.documentElement).toHaveClass("dark");
    changeSystem(false);
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("does not fetch preferences for anonymous identities and removes its OS listener", () => {
    mocks.user = { uid: "guest", isAnonymous: true };
    systemDark = true;
    const view = render(<AppearanceBootstrap />);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveClass("dark");
    expect(listeners.size).toBe(1);
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
