export const directionStorageKey = "xtara_my_direction_v1";

export type DirectionActionId = "learn" | "try" | "discuss";

export interface DirectionPlan {
  version: "3.0.0";
  areaId: string;
  dreamCareerIds: string[];
  selectedAt: string;
  reviewOn: string;
  updatedAt: string;
  actions: Record<DirectionActionId, boolean>;
  savedDirections: Record<string, SavedCareerDirection>;
}

export interface SavedCareerDirection {
  dreamCareerIds: string[];
  selectedAt: string;
  reviewOn: string;
  updatedAt: string;
  actions: Record<DirectionActionId, boolean>;
}

function reviewDateFrom(date: Date): string {
  const review = new Date(date);
  review.setDate(review.getDate() + 14);
  return review.toISOString();
}

export function createAreaDirectionPlan(areaId: string, now = new Date()): DirectionPlan {
  const active: SavedCareerDirection = {
    dreamCareerIds: [],
    selectedAt: now.toISOString(),
    reviewOn: reviewDateFrom(now),
    updatedAt: now.toISOString(),
    actions: { learn: false, try: false, discuss: false },
  };
  return {
    version: "3.0.0",
    areaId,
    ...active,
    savedDirections: { [areaId]: active },
  };
}

export function createDirectionPlan(roleId: string, areaId: string, now = new Date()): DirectionPlan {
  return setDreamCareers(createAreaDirectionPlan(areaId, now), [roleId], now);
}

export function selectDirectionRole(
  plan: DirectionPlan,
  roleId: string,
  now = new Date(),
): DirectionPlan {
  return setDreamCareers(plan, [roleId], now);
}

export function setDreamCareers(
  plan: DirectionPlan,
  dreamCareerIds: string[],
  now = new Date(),
): DirectionPlan {
  const uniqueIds = [...new Set(dreamCareerIds.filter(Boolean))];
  if (uniqueIds.length > 3) throw new Error("Choose up to three Dream Careers.");
  const updatedAt = now.toISOString();
  const active = { ...snapshotActiveDirection(plan), dreamCareerIds: uniqueIds, updatedAt };
  return {
    ...plan,
    ...active,
    savedDirections: { ...plan.savedDirections, [plan.areaId]: active },
  };
}

export function switchCareerDirection(
  plan: DirectionPlan | null,
  areaId: string,
  now = new Date(),
): DirectionPlan {
  if (!plan) return createAreaDirectionPlan(areaId, now);
  const savedDirections = {
    ...plan.savedDirections,
    [plan.areaId]: snapshotActiveDirection(plan),
  };
  const existing = savedDirections[areaId];
  if (existing) return { ...plan, areaId, ...existing, savedDirections };
  const fresh = createAreaDirectionPlan(areaId, now);
  return { ...fresh, savedDirections: { ...savedDirections, [areaId]: snapshotActiveDirection(fresh) } };
}

export function toggleDreamCareer(
  plan: DirectionPlan,
  dreamCareerId: string,
  now = new Date(),
): DirectionPlan {
  const selected = plan.dreamCareerIds.includes(dreamCareerId);
  const next = selected
    ? plan.dreamCareerIds.filter((id) => id !== dreamCareerId)
    : [...plan.dreamCareerIds, dreamCareerId];
  return setDreamCareers(plan, next, now);
}

export function parseDirectionPlan(raw: string | null): DirectionPlan | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as Omit<Partial<DirectionPlan>, "version"> & { version?: string };
    if (
      (value.version !== "1.0.0" && value.version !== "2.0.0" && value.version !== "3.0.0")
      || typeof value.areaId !== "string"
      || !value.actions
    ) return null;
    const legacyRoleId = typeof (value as { roleId?: unknown }).roleId === "string"
      ? (value as { roleId: string }).roleId
      : null;
    const dreamCareerIds = Array.isArray((value as { dreamCareerIds?: unknown }).dreamCareerIds)
      ? (value as { dreamCareerIds: unknown[] }).dreamCareerIds.filter((id): id is string => typeof id === "string")
      : legacyRoleId ? [legacyRoleId] : [];
    if (dreamCareerIds.length > 3) return null;
    const selectedAt = typeof value.selectedAt === "string" ? value.selectedAt : new Date().toISOString();
    const reviewOn = typeof value.reviewOn === "string" ? value.reviewOn : reviewDateFrom(new Date(selectedAt));
    const updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : selectedAt;
    const actions = value.actions as Record<DirectionActionId, boolean>;
    const rawSavedDirections = (value as { savedDirections?: unknown }).savedDirections;
    const savedDirections = parseSavedDirections(rawSavedDirections) ?? {
      [value.areaId]: { dreamCareerIds: [...new Set(dreamCareerIds)], selectedAt, reviewOn, updatedAt, actions },
    };
    savedDirections[value.areaId] = {
      dreamCareerIds: [...new Set(dreamCareerIds)],
      selectedAt,
      reviewOn,
      updatedAt,
      actions,
    };
    return {
      ...value,
      version: "3.0.0",
      dreamCareerIds: [...new Set(dreamCareerIds)],
      selectedAt,
      reviewOn,
      updatedAt,
      actions,
      savedDirections,
    } as DirectionPlan;
  } catch {
    return null;
  }
}

export function saveDirectionPlan(plan: DirectionPlan): void {
  localStorage.setItem(directionStorageKey, JSON.stringify(plan));
  window.dispatchEvent(new Event("xtara:direction-changed"));
}

export function loadDirectionPlan(): DirectionPlan | null {
  return parseDirectionPlan(localStorage.getItem(directionStorageKey));
}

export function getDirectionSnapshot(): string | null {
  return localStorage.getItem(directionStorageKey);
}

export function subscribeToDirection(onStoreChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === directionStorageKey) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("xtara:direction-changed", onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("xtara:direction-changed", onStoreChange);
  };
}

export function toggleDirectionAction(
  plan: DirectionPlan,
  actionId: DirectionActionId,
  now = new Date(),
): DirectionPlan {
  return {
    ...plan,
    updatedAt: now.toISOString(),
    actions: { ...plan.actions, [actionId]: !plan.actions[actionId] },
    savedDirections: {
      ...plan.savedDirections,
      [plan.areaId]: {
        ...snapshotActiveDirection(plan),
        updatedAt: now.toISOString(),
        actions: { ...plan.actions, [actionId]: !plan.actions[actionId] },
      },
    },
  };
}

function snapshotActiveDirection(plan: DirectionPlan): SavedCareerDirection {
  return {
    dreamCareerIds: plan.dreamCareerIds,
    selectedAt: plan.selectedAt,
    reviewOn: plan.reviewOn,
    updatedAt: plan.updatedAt,
    actions: plan.actions,
  };
}

function parseSavedDirections(value: unknown): Record<string, SavedCareerDirection> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries: Array<[string, SavedCareerDirection]> = [];
  for (const [areaId, candidate] of Object.entries(value)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const item = candidate as Partial<SavedCareerDirection>;
    if (!Array.isArray(item.dreamCareerIds) || item.dreamCareerIds.length > 3 || !item.dreamCareerIds.every((id) => typeof id === "string")) return null;
    if (!item.actions || !(["learn", "try", "discuss"] as const).every((id) => typeof item.actions?.[id] === "boolean")) return null;
    if (![item.selectedAt, item.reviewOn, item.updatedAt].every((date) => typeof date === "string" && !Number.isNaN(Date.parse(date)))) return null;
    entries.push([areaId, item as SavedCareerDirection]);
  }
  return Object.fromEntries(entries);
}
