import { xtaraApi } from "@/lib/api/client";
import { createApiSession } from "@/lib/api/auth";
import {
  assessmentV2StorageKey,
  parseDiscoveryResult,
  saveDiscoveryResult,
  type DiscoveryResult,
} from "@/lib/assessment-v2";
import { saveAssessment } from "@/lib/firebase/assessment";
import {
  buildDiscoverySaveBundle,
  parsePathwayProfile,
  pathwayProfileStorageKey,
  type DiscoverySaveBundle,
  type PathwayProfile,
} from "@/lib/pathway-profile";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  type DirectionPlan,
} from "@/lib/direction";
import { getDirectionFromApi, saveDirectionToApi } from "@/lib/direction-api";
import { isDirectionPlanCompatible } from "@/lib/exploration-access";

type LatestAssessmentResponse = {
  assessment?: { answers?: Record<string, unknown> };
};

type UserProfileResponse = {
  pathwayProfile?: unknown;
};

export async function savePendingCareerChoiceToAccount(userId: string): Promise<boolean> {
  const assessment = parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
  const directionPlan = parseDirectionPlan(getDirectionSnapshot());
  if (
    !assessment
    || !directionPlan
    || directionPlan.dreamCareerIds.length === 0
    || !isDirectionPlanCompatible(assessment, directionPlan)
  ) return false;

  await ensureApiSession(userId);
  await persistCareerChoice(userId, assessment, directionPlan);
  return true;
}

export async function savePendingDiscoveryToAccount(userId: string): Promise<boolean> {
  const assessment = parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
  const pathwayProfile = parsePathwayProfile(localStorage.getItem(pathwayProfileStorageKey));
  const directionPlan = parseDirectionPlan(getDirectionSnapshot());
  const bundle = buildDiscoverySaveBundle(assessment, pathwayProfile, directionPlan);
  if (!bundle || !isDirectionPlanCompatible(bundle.assessment, bundle.directionPlan)) return false;

  await ensureApiSession(userId);

  const [latestBeforeSave, directionBeforeSave] = await Promise.all([
    getLatestAssessment().catch(() => null),
    getDirectionFromApi().catch(() => null),
  ]);
  if (
    !assessmentMatches(latestBeforeSave, bundle.assessment)
    || !directionMatches(directionBeforeSave, bundle.directionPlan)
  ) {
    await persistCareerChoice(userId, bundle.assessment, bundle.directionPlan);
  }

  const profileResponse = await xtaraApi.patch<UserProfileResponse>("/me", {
    gradeStage: bundle.assessment.stage,
    pathwayProfile: bundle.pathwayProfile,
    discoverySummary: discoverySummary(bundle.assessment, bundle.directionPlan),
  });
  const savedProfile = parsePathwayProfile(JSON.stringify(profileResponse.pathwayProfile ?? null));

  const [latestAssessment, savedDirection] = await Promise.all([
    getLatestAssessment(),
    getDirectionFromApi(),
  ]);
  if (
    !profileMatches(savedProfile, bundle.pathwayProfile)
    || !assessmentMatches(latestAssessment, bundle.assessment)
    || !directionMatches(savedDirection, bundle.directionPlan)
  ) {
    throw new Error("Your Career Path was not returned by account readback.");
  }

  saveDiscoveryResult({ ...bundle.assessment, syncStatus: "synced" });
  saveDirectionPlan(savedDirection!);
  return true;
}

export async function savePendingAssessmentToAccount(userId: string): Promise<boolean> {
  const assessment = parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
  if (!assessment) return false;
  await ensureApiSession(userId);
  await saveAssessment(userId, assessmentAnswers(assessment, "exploration_map"));
  const latest = await getLatestAssessment();
  if (!assessmentMatches(latest, assessment)) {
    throw new Error("Your assessment was not returned by account readback.");
  }
  saveDiscoveryResult({ ...assessment, syncStatus: "synced" });
  return true;
}

async function persistCareerChoice(
  userId: string,
  assessment: DiscoveryResult,
  directionPlan: DirectionPlan,
): Promise<void> {
  await saveAssessment(userId, assessmentAnswers(assessment, "future_directions"));
  await xtaraApi.patch("/me", {
    gradeStage: assessment.stage,
    discoverySummary: discoverySummary(assessment, directionPlan),
  });
  const savedDirection = await saveDirectionToApi(directionPlan);
  const latestAssessment = await getLatestAssessment();
  if (!assessmentMatches(latestAssessment, assessment)) {
    throw new Error("Your assessment was not returned by account readback.");
  }
  saveDiscoveryResult({ ...assessment, syncStatus: "synced" });
  saveDirectionPlan(savedDirection);
}

function assessmentAnswers(
  assessment: DiscoveryResult,
  resultType: "exploration_map" | "future_directions",
  pathwayProfile?: PathwayProfile,
): Record<string, unknown> {
  return {
    schemaVersion: assessment.version,
    definitionId: assessment.definitionId,
    stage: assessment.stage,
    locale: assessment.locale,
    answers: assessment.answers,
    result: {
      signals: assessment.signals,
      traits: assessment.traits,
      areas: assessment.areas,
      context: assessment.context,
      reflection: assessment.reflection,
      catalogSnapshot: assessment.catalogSnapshot,
      definitionDocumentId: assessment.definitionDocumentId,
      evaluationSource: assessment.evaluationSource,
      catalogSource: assessment.catalogSource,
    },
    ...(pathwayProfile ? { pathwayProfile } : {}),
    resultType,
    completedAt: assessment.createdAt,
  };
}

function discoverySummary(
  assessment: DiscoveryResult,
  directionPlan: DirectionPlan,
): Record<string, unknown> {
  return {
    assessmentVersion: assessment.version,
    areaIds: assessment.areas.map((area) => area.id),
    signalIds: assessment.signals.map((signal) => signal.id),
    traitIds: assessment.traits.map((trait) => trait.id),
    pursuedAreaId: directionPlan.areaId,
    selectedDreamCareerIds: directionPlan.dreamCareerIds,
  };
}

async function getLatestAssessment(): Promise<Record<string, unknown> | null> {
  const response = await xtaraApi.get<LatestAssessmentResponse>("/assessment/latest");
  return response.assessment?.answers ?? null;
}

function assessmentMatches(
  saved: Record<string, unknown> | null,
  expected: DiscoveryResult,
): boolean {
  return saved?.definitionId === expected.definitionId
    && saved.schemaVersion === expected.version
    && saved.stage === expected.stage;
}

function directionMatches(
  saved: DirectionPlan | null,
  expected: DirectionPlan,
): boolean {
  return saved?.areaId === expected.areaId
    && saved.dreamCareerIds.join("\u0000") === expected.dreamCareerIds.join("\u0000");
}

function profileMatches(
  saved: PathwayProfile | null,
  expected: PathwayProfile,
): boolean {
  if (!saved) return false;
  return (
    saved.state === expected.state
    && saved.district === expected.district
    && saved.city === expected.city
    && saved.educationBoard === expected.educationBoard
    && saved.studyLanguage === expected.studyLanguage
    && saved.locationPreference === expected.locationPreference
    && saved.affordability === expected.affordability
    && saved.scholarshipInterest === expected.scholarshipInterest
  );
}

async function ensureApiSession(userId: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || user.uid !== userId) {
    throw new Error("Your sign-in session is no longer available. Please sign in again.");
  }
  await createApiSession(await user.getIdToken());
}

export async function hydrateDiscoveryFromAccount(): Promise<DiscoverySaveBundle | null> {
  const [response, remoteDirection, userProfile] = await Promise.all([
    xtaraApi.get<LatestAssessmentResponse>("/assessment/latest").catch(() => ({ assessment: undefined })),
    getDirectionFromApi().catch(() => null),
    xtaraApi.get<UserProfileResponse>("/me").catch(() => ({} as UserProfileResponse)),
  ]);
  const saved = response.assessment?.answers;
  const resultData = saved?.result as Partial<DiscoveryResult> | undefined;
  const pathwayProfile = parsePathwayProfile(
    JSON.stringify(userProfile.pathwayProfile ?? saved?.pathwayProfile ?? null),
  );
  const directionPlan = parseDirectionPlan(remoteDirection ? JSON.stringify(remoteDirection) : null);
  if (
    saved?.definitionId !== "career-discovery"
    || saved.schemaVersion !== "3.0.0"
    || !resultData?.signals
    || !resultData.traits
    || !resultData.areas
    || !resultData.context
    || !pathwayProfile
  ) return null;

  const assessment: DiscoveryResult = {
    definitionId: "career-discovery",
    version: String(saved.schemaVersion),
    stage: saved.stage === "grade9" || saved.stage === "grade10" ? saved.stage : "grade8",
    locale: saved.locale === "ml" || saved.locale === "hi" || saved.locale === "ta" ? saved.locale : "en",
    createdAt: typeof saved.completedAt === "string" ? saved.completedAt : new Date().toISOString(),
    answers: typeof saved.answers === "object" && saved.answers ? saved.answers as DiscoveryResult["answers"] : {},
    signals: resultData.signals,
    traits: resultData.traits,
    areas: resultData.areas,
    context: resultData.context,
    reflection: resultData.reflection,
    catalogSnapshot: resultData.catalogSnapshot,
    definitionDocumentId: typeof saved.definitionDocumentId === "string" ? saved.definitionDocumentId : resultData.definitionDocumentId,
    evaluationSource: resultData.evaluationSource,
    catalogSource: resultData.catalogSource,
    syncStatus: "synced",
  };
  saveDiscoveryResult(assessment);
  localStorage.setItem(pathwayProfileStorageKey, JSON.stringify(pathwayProfile));
  window.dispatchEvent(new Event("xtara:pathway-profile-changed"));
  if (!directionPlan || !isDirectionPlanCompatible(assessment, directionPlan)) return null;
  saveDirectionPlan(directionPlan);
  return { assessment, pathwayProfile, directionPlan };
}
