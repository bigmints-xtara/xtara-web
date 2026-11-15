"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { xtaraApi } from "@/lib/api/client";
import { applyTheme, appearanceRevision, syncAppearance } from "@/lib/appearance";

export default function AppearanceBootstrap() {
  const { user } = useAuth();
  const accountId = user && !user.isAnonymous ? user.uid : null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", syncAppearance);
    return () => media.removeEventListener("change", syncAppearance);
  }, []);

  useEffect(() => {
    let active = true;
    // Never carry the previous account's preference into a new session.
    applyTheme("system");
    const initialRevision = appearanceRevision();
    if (accountId) {
      xtaraApi.get<{ preferences?: { theme?: unknown } }>("/me/preferences", {
        expectedUserId: accountId,
      }).then((response) => {
        // A settings change may have happened while this read was in flight.
        if (active && appearanceRevision() === initialRevision) {
          applyTheme(response.preferences?.theme);
        }
      }).catch(() => {
        if (active && appearanceRevision() === initialRevision) applyTheme("system");
      });
    }
    return () => { active = false; };
  }, [accountId]);

  return null;
}
