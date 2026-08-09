import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { xtaraApi } from "@/lib/api/client";

export type NotificationState = "unread" | "read" | "dismissed";

export interface XtaraNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  route: string | null;
  publicationVersion: string | null;
  state: NotificationState;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
}

interface NotificationInboxResponse {
  items: XtaraNotification[];
  limit: number;
}

export const notificationKeys = {
  inbox: (limit: number) => ["notifications", "inbox", limit] as const,
};

export function safeNotificationHref(route: string | null | undefined): string | null {
  if (!route || !route.startsWith("/") || route.startsWith("//")) return null;
  if (route.includes("\\") || route.includes(":") || route.includes("..")) return null;

  const spark = route.match(/^\/learn\/sparks\/([A-Za-z0-9_-]{1,160})$/);
  if (spark) return `/dashboard/sparks/${spark[1]}`;
  const read = route.match(/^\/learn\/good-reads\/([A-Za-z0-9_-]{1,160})$/);
  if (read) return `/dashboard/good-reads/${read[1]}`;
  if (/^\/learn\/challenges\/[A-Za-z0-9_-]{1,160}$/.test(route)) return "/dashboard/challenges";

  const exact = [
    "/achievements",
    "/assessment",
    "/careers",
    "/dashboard/challenges",
    "/direction",
    "/explore",
    "/learn",
    "/profile",
  ];
  const prefixes = [
    "/careers/",
    "/dashboard/good-reads/",
    "/dashboard/sparks/",
    "/explore/",
    "/learn/",
  ];
  return exact.includes(route) || prefixes.some((prefix) => route.startsWith(prefix)) ? route : null;
}

export function useNotificationInbox(limit = 20, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.inbox(limit),
    queryFn: () => xtaraApi.get<NotificationInboxResponse>(`/me/notifications?limit=${limit}`),
    enabled,
    staleTime: 30_000,
  });
}

export function useNotificationActions(limit = 20) {
  const queryClient = useQueryClient();

  const replace = (notification: XtaraNotification) => {
    queryClient.setQueryData<NotificationInboxResponse>(notificationKeys.inbox(limit), (current) => current ? {
      ...current,
      items: current.items.map((item) => item.id === notification.id ? notification : item),
    } : current);
  };

  const read = useMutation({
    mutationFn: (id: string) => xtaraApi.post<XtaraNotification>(`/me/notifications/${encodeURIComponent(id)}/read`, {}),
    onSuccess: replace,
  });
  const dismiss = useMutation({
    mutationFn: (id: string) => xtaraApi.post<XtaraNotification>(`/me/notifications/${encodeURIComponent(id)}/dismiss`, {}),
    onSuccess: replace,
  });

  return { read, dismiss };
}
