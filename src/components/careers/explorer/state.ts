import { resolveExplorerDirection } from '@/lib/career-direction-imagery';
import type { CareerExplorerResponse, ExplorerCareer } from "@/types/career-explorer";
export type ExploreStep =
  | "directions"
  | "industries"
  | "roles"
  | "specializations"
  | "pursuit"
  | "work"
  | "study"
  | "related";
export interface ExploreState {
  view: "map" | "cards";
  direction: string | null;
  industry: string | null;
  career: string | null;
  step: ExploreStep;
  q: string;
}
export const initialExploreState: ExploreState = {
  view: "map",
  direction: null,
  industry: null,
  career: null,
  step: "directions",
  q: "",
};
export function readExploreState(
  search: string,
  data?: CareerExplorerResponse,
): ExploreState {
  const p = new URLSearchParams(search);
  const state: ExploreState = {
    view: p.get("view") === "cards" ? "cards" : "map",
    direction: p.get("direction"),
    industry: p.get("industry"),
    career: p.get("career"),
    step: "directions",
    q: (p.get("q") || "").slice(0, 200),
  };
  if (!data) return { ...initialExploreState, view: state.view, q: state.q };
  const d = resolveExplorerDirection(data.directions, state.direction);
  state.direction = d?.id ?? null;
  if (!d) state.industry = null;
  const i = data.industries.find(
    (i) => i.id === state.industry && d?.industryIds.includes(i.id),
  );
  if (!i) state.industry = null;
  const selected = data.careers.find((c) => c.id === state.career);
  const ancestry = careerAncestry(selected, data.careers);
  const scope = i ?? d;
  const career = selected && (!scope || scope.careerIds.some((id) => ancestry.has(id)))
    ? selected
    : undefined;
  if (!career) state.career = null;
  if (career && !state.direction)
    state.direction =
      data.directions.find((d) => d.careerIds.some((id) => ancestry.has(id)))?.id ?? null;
  if (career)
    state.step =
      p.get("step") === "pursuit"
        ? "pursuit"
        : p.get("step") === "specializations" && career.specializationIds?.length
        ? "specializations"
        : p.get("step") === "study"
        ? "study"
        : p.get("step") === "related"
          ? "related"
          : "work";
  else if (d && p.get("step") === "industries" && data.industries.some((industry) => d.industryIds.includes(industry.id)))
    state.step = "industries";
  else if (i || d || p.get("step") === "roles" || state.q) state.step = "roles";
  return state;
}

function careerAncestry(career: ExplorerCareer | undefined, careers: ExplorerCareer[]) {
  const ids = new Set<string>();
  for (let current = career; current && !ids.has(current.id);) {
    ids.add(current.id);
    const parentId = current.parentCareerId;
    current = parentId ? careers.find((entry) => entry.id === parentId) : undefined;
  }
  return ids;
}
export function exploreUrl(state: ExploreState): string {
  const p = new URLSearchParams({ view: state.view });
  for (const key of ["direction", "industry", "career"] as const)
    if (state[key]) p.set(key, state[key]);
  if (state.step !== "directions") p.set("step", state.step);
  if (state.q) p.set("q", state.q);
  return `/explore?${p.toString()}`;
}
export function previousExploreState(s: ExploreState): ExploreState {
  if (s.step === "related") return { ...s, step: "study" };
  if (s.step === "study") return { ...s, step: "work" };
  if (s.career) return { ...s, career: null, step: "roles", q: "" };
  if (s.industry)
    return { ...s, industry: null, career: null, step: "industries", q: "" };
  if (s.step === "industries") return { ...s, step: "roles", q: "" };
  return { ...initialExploreState, view: s.view };
}
