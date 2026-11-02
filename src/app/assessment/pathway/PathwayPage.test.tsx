import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PathwayPersonalizationPage from "@/app/assessment/pathway/page";
import { buildDiscoveryResult, saveDiscoveryResult } from "@/lib/assessment-v2";
import { createAreaDirectionPlan, loadDirectionPlan, saveDirectionPlan, setDreamCareers } from "@/lib/direction";
import { hydrateDiscoveryFromAccount, savePendingDiscoveryToAccount } from "@/lib/discovery-save";
import { loadPathwayProfile, savePathwayProfile } from "@/lib/pathway-profile";
import { LanguageProvider } from "@/i18n/language-provider";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "learner-1", isAnonymous: false } }),
}));

vi.mock("@/lib/discovery-save", () => ({
  savePendingDiscoveryToAccount: vi.fn(),
  hydrateDiscoveryFromAccount: vi.fn(),
}));

vi.mock("@/lib/firebase/location", () => ({
  getStates: vi.fn().mockResolvedValue(["Kerala"]),
  getStateDetails: vi.fn().mockResolvedValue({
    districts: ["Ernakulam"],
    cities: ["Kochi"],
    unavailable: false,
  }),
}));

vi.mock("@/components/Header", () => ({
  default: () => <div data-testid="header" />,
}));

describe("pathway account continuation", () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  };

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
    localStorage.clear();
    vi.mocked(useRouter).mockReturnValue({ push: mocks.push } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(savePendingDiscoveryToAccount).mockResolvedValue(true);

    const result = buildDiscoveryResult("grade8", "en", {
      activityCuriosity: ["buildDigital", "makeRepair"],
      activityExperience: ["problemSolving", "handsOn"],
      strengthConfidence: ["understand", "make", "coordinate"],
      strengthEvidence: ["project", "practice"],
      weaknessPattern: ["improve"],
      groupProjectStyle: "plan",
      newProblemStyle: "facts",
      socialEnergy: "balanced",
      setbackStyle: "retry",
      workValues: ["mastery", "build", "security"],
      familyInfluence: "preferred",
      familyPriorities: ["security", "interest"],
      familyExposure: ["technology"],
      experienceLevel: "some",
      grade8Exposure: ["school", "online"],
    });
    const direction = result.areas[0];
    saveDiscoveryResult(result);
    saveDirectionPlan(setDreamCareers(
      createAreaDirectionPlan(direction.id),
      direction.roleIds.slice(0, 3),
    ));
    savePathwayProfile({
      state: "Kerala",
      district: "Ernakulam",
      city: "Kochi",
      educationBoard: "CBSE",
      studyLanguage: "English",
      locationPreference: "Near home",
      affordability: "We can consider moderate fees",
      scholarshipInterest: "Maybe, show me what is available",
    });
    vi.mocked(hydrateDiscoveryFromAccount).mockResolvedValue({ assessment: result, directionPlan: loadDirectionPlan(), pathwayProfile: loadPathwayProfile() });
  });

  it('does not render cached pathway details when the account API fails', async () => {
    vi.mocked(hydrateDiscoveryFromAccount).mockRejectedValue(new Error('offline'));
    render(<LanguageProvider initialLocale="en"><PathwayPersonalizationPage /></LanguageProvider>);
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Save and continue' })).toBeNull();
    expect(screen.queryByDisplayValue('Kochi')).toBeNull();
  });

  it("saves and reads back location before opening Dashboard", async () => {
    render(
      <LanguageProvider initialLocale="en">
        <PathwayPersonalizationPage />
      </LanguageProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Save and continue" }));

    await waitFor(() => {
      expect(savePendingDiscoveryToAccount).toHaveBeenCalledWith("learner-1");
      expect(mocks.push).toHaveBeenCalledWith("/dashboard");
    });
  });
});
