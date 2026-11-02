import { describe, expect, it } from "vitest";

import { createEmptyDreamCareer } from '@/lib/admin/configs/curatedDreamCareersConfig';
import { createEmptyFutureDirection } from '@/lib/admin/configs/futureDirectionsConfig';
import type { DiscoveryResult } from "./assessment-v2";
import { createAreaDirectionPlan } from "./direction";
import { canAccessPursuedArea, canAccessPursuedRole, isDirectionPlanCompatible } from "./exploration-access";

const result = {
  areas: [{ id: "health", roleIds: ["physician"] }],
} as DiscoveryResult;

describe("assessment-led exploration access", () => {
  it('accepts a reciprocally linked API career beyond the three preview suggestions', () => {
    const expanded = { ...result, catalogSnapshot: {
      directions: [{ ...createEmptyFutureDirection(), id: 'health', roleIds: ['physician', 'physiotherapist'] }],
      roles: [{ ...createEmptyDreamCareer(), id: 'physiotherapist', futureDirectionIds: ['health'] }],
    } };
    const plan = { ...createAreaDirectionPlan('health'), dreamCareerIds: ['physiotherapist'] };
    expect(isDirectionPlanCompatible(expanded, plan)).toBe(true);
    expect(canAccessPursuedRole(expanded, plan, 'health', 'physiotherapist')).toBe(true);
    expanded.catalogSnapshot.roles[0].futureDirectionIds = ['science'];
    expect(isDirectionPlanCompatible(expanded, plan)).toBe(false);
  });
  it("requires an assessment recommendation and pursued area", () => {
    expect(canAccessPursuedArea(result, createAreaDirectionPlan("health"), "health")).toBe(true);
    expect(canAccessPursuedArea(result, createAreaDirectionPlan("science"), "health")).toBe(false);
    expect(canAccessPursuedArea(null, createAreaDirectionPlan("health"), "health")).toBe(false);
  });

  it("only exposes roles curated under the pursued recommendation", () => {
    const plan = createAreaDirectionPlan("health");
    expect(canAccessPursuedRole(result, plan, "health", "physician")).toBe(true);
    expect(canAccessPursuedRole(result, plan, "health", "dancer")).toBe(false);
  });

  it("accepts area-first plans and rejects incompatible saved roles", () => {
    expect(isDirectionPlanCompatible(result, createAreaDirectionPlan("health"))).toBe(true);
    expect(isDirectionPlanCompatible(result, { ...createAreaDirectionPlan("health"), dreamCareerIds: ["dancer"] })).toBe(false);
  });
});
