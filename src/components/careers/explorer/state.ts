import type { CareerExplorerResponse } from "@/types/career-explorer";
export type ExploreStep =
  | "directions"
  | "industries"
  | "roles"
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
  const d = data.directions.find((d) => d.id === state.direction);
  if (!d) {
    state.direction = null;
    state.industry = null;
  }
  const i = data.industries.find(
    (i) => i.id === state.industry && d?.industryIds.includes(i.id),
  );
  if (!i) state.industry = null;
  const career = data.careers.find(
    (c) =>
      c.id === state.career &&
      (i ? i.careerIds.includes(c.id) : d ? d.careerIds.includes(c.id) : true),
  );
  if (!career) state.career = null;
  if (career && !state.direction)
    state.direction =
      data.directions.find((d) => d.careerIds.includes(career.id))?.id ?? null;
  if (career)
    state.step =
      p.get("step") === "study"
        ? "study"
        : p.get("step") === "related"
          ? "related"
          : "work";
  else if (i || p.get("step") === "roles" || state.q) state.step = "roles";
  else if (state.direction) state.step = "industries";
  return state;
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
  if (s.industry || (s.direction && s.step === "roles"))
    return { ...s, industry: null, career: null, step: "industries", q: "" };
  return { ...initialExploreState, view: s.view };
}
