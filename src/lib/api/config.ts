// Keep browser requests on the Xtara origin. Next.js proxies this path to the
// Cloud Run API, which also lets authentication cookies remain first-party.
const PRODUCTION_API_BASE_URL = "/xtara-service";
const DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:3111";

function normalizeBaseUrl(value: string | undefined): string {
  return (value || "").replace(/\/$/, "");
}

export function getXtaraApiBaseUrl(): string {
  const configured = normalizeBaseUrl(process.env.NEXT_PUBLIC_XTARA_API_BASE_URL);
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL;
}

export function getXtaraApiUrl(path: string): string {
  const baseUrl = getXtaraApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const versionedPath = normalizedPath.startsWith("/api/")
    ? normalizedPath
    : `/api/v1${normalizedPath}`;

  return `${baseUrl}${versionedPath}`;
}

export const XTARA_PRODUCTION_API_BASE_URL = PRODUCTION_API_BASE_URL;
export const XTARA_DEVELOPMENT_API_BASE_URL = DEVELOPMENT_API_BASE_URL;
