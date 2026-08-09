import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { xtaraApi } from "@/lib/api/client";
import { notificationKeys, safeNotificationHref, useNotificationActions, useNotificationInbox } from "@/lib/notifications";

vi.mock("@/lib/api/client", () => ({
  xtaraApi: { get: vi.fn(), post: vi.fn() },
}));

const notification = {
  id: "note_game_1",
  type: "game_published",
  title: "New game available",
  body: "Play Climate Quest in Xtara.",
  route: "/games",
  publicationVersion: "v4",
  state: "unread" as const,
  createdAt: "2026-08-10T00:00:00.000Z",
  readAt: null,
  dismissedAt: null,
};

describe("safeNotificationHref", () => {
  it("allows only Xtara learner routes", () => {
    expect(safeNotificationHref("/dashboard/sparks/spark-1")).toBe("/dashboard/sparks/spark-1");
    expect(safeNotificationHref("/learn/sparks/spark-1")).toBe("/dashboard/sparks/spark-1");
    expect(safeNotificationHref("/learn")).toBe("/learn");
    expect(safeNotificationHref("/games")).toBe("/learn");
    expect(safeNotificationHref("/profile")).toBe("/profile");
  });

  it("rejects external, protocol-relative, traversal, and admin routes", () => {
    expect(safeNotificationHref("https://example.com")).toBeNull();
    expect(safeNotificationHref("//example.com/path")).toBeNull();
    expect(safeNotificationHref("/learn/../admin")).toBeNull();
    expect(safeNotificationHref("/admin/users")).toBeNull();
  });
});

describe("notification inbox hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the authenticated inbox and persists read and dismiss actions in cache", async () => {
    vi.mocked(xtaraApi.get).mockResolvedValue({ items: [notification], limit: 20 });
    vi.mocked(xtaraApi.post)
      .mockResolvedValueOnce({ ...notification, state: "read", readAt: "2026-08-10T00:01:00.000Z" })
      .mockResolvedValueOnce({ ...notification, state: "dismissed", dismissedAt: "2026-08-10T00:02:00.000Z" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => ({
      inbox: useNotificationInbox(),
      actions: useNotificationActions(),
    }), { wrapper });

    await waitFor(() => expect(result.current.inbox.isSuccess).toBe(true));
    expect(xtaraApi.get).toHaveBeenCalledWith("/me/notifications?limit=20");
    expect(result.current.inbox.data?.items).toEqual([notification]);

    await act(() => result.current.actions.read.mutateAsync("note/game 1"));
    expect(xtaraApi.post).toHaveBeenNthCalledWith(1, "/me/notifications/note%2Fgame%201/read", {});
    expect(queryClient.getQueryData<{ items: Array<{ state: string }> }>(notificationKeys.inbox(20))?.items[0]?.state).toBe("read");

    await act(() => result.current.actions.dismiss.mutateAsync("note/game 1"));
    expect(xtaraApi.post).toHaveBeenNthCalledWith(2, "/me/notifications/note%2Fgame%201/dismiss", {});
    expect(queryClient.getQueryData<{ items: Array<{ state: string }> }>(notificationKeys.inbox(20))?.items[0]?.state).toBe("dismissed");
  });
});
