import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assessmentV2StorageKey,
  buildDiscoveryResult,
  loadDiscoveryResult,
  saveDiscoveryResult,
} from "@/lib/assessment-v2";
import {
  createAreaDirectionPlan,
  saveDirectionPlan,
  setDreamCareers,
  type DirectionPlan,
} from "@/lib/direction";
import {
  savePendingCareerChoiceToAccount,
  savePendingDiscoveryToAccount,
} from "@/lib/discovery-save";
import { savePathwayProfile } from "@/lib/pathway-profile";

const mocks = vi.hoisted(() => ({
  createApiSession: vi.fn(),
  saveAssessment: vi.fn(),
  patch: vi.fn(),
  get: vi.fn(),
  saveDirectionToApi: vi.fn(),
  getDirectionFromApi: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  createApiSession: mocks.createApiSession,
}));

vi.mock("@/lib/api/client", () => ({
  xtaraApi: {
    patch: mocks.patch,
    get: mocks.get,
  },
}));

vi.mock("@/lib/firebase/assessment", () => ({
  saveAssessment: mocks.saveAssessment,
}));

vi.mock("@/lib/direction-api", () => ({
  saveDirectionToApi: mocks.saveDirectionToApi,
  getDirectionFromApi: mocks.getDirectionFromApi,
}));

vi.mock("@/lib/firebase-client", () => ({
  getFirebaseAuth: () => ({
    currentUser: {
      uid: "learner-1",
      getIdToken: mocks.getIdToken,
    },
  }),
}));

describe("staged discovery account sync", () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    localStorage.clear();
    mocks.getIdToken.mockResolvedValue("token");
    mocks.createApiSession.mockResolvedValue(undefined);
    mocks.saveAssessment.mockResolvedValue("assessment-1");
    mocks.patch.mockResolvedValue({ id: "learner-1" });
  });

  it("persists assessment and career choice before any location profile exists", async () => {
    const { result, plan } = pendingCareerChoice();
    mocks.saveDirectionToApi.mockResolvedValue(plan);
    mocks.get.mockResolvedValue({
      assessment: {
        answers: {
          definitionId: result.definitionId,
          schemaVersion: result.version,
          stage: result.stage,
        },
      },
    });

    await expect(savePendingCareerChoiceToAccount("learner-1")).resolves.toBe(true);

    expect(localStorage.getItem("xtara_pathway_profile_v1")).toBeNull();
    expect(mocks.saveAssessment).toHaveBeenCalledOnce();
    expect(mocks.saveAssessment.mock.calls[0][1]).not.toHaveProperty("pathwayProfile");
    expect(mocks.patch).toHaveBeenCalledWith(
      "/me",
      expect.not.objectContaining({ pathwayProfile: expect.anything() }),
    );
    expect(mocks.saveDirectionToApi).toHaveBeenCalledWith(plan);
    expect(mocks.get).toHaveBeenCalledWith("/assessment/latest");
    expect(mocks.createApiSession).toHaveBeenCalledWith("token");
  });

  it("keeps the learner on the account step when no career choice is pending", async () => {
    const { result } = pendingCareerChoice();
    localStorage.clear();
    localStorage.setItem(assessmentV2StorageKey, JSON.stringify(result));

    await expect(savePendingCareerChoiceToAccount("learner-1")).resolves.toBe(false);

    expect(mocks.saveAssessment).not.toHaveBeenCalled();
    expect(mocks.patch).not.toHaveBeenCalled();
    expect(mocks.saveDirectionToApi).not.toHaveBeenCalled();
  });

  it("completes location only after assessment, direction, and profile readback", async () => {
    const { result, plan } = pendingCareerChoice();
    const profile = savePathwayProfile({
      state: "Kerala",
      district: "Ernakulam",
      city: "Kochi",
      educationBoard: "CBSE",
      studyLanguage: "English",
      locationPreference: "Near home",
      affordability: "We can consider moderate fees",
      scholarshipInterest: "Maybe, show me what is available",
    });
    mocks.get.mockResolvedValue({
      assessment: {
        answers: {
          definitionId: result.definitionId,
          schemaVersion: result.version,
          stage: result.stage,
        },
      },
    });
    mocks.getDirectionFromApi.mockResolvedValue(plan);
    mocks.patch.mockResolvedValue({ pathwayProfile: profile });

    await expect(savePendingDiscoveryToAccount("learner-1")).resolves.toBe(true);

    expect(mocks.saveAssessment).not.toHaveBeenCalled();
    expect(mocks.patch).toHaveBeenCalledWith(
      "/me",
      expect.objectContaining({ pathwayProfile: profile }),
    );
    expect(mocks.getDirectionFromApi).toHaveBeenCalledTimes(2);
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(loadDiscoveryResult()?.syncStatus).toBe("synced");
  });
});

function pendingCareerChoice(): { result: ReturnType<typeof buildDiscoveryResult>; plan: DirectionPlan } {
  const result = buildDiscoveryResult("grade8", "en", {
    activityCuriosity: ["buildDigital", "makeRepair"],
    activityExperience: ["problemSolving", "handsOn"],
    strengthConfidence: ["understand", "make", "coordinate"],
    strengthEvidence: ["project", "practice"],
    weaknessPattern: ["improve"],
    groupProjectStyle: "plan",
    newProblemStyle: "facts",
    socialEnergy: "balanced",
    setbackStyle: "retry",
    workValues: ["mastery", "build", "security"],
    familyInfluence: "preferred",
    familyPriorities: ["security", "interest"],
    familyExposure: ["technology"],
    experienceLevel: "some",
    grade8Exposure: ["school", "online"],
  });
  const direction = result.areas[0];
  const plan = setDreamCareers(
    createAreaDirectionPlan(direction.id),
    direction.roleIds.slice(0, 3),
  );
  saveDiscoveryResult(result);
  saveDirectionPlan(plan);
  return { result, plan };
}
