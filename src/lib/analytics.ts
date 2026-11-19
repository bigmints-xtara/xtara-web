const productionMeasurementId = "G-1J324NZLJS";
const configuredMeasurementId = process.env.NEXT_PUBLIC_GA_ID?.trim();

export type AnalyticsSurface = "website" | "student_portal" | "educator_portal";
export type ProductEvent =
  | "login"
  | "sign_up"
  | "assessment_start"
  | "assessment_complete"
  | "career_plan_saved"
  | "career_pursuit_saved"
  | "organization_created"
  | "organization_class_created"
  | "organization_invitation_created"
  | "organization_joined"
  | "organization_learner_removed"
  | "educator_profile_saved"
  | "guidance_conversation_saved";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const publicPages = new Set([
  "/", "/about", "/contact", "/download", "/educators", "/news", "/parents",
  "/privacy-policy", "/privacy-policy/delete-account", "/terms-of-use",
]);
const educatorPages = new Set([
  "/organization", "/organization/classes", "/organization/learners",
  "/organization/profile", "/organization/signup",
]);
const studentPages = new Set([
  "/assessment", "/assessment/discovery", "/assessment/pathway", "/assessment/save",
  "/assessment-data", "/achievements", "/careers", "/colleges", "/dashboard",
  "/dashboard/challenges", "/direction", "/explore", "/guidance", "/learn",
  "/notifications", "/play", "/profile",
]);
const dynamicPages: [RegExp, string, AnalyticsSurface][] = [
  [/^\/news\/[^/]+$/, "/news/:article", "website"],
  [/^\/organization\/students\/[^/]+$/, "/organization/students/:learner", "educator_portal"],
  [/^\/join\/[^/]+$/, "/join/:invitation", "student_portal"],
  [/^\/assessment\/careers\/[^/]+$/, "/assessment/careers/:direction", "student_portal"],
  [/^\/assessment\/results\/[^/]+$/, "/assessment/results/:result", "student_portal"],
  [/^\/dashboard\/good-reads\/[^/]+$/, "/dashboard/good-reads/:article", "student_portal"],
  [/^\/dashboard\/sparks\/[^/]+\/quiz$/, "/dashboard/sparks/:spark/quiz", "student_portal"],
  [/^\/dashboard\/sparks\/[^/]+$/, "/dashboard/sparks/:spark", "student_portal"],
  [/^\/explore\/roles\/[^/]+\/study-options$/, "/explore/roles/:role/study-options", "student_portal"],
  [/^\/explore\/roles\/[^/]+$/, "/explore/roles/:role", "student_portal"],
  [/^\/dream-careers\/[^/]+$/, "/dream-careers/:role", "student_portal"],
  [/^\/colleges\/[^/]+$/, "/colleges/:college", "student_portal"],
  [/^\/learn\/[^/]+$/, "/learn/:section", "student_portal"],
  [/^\/careers\/[^/]+$/, "/careers/:career", "student_portal"],
  [/^\/careers\/[^/]+\/(learn|grow|connect)$/, "/careers/:career/:area", "student_portal"],
  [/^\/careers\/[^/]+\/(learn|grow|connect)\/[^/]+$/, "/careers/:career/:area/:section", "student_portal"],
  [/^\/careers\/[^/]+\/learn\/(courses|scholarships)\/[^/]+$/, "/careers/:career/learn/:section/:resource", "student_portal"],
];

export function analyticsPage(pathname: string, educatorMode = false) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/login" || path === "/signup") {
    return { path, surface: educatorMode ? "educator_portal" : "student_portal" } as const;
  }
  if (publicPages.has(path)) return { path, surface: "website" } as const;
  if (educatorPages.has(path)) return { path, surface: "educator_portal" } as const;
  if (studentPages.has(path)) return { path, surface: "student_portal" } as const;
  const match = dynamicPages.find(([pattern]) => pattern.test(path));
  return match ? { path: match[1], surface: match[2] } : null;
}

type Gtag = NonNullable<Window["gtag"]>;
let activeTag: { id: string; gtag: Gtag; pageLocation: string; pageKey: string } | undefined;

function measurementId(hostname: string) {
  if (hostname === "xtara.ai" || hostname === "www.xtara.ai") return productionMeasurementId;
  if (/^G-[A-Z0-9]+$/.test(configuredMeasurementId ?? "") && configuredMeasurementId !== productionMeasurementId) {
    return configuredMeasurementId;
  }
  return null;
}

function initialReferrer() {
  try {
    const referrer = new URL(document.referrer);
    if (!["https:", "http:"].includes(referrer.protocol)) return "";
    if (referrer.origin !== window.location.origin) return referrer.origin;
    return referrer.origin + (analyticsPage(referrer.pathname)?.path ?? "/");
  } catch {
    return "";
  }
}

export function trackPageview(pathname: string, educatorMode = false) {
  if (typeof window === "undefined") return;
  const page = analyticsPage(pathname, educatorMode);
  if (!page) {
    activeTag = undefined;
    return;
  }
  const id = measurementId(window.location.hostname);
  if (!id) return;
  const pageKey = `${pathname}|${page.surface}`;
  if (activeTag?.pageKey === pageKey) return;

  const pageLocation = window.location.origin + page.path;
  const context = {
    page_location: pageLocation,
    page_title: page.path,
    page_referrer: activeTag?.pageLocation ?? initialReferrer(),
    xtara_surface: page.surface,
  };
  const gtag: Gtag = window.gtag ?? function () {
    // eslint-disable-next-line prefer-rest-params -- Keep the Google tag queue command format.
    (window.dataLayer ??= []).push(arguments);
  };
  const needsSetup = !window.gtag;
  if (needsSetup) {
    window.gtag = gtag;
    gtag("js", new Date());
  }
  gtag("set", context);
  if (needsSetup) {
    gtag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);
  }
  activeTag = { id, gtag, pageLocation, pageKey };
  gtag("event", "page_view", { ...context, send_to: id });
}

export function trackProductEvent(event: ProductEvent, surface: AnalyticsSurface, method?: "email" | "google") {
  const tag = activeTag;
  if (!tag) return;
  tag.gtag("event", event, { xtara_surface: surface, send_to: tag.id, ...(method && { method }) });
}

type MarketingEvent = { action: string; category: string; label?: string; value?: number };

export function trackEvent({ action, category, label, value }: MarketingEvent) {
  const tag = activeTag;
  if (!tag) return;
  tag.gtag("event", action, { event_category: category, event_label: label, value, send_to: tag.id });
}
