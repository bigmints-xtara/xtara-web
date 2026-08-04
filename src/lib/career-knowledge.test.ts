import { describe, expect, it } from "vitest";

import {
  getCareerArea,
  getCareerAreas,
  getCareerRole,
  getCareerRolesByArea,
} from "./career-knowledge";

describe("career knowledge", () => {
  it("keeps stable area and role identities across locales", () => {
    expect(getCareerAreas("en").map((area) => area.id)).toEqual(
      getCareerAreas("ml").map((area) => area.id),
    );
    expect(getCareerAreas("en").map((area) => area.id)).toEqual(
      getCareerAreas("ta").map((area) => area.id),
    );
    expect(getCareerRole("en", "physician")?.areaId).toBe("health");
    expect(getCareerRole("ml", "physician")?.title).toBe("ഫിസിഷ്യൻ (ഡോക്ടർ)");
    expect(getCareerRole("ta", "physician")?.title).not.toBe("Physician");
  });

  it("models a broad area as multiple concrete roles", () => {
    const healthRoles = getCareerRolesByArea("en", "health");
    expect(getCareerArea("en", "health")?.title).toBe("Health");
    expect(healthRoles.map((role) => role.id)).toEqual([
      "physician",
      "physiotherapist",
      "biomedical-engineer",
    ]);
  });

  it("requires provenance metadata on every pilot role", () => {
    for (const area of getCareerAreas("en")) {
      for (const role of getCareerRolesByArea("en", area.id)) {
        expect(role.sourceIds.length).toBeGreaterThan(0);
        expect(role.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(role.reviewStatus).toBe("pilot");
      }
    }
  });
});
