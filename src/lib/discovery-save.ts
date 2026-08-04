import { xtaraApi } from "@/lib/api/client";
import { createApiSession } from "@/lib/api/auth";
import {
  assessmentV2StorageKey,
  parseDiscoveryResult,
  saveDiscoveryResult,
} from "@/lib/assessment-v2";
import { saveAssessment } from "@/lib/firebase/assessment";
import {
  buildDiscoverySaveBundle,
  parsePathwayProfile,
  pathwayProfileStorageKey,
  type DiscoverySaveBundle,
} from "@/lib/pathway-profile";
import type { DiscoveryResult } from "@/lib/assessment-v2";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  getDirectionSnapshot,
  parseDirectionPlan,
  saveDirectionPlan,
} from "@/lib/direction";
import { getDirectionFromApi, saveDirectionToApi } from "@/lib/direction-api";
import { isDirectionPlanCompatible } from "@/lib/exploration-access";

export async function savePendingDiscoveryToAccount(userId: string): Promise<boolean> {
  const assessment = parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
  const pathwayProfile = parsePathwayProfile(localStorage.getItem(pathwayProfileStorageKey));
  const directionPlan = parseDirectionPlan(getDirectionSnapshot());
  const bundle = buildDiscoverySaveBundle(assessment, pathwayProfile, directionPlan);
  if (!bundle || !isDirectionPlanCompatible(bundle.assessment, bundle.directionPlan)) return false;

  await ensureApiSession(userId);

  await saveAssessment(userId, {
    schemaVersion: bundle.assessment.version,
    definitionId: bundle.assessment.definitionId,
    stage: bundle.assessment.stage,
    answers: bundle.assessment.answers,
    result: {
      signals: bundle.assessment.signals,
      traits: bundle.assessment.traits,
      areas: bundle.assessment.areas,
      context: bundle.assessment.context,
      reflection: bundle.assessment.reflection,
      catalogSnapshot: bundle.assessment.catalogSnapshot,
      definitionDocumentId: bundle.assessment.definitionDocumentId,
      evaluationSource: bundle.assessment.evaluationSource,
      catalogSource: bundle.assessment.catalogSource,
    },
    pathwayProfile: bundle.pathwayProfile,
    resultType: "future_directions",
    completedAt: bundle.assessment.createdAt,
  });

  await xtaraApi.patch("/me", {
    gradeStage: bundle.assessment.stage,
    pathwayProfile: bundle.pathwayProfile,
    discoverySummary: {
      assessmentVersion: bundle.assessment.version,
      areaIds: bundle.assessment.areas.map((area) => area.id),
      signalIds: bundle.assessment.signals.map((signal) => signal.id),
      traitIds: bundle.assessment.traits.map((trait) => trait.id),
      pursuedAreaId: bundle.directionPlan.areaId,
      selectedDreamCareerIds: bundle.directionPlan.dreamCareerIds,
    },
  });

  const savedDirection = await saveDirectionToApi(bundle.directionPlan);

  saveDiscoveryResult({ ...bundle.assessment, syncStatus: "synced" });
  saveDirectionPlan(savedDirection);
  return true;
}

export async function savePendingAssessmentToAccount(userId: string): Promise<boolean> {
  const assessment = parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
  if (!assessment) return false;
  await ensureApiSession(userId);
  await saveAssessment(userId, {
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
    resultType: "exploration_map",
    completedAt: assessment.createdAt,
  });
  saveDiscoveryResult({ ...assessment, syncStatus: "synced" });
  return true;
}

async function ensureApiSession(userId: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || user.uid !== userId) {
    throw new Error("Your sign-in session is no longer available. Please sign in again.");
  }

  await createApiSession(await user.getIdToken());
}

export async function hydrateDiscoveryFromAccount(): Promise<DiscoverySaveBundle | null> {
  const [response, remoteDirection] = await Promise.all([
    xtaraApi.get<{ assessment?: { answers?: Record<string, unknown> } }>("/assessment/latest").catch(() => ({ assessment: undefined })),
    getDirectionFromApi().catch(() => null),
  ]);
  const saved = response.assessment?.answers;
  const resultData = saved?.result as Partial<DiscoveryResult> | undefined;
  const pathwayProfile = parsePathwayProfile(JSON.stringify(saved?.pathwayProfile ?? null));
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
