import { describe, expect, it } from "vitest";

import { friendlyLoginError } from "@/lib/login-error";

describe("friendlyLoginError", () => {
  it("keeps common Firebase recovery messages concise", () => {
    expect(friendlyLoginError({ code: "auth/invalid-credential" })).toBe(
      "Incorrect email or password. Please try again.",
    );
    expect(friendlyLoginError({ code: "auth/network-request-failed" })).toBe(
      "Network issue. Check your connection and try again.",
    );
  });

  it("never exposes an unknown provider exception", () => {
    const providerError = Object.assign(
      new Error("Raw Firebase provider diagnostic"),
      { code: "auth/internal-error" },
    );

    const message = friendlyLoginError(providerError);

    expect(message).toBe("Something went wrong. Please try again.");
    expect(message).not.toContain("provider");
  });
});
