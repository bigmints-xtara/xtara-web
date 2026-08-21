import { xtaraApi } from "@/lib/api/client";

export type WeeklyCommitmentKind = "sparks" | "games" | "challenges" | "reads";

export type WeeklyCommitmentInput = {
  kind: WeeklyCommitmentKind;
  target: number;
};

export type WeeklyPlanCommitment = WeeklyCommitmentInput & {
  completed: number;
  done: boolean;
};

export type WeeklyPlan = {
  version: "1.0.0";
  configured: boolean;
  weekStart: string;
  weekEnd: string;
  commitments: WeeklyPlanCommitment[];
  suggestions: WeeklyCommitmentInput[];
  completed: number;
  total: number;
};

export async function getWeeklyPlan(): Promise<WeeklyPlan> {
  return xtaraApi.get<WeeklyPlan>("/me/weekly-plan");
}

export async function saveWeeklyPlan(
  commitments: WeeklyCommitmentInput[],
): Promise<WeeklyPlan> {
  if (commitments.length < 1 || commitments.length > 3) {
    throw new Error("Choose one to three weekly commitments.");
  }
  if (new Set(commitments.map((item) => item.kind)).size !== commitments.length) {
    throw new Error("Each weekly commitment must be unique.");
  }
  const plan = await xtaraApi.put<WeeklyPlan>("/me/weekly-plan", { commitments });
  const requested = commitments.map(({ kind, target }) => ({ kind, target }));
  const readback = plan.commitments.map(({ kind, target }) => ({ kind, target }));
  if (JSON.stringify(readback) !== JSON.stringify(requested)) {
    throw new Error("The saved weekly plan was not returned by account readback.");
  }
  return plan;
}
