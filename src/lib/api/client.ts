import { getXtaraApiUrl } from "@/lib/api/config";
import { getFirebaseAuth } from "@/lib/firebase-client";

export class XtaraApiError extends Error {
  status: number;
  requestId?: string;
  details?: unknown;

  constructor(message: string, status: number, requestId?: string, details?: unknown) {
    super(message);
    this.name = "XtaraApiError";
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

type ApiEnvelope<T> =
  | { data: T; meta?: { requestId?: string } }
  | { success: true; data?: T; user?: T; authenticated?: boolean; requestId?: string }
  | T;

type XtaraRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

async function authHeader(): Promise<Record<string, string>> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return {};
    return { Authorization: `Bearer ${await user.getIdToken()}` };
  } catch {
    // Public catalogue requests must remain usable when Firebase auth is not
    // configured (for example, in a local production build or public preview).
    // Protected endpoints still fail closed at the API when no bearer token is
    // present.
    return {};
  }
}

function unwrap<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === "object") {
    if ("data" in payload && payload.data !== undefined) return payload.data as T;
    if ("user" in payload && payload.user !== undefined) return payload.user as T;
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, init: XtaraRequestInit = {}): Promise<T> {
  const { body, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  if (!headers.has("Content-Type") && body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const tokenHeaders = await authHeader();
  Object.entries(tokenHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) headers.set(key, value);
  });

  const response = await fetch(getXtaraApiUrl(path), {
    ...requestInit,
    headers,
    credentials: requestInit.credentials ?? "include",
    body:
      body !== undefined && typeof body !== "string"
        ? JSON.stringify(body)
        : (body as BodyInit | null | undefined),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? (payload.error as {
            code?: string;
            message?: string;
            requestId?: string;
            details?: unknown;
          })
        : undefined;
    const requestId =
      response.headers.get("x-request-id") ||
      (payload && typeof payload === "object" && "requestId" in payload ? String(payload.requestId) : undefined);
    const message = typeof (payload as { error?: unknown } | null)?.error === "string"
      ? String((payload as { error: string }).error)
      : error?.message || response.statusText || `API request failed (${response.status})`;
    throw new XtaraApiError(message, response.status, requestId || error?.requestId, error?.details);
  }

  return unwrap<T>(payload as ApiEnvelope<T>);
}

export const xtaraApi = {
  get: <T>(path: string, init?: RequestInit) => apiRequest<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "POST", body }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "PATCH", body }),
  delete: <T>(path: string, init?: RequestInit) => apiRequest<T>(path, { ...init, method: "DELETE" }),
};

export default xtaraApi;
