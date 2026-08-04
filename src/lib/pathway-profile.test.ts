import { describe, expect, it } from "vitest";

import { buildDiscoveryResult } from "./assessment-v2";
import { buildDiscoverySaveBundle, localizePathwayValue, parsePathwayProfile } from "./pathway-profile";
import { createAreaDirectionPlan } from "./direction";

describe("pathway profile", () => {
  const profile = {
    state: "Kerala", district: "Kozhikode", city: "Kozhikode", educationBoard: "CBSE",
    studyLanguage: "English", locationPreference: "Anywhere in India",
    affordability: "Lower-cost options are important", scholarshipInterest: "Yes",
    updatedAt: "2026-07-21T00:00:00.000Z",
  };

  it("keeps pathway feasibility separate from discovery scoring", () => {
    const assessment = buildDiscoveryResult("grade8", "en", {
      activityCuriosity: ["buildDigital"],
      activityExperience: ["problemSolving"],
      strengthConfidence: ["understand"],
      experienceLevel: "some",
    });
    const bundle = buildDiscoverySaveBundle(assessment, profile, createAreaDirectionPlan(assessment.areas[0].id));
    expect(bundle?.assessment.areas).toEqual(assessment.areas);
    expect(bundle?.pathwayProfile.affordability).toBe("Lower-cost options are important");
    expect(bundle?.assessment).not.toHaveProperty("affordability");
    expect(bundle?.directionPlan.areaId).toBe(assessment.areas[0].id);
  });

  it("rejects malformed stored profiles", () => {
    expect(parsePathwayProfile("{}")) .toBeNull();
    expect(parsePathwayProfile(JSON.stringify(profile))).toEqual(profile);
  });

  it("localizes pathway choices without changing their stored values", () => {
    expect(localizePathwayValue("Anywhere in India", "ml")).toBe("ഇന്ത്യയിൽ എവിടെയും");
    expect(localizePathwayValue("CBSE", "ml")).toBe("CBSE");
    expect(localizePathwayValue("Anywhere in India", "en")).toBe("Anywhere in India");
  });
});
