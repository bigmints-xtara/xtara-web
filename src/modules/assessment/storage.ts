import type { AssessmentAnswers, AssessmentStorageAdapter } from "./types";

export function createBrowserAssessmentStorage(prefix: string): AssessmentStorageAdapter {
  return {
    get: (key) => localStorage.getItem(`${prefix}:${key}`),
    set: (key, value) => localStorage.setItem(`${prefix}:${key}`, value),
    remove: (key) => localStorage.removeItem(`${prefix}:${key}`),
  };
}

export function parseStoredAssessmentAnswers(raw: string | null): AssessmentAnswers {
  try {
    return raw ? JSON.parse(raw) as AssessmentAnswers : {};
  } catch {
    return {};
  }
}
