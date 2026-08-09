import { describe, expect, it } from "vitest";

import { safeNotificationHref } from "@/lib/notifications";

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
