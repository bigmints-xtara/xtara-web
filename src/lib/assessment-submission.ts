/** Only learner answers and request context cross the write boundary. Results are server-derived. */
export function assessmentSubmission(data: Record<string, unknown>): Record<string, unknown> {
  return { definitionId: data.definitionId, version: data.version ?? data.schemaVersion,
    stage: data.stage, locale: data.locale, answers: data.answers,
    ...(data.pathwayProfile ? { pathwayProfile: data.pathwayProfile } : {}) };
}
