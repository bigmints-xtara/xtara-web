export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || null;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

type GtagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export const trackPageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !("gtag" in window)) {
    return;
  }
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const trackEvent = ({ action, category, label, value }: GtagEvent) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !("gtag" in window)) {
    return;
  }
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
};
