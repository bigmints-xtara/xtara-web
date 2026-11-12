import { markDiscoveryCacheOwner, preserveAnonymousDiscoveryDraft } from "@/lib/discovery-cache-owner";
import { xtaraApi } from "@/lib/api/client";
import { createApiSession } from "@/lib/api/auth";
import { evaluateAssessmentOnServer, getActiveAssessmentDefinition } from "@/lib/assessment-api";
import {
  assessmentV2StorageKey,
  parseDiscoveryResult,
  parseOptionalAssessmentStage,
  saveDiscoveryResult,
  type DiscoveryResult,
} from "@/lib/assessment-v2";
import { saveAssessment } from "@/lib/firebase/assessment";
import {
  buildDiscoverySaveBundle,
  parsePathwayProfile,
  pathwayProfileStorageKey,
  type PathwayProfile,
} from "@/lib/pathway-profile";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  directionStorageKey,
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
  type DirectionPlan,
} from "@/lib/direction";
import { getDirectionFromApi, getDirectionOverview, saveDirectionToApi } from "@/lib/direction-api";
import { isDirectionPlanCompatible } from "@/lib/exploration-access";
import type { Locale } from "@/i18n/config";

type LatestAssessmentResponse = {
  assessment?: { id?: string; answers?: Record<string, unknown> };
};

type UserProfileResponse = {
  pathwayProfile?: unknown;
  gradeStage?: unknown;
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

  bundle.assessment = await currentAssessment(bundle.assessment);
  if (!isDirectionPlanCompatible(bundle.assessment, bundle.directionPlan)) {
    throw new Error("Please review your career choices against your updated assessment.");
  }
  const [latestBeforeSave, directionBeforeSave] = await Promise.all([
    getLatestAssessment(userId).catch(() => null),
    getDirectionFromApi(userId),
  ]);
  if (
    !assessmentMatches(latestBeforeSave, bundle.assessment)
    || !directionMatches(directionBeforeSave, bundle.directionPlan)
  ) {
    await persistCareerChoice(userId, bundle.assessment, bundle.directionPlan, false);
  }

  await xtaraApi.patch<UserProfileResponse>("/me", {
    gradeStage: bundle.assessment.stage,
    pathwayProfile: bundle.pathwayProfile,
  }, { expectedUserId: userId });
  const profileResponse = await xtaraApi.get<UserProfileResponse>("/me", { expectedUserId: userId });
  const savedProfile = parsePathwayProfile(JSON.stringify(profileResponse.pathwayProfile ?? null));

  const [latestAssessment, savedDirection] = await Promise.all([
    getLatestAssessment(userId),
    getDirectionFromApi(userId),
  ]);
  if (
    !profileMatches(savedProfile, bundle.pathwayProfile)
    || !assessmentMatches(latestAssessment, bundle.assessment)
    || !directionMatches(savedDirection, bundle.directionPlan)
  ) {
    throw new Error("Your Career Path was not returned by account readback.");
  }

  assertOwner(userId);
  markDiscoveryCacheOwner(userId);
  saveDiscoveryResult({ ...bundle.assessment, syncStatus: "synced" });
  saveDirectionPlan(savedDirection!);
  return true;
}

export async function savePendingAssessmentToAccount(userId: string): Promise<boolean> {
  let assessment = parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
  if (!assessment) return false;
  await ensureApiSession(userId);
  assessment = await currentAssessment(assessment);
  const assessmentId = await saveAssessment(userId, assessmentAnswers(assessment), false, discoverySubmissionId(assessment));
  const latest = await getLatestAssessment(userId, assessmentId);
  if (!assessmentMatches(latest, assessment)) {
    throw new Error("Your assessment was not returned by account readback.");
  }
  assertOwner(userId);
  markDiscoveryCacheOwner(userId);
  saveDiscoveryResult({ ...assessment, syncStatus: "synced" });
  return true;
}

async function persistCareerChoice(
  userId: string,
  assessment: DiscoveryResult,
  directionPlan: DirectionPlan,
  markSynced = true,
): Promise<void> {
  assessment = await currentAssessment(assessment);
  if (!isDirectionPlanCompatible(assessment, directionPlan)) {
    throw new Error("Please review your career choices against your updated assessment.");
  }
  const assessmentId = await saveAssessment(userId, assessmentAnswers(assessment), false, discoverySubmissionId(assessment));
  await xtaraApi.patch("/me", {
    gradeStage: assessment.stage,
  }, { expectedUserId: userId });
  const gradeProfile = await xtaraApi.get<UserProfileResponse>("/me", { expectedUserId: userId });
  if (gradeProfile.gradeStage !== assessment.stage) throw new Error("Your grade was not returned by account readback.");
  const savedDirection = await saveDirectionToApi(directionPlan, userId);
  const latestAssessment = await getLatestAssessment(userId, assessmentId);
  if (!assessmentMatches(latestAssessment, assessment)) {
    throw new Error("Your assessment was not returned by account readback.");
  }
  assertOwner(userId);
  if (markSynced) {
    markDiscoveryCacheOwner(userId);
    saveDiscoveryResult({ ...assessment, syncStatus: "synced" });
    saveDirectionPlan(savedDirection);
  }
}

async function currentAssessment(assessment: DiscoveryResult): Promise<DiscoveryResult> {
  const definition = await getActiveAssessmentDefinition(assessment.stage, assessment.locale ?? "en");
  if (definition.id !== assessment.definitionId || definition.stage !== assessment.stage || definition.locale !== (assessment.locale ?? 'en')) throw new Error('The active assessment definition did not match your request.');
  if (assessment.version === definition.version) return assessment;
  const current = await evaluateAssessmentOnServer({
    definitionId: assessment.definitionId,
    version: definition.version,
    stage: assessment.stage,
    locale: assessment.locale ?? "en",
    answers: assessment.answers,
  });
  if (current.version !== definition.version || current.stage !== assessment.stage || current.locale !== (assessment.locale ?? "en") || current.definitionId !== assessment.definitionId) {
    throw new Error("Your updated assessment was not returned by the server.");
  }
  return { ...current, createdAt: assessment.createdAt, reflection: assessment.reflection };
}

function discoverySubmissionId(assessment: DiscoveryResult): string | undefined {
  const attempt = assessment.createdAt;
  // Legacy local results may not contain an API timestamp.
  if (!/^[0-9T:.Z-]{12,40}$/.test(attempt)) return undefined;
  return `discovery:${attempt}:${assessment.stage}:${assessment.locale ?? 'en'}:${assessment.version}`;
}
function assessmentAnswers(assessment: DiscoveryResult): Record<string, unknown> {
  return { definitionId: assessment.definitionId, version: assessment.version,
    stage: assessment.stage, locale: assessment.locale ?? 'en', answers: assessment.answers };
}

async function getLatestAssessment(userId: string, assessmentId?: string): Promise<Record<string, unknown> | null> {
  const response = await xtaraApi.get<LatestAssessmentResponse>("/assessment/latest", { expectedUserId: userId });
  if (assessmentId && response.assessment?.id !== assessmentId) throw new Error('Your created assessment was not returned by account readback.');
  return response.assessment?.answers ?? null;
}

function assessmentMatches(
  saved: Record<string, unknown> | null,
  expected: DiscoveryResult,
): boolean {
  return saved?.definitionId === expected.definitionId
    && saved.schemaVersion === expected.version
    && saved.stage === expected.stage
    && saved.locale === (expected.locale ?? 'en')
    && stableJson(saved.answers) === stableJson(expected.answers);
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
  const token = await user.getIdToken();
  assertOwner(userId);
  await createApiSession(token);
  assertOwner(userId);
}

function assertOwner(userId: string): void {
  if (getFirebaseAuth().currentUser?.uid !== userId) throw new Error('Your sign-in account changed. Please retry from your own account.');
}

export async function hydrateDirectionDashboard(locale: Locale, userId: string) {
  const readback = await getDirectionOverview(locale, userId);
  try {
    await hydrateDiscoveryFromAccount({ userId, direction: readback.direction });
  } catch (error) {
    // The saved overview is still useful when assessment or profile data is unavailable.
    if (!readback.overview) throw error;
  }
  assertOwner(userId);
  return readback.overview;
}

export async function hydrateDiscoveryFromAccount(
  readback?: { userId: string; direction: DirectionPlan | null },
): Promise<{ assessment: DiscoveryResult; pathwayProfile: PathwayProfile | null; directionPlan: DirectionPlan | null } | null> {
  const userId = getFirebaseAuth().currentUser?.uid;
  if (!userId) return null;
  const [response, remoteDirection, userProfile] = await Promise.all([
    xtaraApi.get<LatestAssessmentResponse>("/assessment/latest", { expectedUserId: userId }),
    readback?.userId === userId ? readback.direction : getDirectionFromApi(userId),
    xtaraApi.get<UserProfileResponse>("/me", { expectedUserId: userId }),
  ]);
  assertOwner(userId);
  preserveAnonymousDiscoveryDraft();
  if (!response.assessment) {
    for (const key of [assessmentV2StorageKey, directionStorageKey, pathwayProfileStorageKey]) localStorage.removeItem(key);
    window.dispatchEvent(new Event('xtara:assessment-result-changed'));
    window.dispatchEvent(new Event('xtara:direction-changed'));
    return null;
  }
  const saved = response.assessment?.answers;
  const resultData = saved?.result as Partial<DiscoveryResult> | undefined;
  const pathwayProfile = parsePathwayProfile(
    JSON.stringify(userProfile.pathwayProfile ?? saved?.pathwayProfile ?? null),
  );
  const directionPlan = parseDirectionPlan(remoteDirection ? JSON.stringify(remoteDirection) : null);
  if (
    saved?.definitionId !== "career-discovery"
    || (typeof saved.schemaVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(saved.schemaVersion))
    || !resultData?.signals
    || !resultData.traits
    || !resultData.areas
    || !resultData.context
  ) throw new Error("Your saved assessment could not be loaded. Please retry.");

  const savedStage = parseOptionalAssessmentStage(typeof saved.stage === "string" ? saved.stage : null);
  if (!savedStage) throw new Error("Your saved assessment grade is invalid. Please retry.");
  const assessment: DiscoveryResult = {
    definitionId: "career-discovery",
    version: String(saved.schemaVersion),
    stage: savedStage,
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
  assertOwner(userId);
  markDiscoveryCacheOwner(userId);
  saveDiscoveryResult(assessment);
  if (pathwayProfile) localStorage.setItem(pathwayProfileStorageKey, JSON.stringify(pathwayProfile));
  else localStorage.removeItem(pathwayProfileStorageKey);
  window.dispatchEvent(new Event("xtara:pathway-profile-changed"));
  const validDirection = directionPlan && isDirectionPlanCompatible(assessment, directionPlan) ? directionPlan : null;
  if (validDirection) saveDirectionPlan(validDirection);
  else {
    localStorage.removeItem(directionStorageKey);
    window.dispatchEvent(new Event('xtara:direction-changed'));
  }
  return { assessment, pathwayProfile, directionPlan: validDirection };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => stableJson(item)));
  if (value && typeof value === 'object') return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableJson(item)]));
  return JSON.stringify(value);
}
