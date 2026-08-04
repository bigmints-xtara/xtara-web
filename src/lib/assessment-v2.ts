import en from "@/content/assessment-v2.en.json";
import hi from "@/content/assessment-v2.hi.json";
import ml from "@/content/assessment-v2.ml.json";
import ta from "@/content/assessment-v2.ta.json";
import type { Locale } from "@/i18n/config";
import {
  aggregateScoreChannels,
  getAssessmentQuestions,
  type AssessmentDefinition,
  type AssessmentOptionMetadata,
} from "@/modules/assessment";
import { getCareerRolesByArea } from "@/lib/career-knowledge";
import type { CareerAreaId } from "@/types/career-knowledge";
import type { AssessmentAnswers, AssessmentStage, Question } from "@/types/assessment";
import type { CuratedDreamCareer, FutureDirection } from "@/types/curated-career";

export const assessmentV2Version = "3.0.0";
export const assessmentV2StorageKey = "xtara_assessment_v2";
export const assessmentStageStorageKey = "xtara_assessment_stage_v1";

type AssessmentCatalog = typeof en;
type AreaId = keyof AssessmentCatalog["areas"];
type SignalId = keyof AssessmentCatalog["signals"];
type TraitId = keyof AssessmentCatalog["traits"];

interface CareerAssessmentMetadata extends AssessmentOptionMetadata {
  scores?: Record<string, number>;
}

const catalogs: Record<Locale, AssessmentCatalog> = {
  en,
  hi: hi as AssessmentCatalog,
  ml: ml as AssessmentCatalog,
  ta: ta as AssessmentCatalog,
};

const areaSignalMap: Record<AreaId, SignalId[]> = {
  technology: ["analysis", "making", "organizing"],
  health: ["care", "communication", "analysis"],
  science: ["analysis", "making"],
  business: ["organizing", "communication", "analysis"],
  design: ["creativeExpression", "communication", "making"],
  society: ["care", "communication", "organizing"],
};

export interface DiscoveryPatternSignal {
  id: SignalId;
  evidence: "noticed" | "repeated";
  evidenceRefs: EvidenceReference[];
}

export interface PersonalityTraitSignal {
  id: TraitId;
  evidenceRefs: EvidenceReference[];
}

export interface DiscoveryAreaSignal {
  id: string;
  evidence: "early" | "developing";
  evidenceRefs: EvidenceReference[];
  roleIds: string[];
  contentVersion?: number;
}

export interface EvidenceReference {
  questionId: string;
  optionId: string;
}

export interface DiscoveryContext {
  familyInfluence: string | null;
  familyPriorities: string[];
  weaknessPatterns: string[];
}

export interface DiscoveryResult {
  definitionId: "career-discovery";
  definitionDocumentId?: string;
  version: string;
  stage: AssessmentStage;
  locale?: Locale;
  createdAt: string;
  answers: AssessmentAnswers;
  signals: DiscoveryPatternSignal[];
  traits: PersonalityTraitSignal[];
  areas: DiscoveryAreaSignal[];
  context: DiscoveryContext;
  catalogSnapshot?: CuratedCareerCatalogSnapshot;
  evaluationSource?: "database" | "bundled_fallback" | "client_fallback";
  catalogSource?: "database" | "bundled_fallback" | "client_fallback";
  reflection?: "accurate" | "inaccurate" | "unsure" | "missing";
  syncStatus: "temporary" | "synced";
}

export interface CuratedCareerCatalogSnapshot {
  directions: FutureDirection[];
  roles: CuratedDreamCareer[];
}

export interface LocalizedDiscoverySignal extends DiscoveryPatternSignal {
  title: string;
  description: string;
  reasons: string[];
}

export interface LocalizedPersonalityTrait extends PersonalityTraitSignal {
  title: string;
  description: string;
}

export interface LocalizedDiscoveryArea extends DiscoveryAreaSignal {
  title: string;
  description: string;
  reasons: string[];
  roles: Array<{ id: string; title: string; summary: string }>;
}

export interface LocalizedDiscoveryResult extends DiscoveryResult {
  signals: LocalizedDiscoverySignal[];
  traits: LocalizedPersonalityTrait[];
  areas: LocalizedDiscoveryArea[];
  contextSummary: {
    family: string | null;
    weaknesses: string[];
  };
  nextActions: string[];
}

export function getDistinctAreaReasons(
  areas: ReadonlyArray<Pick<LocalizedDiscoveryArea, "id" | "reasons">>,
  limit = 2,
): Record<string, string[]> {
  const assigned = Object.fromEntries(areas.map((area) => [area.id, [] as string[]]));
  if (limit <= 0) return assigned;
  const used = new Set<string>();

  const addNextUnusedReason = (area: Pick<LocalizedDiscoveryArea, "id" | "reasons">) => {
    const reason = area.reasons.find((candidate) => {
      const key = candidate.trim().toLocaleLowerCase();
      return key && !used.has(key);
    });
    if (!reason) return false;
    assigned[area.id].push(reason);
    used.add(reason.trim().toLocaleLowerCase());
    return true;
  };

  // Give every direction one distinct reason before adding a second reason to any card.
  for (const area of areas) addNextUnusedReason(area);

  let addedReason = true;
  while (addedReason) {
    addedReason = false;
    for (const area of areas) {
      if (assigned[area.id].length >= limit) continue;
      if (addNextUnusedReason(area)) addedReason = true;
    }
  }

  return assigned;
}

export function getAssessmentV2Catalog(locale: Locale): AssessmentCatalog {
  return catalogs[locale] ?? catalogs.en;
}

export function getCareerAssessmentDefinition(
  locale: Locale,
): AssessmentDefinition<AssessmentStage, CareerAssessmentMetadata> {
  const catalog = getAssessmentV2Catalog(locale);
  return {
    id: "career-discovery",
    version: assessmentV2Version,
    contexts: ["grade8", "grade9", "grade10"],
    commonQuestions: catalog.questions as Question[],
    contextualQuestions: catalog.stageQuestions as Record<AssessmentStage, Question[]>,
  };
}

export function getAssessmentV2Questions(stage: AssessmentStage, locale: Locale): Question[] {
  return getAssessmentQuestions(getCareerAssessmentDefinition(locale), stage) as Question[];
}

export function getAssessmentStageQuestion(locale: Locale): Question {
  const copy = getAssessmentV2Catalog(locale).ui.gradeQuestion;
  return {
    id: "currentGrade",
    fieldType: "singleSelect",
    label: copy.label,
    description: copy.description,
    validation: { required: true },
    options: (["grade8", "grade9", "grade10"] as const).map((id) => ({ id, label: copy.options[id] })),
  };
}

export function parseOptionalAssessmentStage(value: string | null | undefined): AssessmentStage | null {
  return value === "grade8" || value === "grade9" || value === "grade10" ? value : null;
}

export function parseAssessmentStage(value: string | null): AssessmentStage {
  return parseOptionalAssessmentStage(value) ?? "grade8";
}

export function buildDiscoveryResult(
  stage: AssessmentStage,
  locale: Locale,
  answers: AssessmentAnswers,
  curatedCatalog?: CuratedCareerCatalogSnapshot,
): DiscoveryResult {
  const catalog = getAssessmentV2Catalog(locale);
  const questions = getAssessmentV2Questions(stage, locale);
  const channels = aggregateScoreChannels(questions, answers);

  const signals = (Object.keys(catalog.signals) as SignalId[])
    .map((id) => {
      const channel = channels.get(`signal:${id}`) ?? { score: 0, evidenceRefs: [] };
      const evidenceRefs = dedupeEvidenceRefs(channel.evidenceRefs);
      return { id, score: channel.score, evidenceRefs };
    })
    .filter((signal) => signal.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, 4)
    .map(({ id, score, evidenceRefs }) => ({
      id,
      evidence: score >= 4 && uniqueQuestionCount(evidenceRefs) >= 2 ? "repeated" as const : "noticed" as const,
      evidenceRefs: evidenceRefs.slice(0, 3),
    }));

  const traits = (Object.keys(catalog.traits) as TraitId[])
    .map((id) => {
      const channel = channels.get(`trait:${id}`) ?? { score: 0, evidenceRefs: [] };
      return { id, score: channel.score, evidenceRefs: dedupeEvidenceRefs(channel.evidenceRefs) };
    })
    .filter((trait) => trait.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, 3)
    .map(({ id, evidenceRefs }) => ({ id, evidenceRefs: evidenceRefs.slice(0, 2) }));

  const experience = answers.experienceLevel;
  const staticAreas = (Object.keys(areaSignalMap) as AreaId[])
    .map((id) => {
      const compatible = new Set(areaSignalMap[id]);
      const contributingSignals = signals.filter((signal) => compatible.has(signal.id));
      const balancedRefs = [
        ...contributingSignals.flatMap((signal) => signal.evidenceRefs.slice(0, 1)),
        ...contributingSignals.flatMap((signal) => signal.evidenceRefs.slice(1)),
      ];
      const evidenceRefs = dedupeEvidenceRefs(balancedRefs);
      const score = areaSignalMap[id].reduce(
        (total, signalId) => total + (channels.get(`signal:${signalId}`)?.score ?? 0),
        0,
      );
      return { id, score, evidenceRefs, sourceCount: uniqueQuestionCount(evidenceRefs) };
    })
    .filter((area) => area.sourceCount >= 2)
    .sort((left, right) => right.score - left.score || right.sourceCount - left.sourceCount || left.id.localeCompare(right.id))
    .slice(0, 3)
    .map(({ id, evidenceRefs, sourceCount }) => ({
      id,
      evidence: sourceCount >= 3 && experience !== "new" ? "developing" as const : "early" as const,
      evidenceRefs: evidenceRefs.slice(0, 3),
      roleIds: getCareerRolesByArea("en", id as CareerAreaId).slice(0, 4).map((role) => role.id),
    }));
  const areas = curatedCatalog?.directions.length
    ? buildCuratedAreas(curatedCatalog, channels, experience)
    : staticAreas;

  return {
    definitionId: "career-discovery",
    version: assessmentV2Version,
    stage,
    locale,
    createdAt: new Date().toISOString(),
    answers,
    signals,
    traits,
    areas,
    context: {
      familyInfluence: typeof answers.familyInfluence === "string" ? answers.familyInfluence : null,
      familyPriorities: Array.isArray(answers.familyPriorities) ? answers.familyPriorities : [],
      weaknessPatterns: Array.isArray(answers.weaknessPattern) ? answers.weaknessPattern : [],
    },
    ...(curatedCatalog?.directions.length ? { catalogSnapshot: curatedCatalog } : {}),
    evaluationSource: "client_fallback",
    catalogSource: "client_fallback",
    syncStatus: "temporary",
  };
}

export function localizeDiscoveryResult(result: DiscoveryResult, locale: Locale): LocalizedDiscoveryResult {
  const catalog = getAssessmentV2Catalog(locale);
  const questions = getAssessmentV2Questions(result.stage, locale);

  return {
    ...result,
    signals: result.signals.map((signal) => ({
      ...signal,
      title: catalog.signals[signal.id].title,
      description: catalog.signals[signal.id].description,
      reasons: localizeEvidenceReasons(signal.evidenceRefs, questions),
    })),
    traits: result.traits.map((trait) => ({
      ...trait,
      title: catalog.traits[trait.id].title,
      description: catalog.traits[trait.id].description,
    })),
    areas: result.areas.map((area) => {
      const curatedDirection = result.catalogSnapshot?.directions.find((direction) => direction.id === area.id);
      const curatedCopy = curatedDirection?.translations[locale] || curatedDirection?.translations.en;
      const fallbackArea = catalog.areas[area.id as AreaId];
      const curatedRoles = result.catalogSnapshot?.roles
        .filter((role) => area.roleIds.includes(role.id))
        .map((role) => {
          const copy = role.translations[locale] || role.translations.en;
          return { id: role.id, title: copy.title, summary: copy.summary };
        });
      const roles = curatedRoles?.length ? curatedRoles : getCareerRolesByArea(locale, area.id as CareerAreaId)
        .filter((role) => area.roleIds.includes(role.id))
        .map((role) => ({ id: role.id, title: role.title, summary: role.summary }));
      return {
        ...area,
        // Known direction IDs use the plain learner copy even when an older
        // published catalog snapshot still contains internal naming.
        title: fallbackArea?.title || curatedCopy?.title || area.id,
        description: fallbackArea?.description || curatedCopy?.summary || "",
        reasons: localizeEvidenceReasons(area.evidenceRefs, questions),
        roles,
      };
    }),
    contextSummary: {
      family: result.context.familyInfluence
        ? catalog.context.family[result.context.familyInfluence as keyof typeof catalog.context.family] ?? null
        : null,
      weaknesses: result.context.weaknessPatterns.flatMap((id) => {
        const summary = catalog.context.weakness[id as keyof typeof catalog.context.weakness];
        return summary ? [summary] : [];
      }),
    },
    nextActions: getCuratedNextActions(result, locale) || catalog.nextActions[result.stage],
  };
}

function buildCuratedAreas(
  curatedCatalog: CuratedCareerCatalogSnapshot,
  channels: Map<string, { score: number; evidenceRefs: EvidenceReference[] }>,
  experience: AssessmentAnswers[string],
): DiscoveryAreaSignal[] {
  const availableRoleIds = new Set(curatedCatalog.roles.map((role) => role.id));
  return curatedCatalog.directions
    .filter((direction) => direction.status === "published" || direction.published)
    .map((direction) => {
      let score = 0;
      let signalCount = 0;
      const evidenceRefs: EvidenceReference[] = [];
      for (const [signalId, weight] of Object.entries(direction.signalWeights)) {
        const channel = channels.get(`signal:${signalId}`);
        if ((channel?.score || 0) > 0) signalCount += 1;
        score += (channel?.score || 0) * weight;
        evidenceRefs.push(...(channel?.evidenceRefs || []));
      }
      const uniqueEvidence = dedupeEvidenceRefs(evidenceRefs);
      return {
        direction,
        score,
        signalCount,
        evidenceRefs: uniqueEvidence,
        sourceCount: uniqueQuestionCount(uniqueEvidence),
      };
    })
    .filter(({ direction, score, signalCount, sourceCount }) => (
      sourceCount >= direction.minimumEvidence.distinctQuestions
      && signalCount >= direction.minimumEvidence.distinctSignals
      && score >= direction.minimumEvidence.totalScore
    ))
    .sort((left, right) => right.score - left.score
      || right.sourceCount - left.sourceCount
      || left.direction.displayOrder - right.direction.displayOrder)
    .slice(0, 3)
    .map(({ direction, evidenceRefs, sourceCount }) => ({
      id: direction.id,
      evidence: sourceCount >= 3 && experience !== "new" ? "developing" as const : "early" as const,
      evidenceRefs: evidenceRefs.slice(0, 3),
      roleIds: direction.roleIds.filter((roleId) => availableRoleIds.has(roleId)).slice(0, 4),
      contentVersion: direction.version,
    }));
}

function getCuratedNextActions(result: DiscoveryResult, locale: Locale): string[] | null {
  if (!result.catalogSnapshot) return null;
  const actions = result.areas.flatMap((area) => {
    const direction = result.catalogSnapshot?.directions.find((candidate) => candidate.id === area.id);
    return direction?.gradeGuidance[locale]?.[result.stage]
      || direction?.gradeGuidance.en[result.stage]
      || [];
  });
  const unique = [...new Set(actions)];
  return unique.length ? unique.slice(0, 4) : null;
}

export function updateDiscoveryReflection(
  result: DiscoveryResult,
  reflection: NonNullable<DiscoveryResult["reflection"]>,
): DiscoveryResult {
  return { ...result, reflection };
}

export function saveDiscoveryResult(result: DiscoveryResult): void {
  localStorage.setItem(assessmentV2StorageKey, JSON.stringify(result));
  window.dispatchEvent(new Event("xtara:assessment-result-changed"));
}

export function loadDiscoveryResult(): DiscoveryResult | null {
  return parseDiscoveryResult(localStorage.getItem(assessmentV2StorageKey));
}

export function parseDiscoveryResult(raw: string | null): DiscoveryResult | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as DiscoveryResult & { locale?: Locale };
    if (
      value.definitionId === "career-discovery"
      && typeof value.version === "string"
      && (value.stage === "grade8" || value.stage === "grade9" || value.stage === "grade10")
      && value.answers
      && Array.isArray(value.signals)
      && Array.isArray(value.traits)
      && Array.isArray(value.areas)
    ) return value;

    if (
      (value.version === "2.0.0" || value.version === "2.1.0")
      && (value.stage === "grade8" || value.stage === "grade9" || value.stage === "grade10")
      && value.answers
    ) {
      const migrated = buildDiscoveryResult(value.stage, value.locale ?? "en", value.answers);
      return { ...migrated, createdAt: value.createdAt ?? migrated.createdAt };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAssessmentDraft(stage: AssessmentStage, answers: AssessmentAnswers): void {
  localStorage.setItem(getAssessmentDraftStorageKey(stage), JSON.stringify(answers));
}

export function loadAssessmentDraft(stage: AssessmentStage): AssessmentAnswers {
  return parseAssessmentDraft(localStorage.getItem(getAssessmentDraftStorageKey(stage)));
}

export function getAssessmentDraftStorageKey(stage: AssessmentStage): string {
  return `${assessmentV2StorageKey}:draft:${assessmentV2Version}:${stage}`;
}

export function parseAssessmentDraft(raw: string | null): AssessmentAnswers {
  try {
    return raw ? JSON.parse(raw) as AssessmentAnswers : {};
  } catch {
    return {};
  }
}

export function clearAssessmentDraft(stage: AssessmentStage): void {
  localStorage.removeItem(getAssessmentDraftStorageKey(stage));
}

function localizeEvidenceReasons(references: EvidenceReference[], questions: Question[]): string[] {
  return references.flatMap((reference) => {
    const question = questions.find((candidate) => candidate.id === reference.questionId);
    const option = question?.options?.find((candidate) => candidate.id === reference.optionId);
    return option ? [option.label] : [];
  });
}

function dedupeEvidenceRefs(references: EvidenceReference[]): EvidenceReference[] {
  return references.filter((reference, index) => references.findIndex((candidate) => (
    candidate.questionId === reference.questionId && candidate.optionId === reference.optionId
  )) === index);
}

function uniqueQuestionCount(references: EvidenceReference[]): number {
  return new Set(references.map((reference) => reference.questionId)).size;
}
