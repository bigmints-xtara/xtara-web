import { reconcileDiscoveryCacheOwner } from "./discovery-cache-owner";
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
  hydrateDiscoveryFromAccount,
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
  evaluateAssessment: vi.fn(),
  getDefinition: vi.fn(),
  owner: "learner-1",
}));

vi.mock("@/lib/assessment-api", () => ({ evaluateAssessmentOnServer: mocks.evaluateAssessment, getActiveAssessmentDefinition: mocks.getDefinition }));

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
      uid: mocks.owner,
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
    mocks.owner = "learner-1";
    mocks.getDefinition.mockImplementation(async (stage: string, locale: string) => ({ id: "career-discovery", stage, locale, version: "3.1.0" }));
    mocks.getIdToken.mockResolvedValue("token");
    mocks.createApiSession.mockResolvedValue(undefined);
    mocks.saveAssessment.mockResolvedValue("assessment-1");
    mocks.patch.mockResolvedValue({ id: "learner-1" });
  });

  it('does not replace API failure with browser-cached account data', async () => {
    pendingCareerChoice();
    const before = localStorage.getItem(assessmentV2StorageKey);
    mocks.get.mockRejectedValue(new Error('API unavailable'));
    mocks.getDirectionFromApi.mockResolvedValue(null);
    await expect(hydrateDiscoveryFromAccount()).rejects.toThrow('API unavailable');
    expect(localStorage.getItem(assessmentV2StorageKey)).toBe(before);
  });

  it('hydrates an incomplete pathway from the account without stale browser profile', async () => {
    const { result, plan } = pendingCareerChoice();
    mocks.getDirectionFromApi.mockResolvedValue(plan);
    mocks.get.mockImplementation(async (path: string) => path === '/me' ? {} : {
      assessment: { answers: { definitionId: result.definitionId, schemaVersion: result.version, stage: result.stage, answers: result.answers, result } },
    });
    const hydrated = await hydrateDiscoveryFromAccount();
    expect(hydrated?.directionPlan?.areaId).toBe(plan.areaId);
    expect(hydrated?.pathwayProfile).toBeNull();
  });

  it('clears stale browser discovery for an account with no saved assessment', async () => {
    pendingCareerChoice();
    mocks.get.mockResolvedValue({});
    mocks.getDirectionFromApi.mockResolvedValue(null);
    expect(await hydrateDiscoveryFromAccount()).toBeNull();
    expect(localStorage.getItem(assessmentV2StorageKey)).toBeNull();
    expect(localStorage.getItem('xtara_anonymous_discovery_backup_v1')).not.toBeNull();
    reconcileDiscoveryCacheOwner(null);
    expect(localStorage.getItem(assessmentV2StorageKey)).not.toBeNull();
    expect(localStorage.getItem('xtara_anonymous_discovery_backup_v1')).toBeNull();
  });

  it.each(["grade11", "grade12"] as const)("hydrates a saved %s without downgrading it", async (stage) => {
    const { result, plan } = pendingCareerChoice();
    const profile = savePathwayProfile({
      state: "Kerala", district: "Ernakulam", city: "Kochi", educationBoard: "CBSE",
      studyLanguage: "English", locationPreference: "Near home",
      affordability: "We can consider moderate fees", scholarshipInterest: "Maybe, show me what is available",
    });
    const remote = { ...result, version: "3.1.1", stage, answers: { ...result.answers, currentGrade: stage } };
    mocks.getDirectionFromApi.mockResolvedValue(plan);
    mocks.get.mockImplementation(async (path: string) => path === "/me" ? { pathwayProfile: profile } : {
      assessment: { id: "assessment-1", answers: { definitionId: remote.definitionId, schemaVersion: "3.1.1", stage,
        answers: remote.answers, result: remote, pathwayProfile: profile } },
    });
    const hydrated = await hydrateDiscoveryFromAccount();
    expect(hydrated?.assessment.stage).toBe(stage);
    expect(hydrated?.assessment.version).toBe("3.1.1");
    expect(loadDiscoveryResult()?.stage).toBe(stage);
  });

  it("persists assessment and career choice before any location profile exists", async () => {
    const { result, plan } = pendingCareerChoice();
    mocks.saveDirectionToApi.mockResolvedValue(plan);
    mocks.get.mockResolvedValue({
      gradeStage: "grade8",
      assessment: { id: "assessment-1",
        answers: {
          definitionId: result.definitionId,
          schemaVersion: result.version, locale: result.locale, answers: result.answers,
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
      { expectedUserId: "learner-1" },
    );
    expect(mocks.saveDirectionToApi).toHaveBeenCalledWith(plan, "learner-1");
    expect(mocks.get).toHaveBeenCalledWith("/assessment/latest", { expectedUserId: "learner-1" });
    expect(mocks.createApiSession).toHaveBeenCalledWith("token");
    const originalId = mocks.saveAssessment.mock.calls[0][3];
    expect(originalId).toMatch(/^discovery:/);
    await expect(savePendingCareerChoiceToAccount("learner-1")).resolves.toBe(true);
    expect(mocks.saveAssessment.mock.calls[1][3]).toBe(originalId);
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

  it("upgrades a pending 3.0 result before verifying 3.1 account readback", async () => {
    const { result, plan } = pendingCareerChoice();
    saveDiscoveryResult({ ...result, version: "3.0.0" });
    mocks.evaluateAssessment.mockResolvedValue(result);
    mocks.saveDirectionToApi.mockResolvedValue(plan);
    mocks.get.mockResolvedValue({ gradeStage: "grade8", assessment: { id: "assessment-1", answers: {
      definitionId: result.definitionId, schemaVersion: "3.1.0", stage: result.stage, locale: result.locale, answers: result.answers,
    } } });
    await expect(savePendingCareerChoiceToAccount("learner-1")).resolves.toBe(true);
    expect(mocks.evaluateAssessment).toHaveBeenCalledWith(expect.objectContaining({ version: "3.1.0", stage: "grade8" }));
    expect(mocks.saveAssessment).toHaveBeenCalledWith("learner-1", expect.objectContaining({ version: "3.1.0" }), false, expect.stringMatching(/^discovery:.*:grade8:en:3\.1\.0$/));
    expect(loadDiscoveryResult()).toMatchObject({ version: "3.1.0", syncStatus: "synced" });
  });

  it("preserves the old pending result if server re-evaluation fails", async () => {
    const { result } = pendingCareerChoice();
    saveDiscoveryResult({ ...result, version: "3.0.0" });
    mocks.evaluateAssessment.mockRejectedValue(new Error("offline"));
    await expect(savePendingCareerChoiceToAccount("learner-1")).rejects.toThrow("offline");
    expect(loadDiscoveryResult()).toMatchObject({ version: "3.0.0", syncStatus: "temporary" });
    expect(mocks.saveAssessment).not.toHaveBeenCalled();
  });

  it.each(["identity", "created ID", "answers", "account", "grade"])("keeps pending answers on %s mismatch", async (mismatch) => {
    const { result, plan } = pendingCareerChoice();
    mocks.saveDirectionToApi.mockResolvedValue(plan);
    if (mismatch === "identity") mocks.getDefinition.mockResolvedValue({ id: "wrong", stage: result.stage, locale: result.locale, version: result.version });
    mocks.get.mockImplementation(async () => {
      if (mismatch === "account") mocks.owner = "learner-2";
      return { gradeStage: mismatch === "grade" ? "grade12" : "grade8", assessment: { id: mismatch === "created ID" ? "another" : "assessment-1", answers: {
        definitionId: result.definitionId, schemaVersion: result.version, stage: result.stage,
        locale: result.locale, answers: mismatch === "answers" ? {} : result.answers,
      } } };
    });
    await expect(savePendingCareerChoiceToAccount("learner-1")).rejects.toThrow();
    expect(loadDiscoveryResult()).toMatchObject({ syncStatus: "temporary", answers: result.answers });
    if (mismatch === "identity") expect(mocks.saveAssessment).not.toHaveBeenCalled();
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
    mocks.get.mockImplementation(async (path: string) => path === "/me" ? { pathwayProfile: profile } : ({
      assessment: { id: "assessment-1",
        answers: {
          definitionId: result.definitionId,
          schemaVersion: result.version, locale: result.locale, answers: result.answers,
          stage: result.stage,
        },
      },
    }));
    mocks.getDirectionFromApi.mockResolvedValue(plan);
    mocks.patch.mockResolvedValue({ pathwayProfile: profile });

    await expect(savePendingDiscoveryToAccount("learner-1")).resolves.toBe(true);

    expect(mocks.saveAssessment).not.toHaveBeenCalled();
    expect(mocks.patch).toHaveBeenCalledWith(
      "/me",
      expect.objectContaining({ pathwayProfile: profile }),
      { expectedUserId: "learner-1" },
    );
    expect(mocks.getDirectionFromApi).toHaveBeenCalledTimes(2);
    expect(mocks.get).toHaveBeenCalledTimes(3);
    expect(loadDiscoveryResult()?.syncStatus).toBe("synced");
    expect(localStorage.getItem("xtara_discovery_cache_owner_v1")).toBe("learner-1");
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
