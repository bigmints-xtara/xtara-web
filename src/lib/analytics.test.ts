import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  delete window.gtag;
  delete window.dataLayer;
  document.head.querySelectorAll('script[src*="googletagmanager.com"]').forEach((script) => script.remove());
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("classifies every Xtara surface without exporting dynamic identifiers", async () => {
  const { analyticsPage } = await import("./analytics");
  expect(analyticsPage("/educators")).toEqual({ path: "/educators", surface: "website" });
  expect(analyticsPage("/login", true)).toEqual({ path: "/login", surface: "educator_portal" });
  expect(analyticsPage("/assessment/results/private-result")).toEqual({ path: "/assessment/results/:result", surface: "student_portal" });
  expect(analyticsPage("/organization/students/private-member")).toEqual({ path: "/organization/students/:learner", surface: "educator_portal" });
  expect(analyticsPage("/join/private-code")).toEqual({ path: "/join/:invitation", surface: "student_portal" });
  expect(analyticsPage("/admin/users/private-user")).toBeNull();
});

it("queues one explicit page view per navigation, safe referrers and milestone parameters", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TESTSTREAM");
  const { trackPageview, trackProductEvent } = await import("./analytics");
  trackPageview("/join/INVITATION");
  trackPageview("/join/INVITATION");
  trackPageview("/organization/students/PERSON");
  trackProductEvent("guidance_conversation_saved", "educator_portal");
  trackPageview("/admin/users/PERSON");
  trackProductEvent("guidance_conversation_saved", "educator_portal");

  const commands = window.dataLayer?.map((entry) => Array.from(entry as ArrayLike<unknown>));
  expect(commands?.filter(([command]) => command === "config")).toEqual([
    ["config", "G-TESTSTREAM", expect.objectContaining({ send_page_view: false, allow_google_signals: false })],
  ]);
  expect(commands?.filter(([command]) => command === "event")).toEqual([
    ["event", "page_view", expect.objectContaining({
      page_location: window.location.origin + "/join/:invitation", xtara_surface: "student_portal",
    })],
    ["event", "page_view", expect.objectContaining({
      page_location: window.location.origin + "/organization/students/:learner",
      page_referrer: window.location.origin + "/join/:invitation", xtara_surface: "educator_portal",
    })],
    ["event", "guidance_conversation_saved", { xtara_surface: "educator_portal", send_to: "G-TESTSTREAM" }],
  ]);
  expect(JSON.stringify(commands)).not.toMatch(/INVITATION|PERSON/);
});

it("keeps production analytics out of non-production hosts", async () => {
  vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-1J324NZLJS");
  const { trackPageview } = await import("./analytics");
  trackPageview("/");
  expect(window.gtag).toBeUndefined();
});
