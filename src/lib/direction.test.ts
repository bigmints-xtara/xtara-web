import { describe, expect, it } from "vitest";

import { createAreaDirectionPlan, createDirectionPlan, parseDirectionPlan, selectDirectionRole, setDreamCareers, switchCareerDirection, toggleDirectionAction, toggleDreamCareer } from "./direction";

describe("My Direction", () => {
  it("starts with an area before requiring a role", () => {
    const plan = createAreaDirectionPlan("health", new Date("2026-07-21T00:00:00.000Z"));
    expect(plan).toMatchObject({ version: "3.0.0", areaId: "health", dreamCareerIds: [] });
    expect(selectDirectionRole(plan, "physician").dreamCareerIds).toEqual(["physician"]);
  });

  it("creates a revisable plan with three incomplete actions", () => {
    const now = new Date("2026-07-21T00:00:00.000Z");
    const plan = createDirectionPlan("physician", "health", now);

    expect(plan.dreamCareerIds).toEqual(["physician"]);
    expect(plan.savedDirections.health.dreamCareerIds).toEqual(["physician"]);
    expect(plan.actions).toEqual({ learn: false, try: false, discuss: false });
    expect(plan.reviewOn).toBe("2026-08-04T00:00:00.000Z");
    expect(plan.updatedAt).toBe(now.toISOString());
  });

  it("toggles action evidence without changing role identity", () => {
    const plan = createDirectionPlan("physician", "health", new Date("2026-07-21T00:00:00.000Z"));
    const updated = toggleDirectionAction(plan, "try", new Date("2026-07-22T00:00:00.000Z"));

    expect(updated.dreamCareerIds).toEqual(plan.dreamCareerIds);
    expect(updated.actions.try).toBe(true);
    expect(plan.actions.try).toBe(false);
    expect(updated.updatedAt).toBe("2026-07-22T00:00:00.000Z");
  });

  it("rejects malformed local plans", () => {
    expect(parseDirectionPlan(null)).toBeNull();
    expect(parseDirectionPlan("not-json")).toBeNull();
    expect(parseDirectionPlan(JSON.stringify({ version: "0.9.0" }))).toBeNull();
  });

  it("migrates a valid role-first plan into the area-first schema", () => {
    const legacy = createDirectionPlan("physician", "health", new Date("2026-07-21T00:00:00.000Z"));
    const parsed = parseDirectionPlan(JSON.stringify({ ...legacy, version: "1.0.0" }));
    expect(parsed).toMatchObject({ version: "3.0.0", areaId: "health", dreamCareerIds: ["physician"] });
  });

  it("supports one to three Dream Careers and rejects a fourth", () => {
    const plan = createAreaDirectionPlan("health");
    const selected = setDreamCareers(plan, ["physician", "physiotherapist", "biomedical-engineer"]);
    expect(selected.dreamCareerIds).toHaveLength(3);
    expect(() => toggleDreamCareer(selected, "nurse")).toThrow("Choose up to three Dream Careers");
  });

  it("remembers Dream Careers and progress separately for each Career Direction", () => {
    let plan = setDreamCareers(createAreaDirectionPlan("technology"), ["software-developer"]);
    plan = toggleDirectionAction(plan, "learn");
    plan = switchCareerDirection(plan, "science");
    plan = setDreamCareers(plan, ["data-scientist"]);
    plan = switchCareerDirection(plan, "technology");

    expect(plan.dreamCareerIds).toEqual(["software-developer"]);
    expect(plan.actions.learn).toBe(true);
    expect(plan.savedDirections.science.dreamCareerIds).toEqual(["data-scientist"]);
  });

  it("repairs a stale active snapshot while preserving other Career Directions", () => {
    const plan = createDirectionPlan("physician", "health", new Date("2026-07-21T00:00:00.000Z"));
    const parsed = parseDirectionPlan(JSON.stringify({
      ...plan,
      dreamCareerIds: ["physiotherapist"],
      savedDirections: {
        health: plan.savedDirections.health,
        technology: {
          ...plan.savedDirections.health,
          dreamCareerIds: ["software-developer"],
        },
      },
    }));

    expect(parsed?.savedDirections.health.dreamCareerIds).toEqual(["physiotherapist"]);
    expect(parsed?.savedDirections.technology.dreamCareerIds).toEqual(["software-developer"]);
  });
});
