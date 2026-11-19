"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview } from "@/lib/analytics";

const AnalyticsProvider = () => {
  const pathname = usePathname();
  const educatorMode = useSearchParams()?.get("mode") === "educator";

  useEffect(() => {
    trackPageview(pathname, educatorMode);
  }, [pathname, educatorMode]);

  return null;
};

export default AnalyticsProvider;
