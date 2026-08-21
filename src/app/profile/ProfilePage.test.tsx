import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  section: null as string | null,
  replace: vi.fn(),
  push: vi.fn(),
  listOrganizations: vi.fn(),
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  authState: {
    loading: false,
    user: {
      uid: "learner-1",
      email: "learner@example.com",
      displayName: "Asha",
      emailVerified: true,
    },
    userProfile: {
      uid: "learner-1",
      email: "learner@example.com",
      fullName: "Asha Nair",
      displayName: "Asha",
      currentGrade: "grade8",
      gradeStage: "grade8",
      educationBoard: "CBSE",
      state: "Kerala",
      city: "Kochi",
      subjectsLearning: ["Mathematics", "Science"],
      pathwayProfile: {
        state: "Kerala",
        district: "Ernakulam",
        city: "Kochi",
        educationBoard: "CBSE",
        studyLanguage: "English",
        locationPreference: "Near home",
        affordability: "I am not sure yet",
        scholarshipInterest: "Maybe, show me what is available",
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
  useSearchParams: () => ({ get: () => mocks.section }),
}));
vi.mock("@/components/Header", () => ({ default: () => <header>Xtara</header> }));
vi.mock("@/components/LanguageSwitcher", () => ({ default: () => <button>Language</button> }));
vi.mock("@/components/profile/AcademicProgressSection", () => ({
  default: () => <section>Mark sheets and academic progress</section>,
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mocks.authState,
}));
vi.mock("@/i18n/language-provider", () => ({
  useTranslations: () => ({ locale: "en" }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/lib/firebase/location", () => ({
  getStates: vi.fn(async () => ["Kerala"]),
  getStateDetails: vi.fn(async () => ({
    districts: ["Ernakulam"],
    cities: ["Kochi"],
    unavailable: false,
  })),
}));
vi.mock("@/lib/firebase/profile-service", () => ({
  updateLearnerProfile: vi.fn(),
  updatePersonalInfo: vi.fn(),
}));
vi.mock("@/lib/academic-progress-api", () => ({
  defaultAcademicYear: () => "2026-27",
  saveAcademicPeriod: vi.fn(),
}));
vi.mock("@/lib/pathway-profile", () => ({
  emptyPathwayProfile: {
    state: "",
    district: "",
    city: "",
    educationBoard: "",
    studyLanguage: "",
    locationPreference: "",
    affordability: "",
    scholarshipInterest: "",
  },
  loadPathwayProfile: () => null,
  localizePathwayValue: (value: string) => value,
  savePathwayProfile: (value: unknown) => value,
}));
vi.mock("@/lib/organization", () => ({
  listOrganizationWorkspaces: mocks.listOrganizations,
}));
vi.mock("@/lib/api/client", () => ({
  xtaraApi: { get: mocks.apiGet, put: mocks.apiPut },
}));
vi.mock("@/lib/firebase-client", () => ({ getFirebaseAuth: vi.fn() }));

import ProfilePage from "./page";

describe("learner profile information architecture", () => {
  beforeEach(() => {
    mocks.section = null;
    mocks.replace.mockReset();
    mocks.push.mockReset();
    mocks.listOrganizations.mockReset().mockResolvedValue([]);
    mocks.apiGet.mockReset().mockResolvedValue({ preferences: {} });
    mocks.apiPut.mockReset().mockResolvedValue({ preferences: {} });
  });

  it("presents scalable profile destinations from one hub", () => {
    render(<ProfilePage />);

    expect(screen.getByRole("link", { name: /Personal profile/ })).toHaveAttribute(
      "href",
      "/profile?section=personal",
    );
    expect(screen.getByRole("link", { name: /Academic profile/ })).toHaveAttribute(
      "href",
      "/profile?section=academic",
    );
    expect(screen.getByRole("link", { name: /Institutions/ })).toHaveAttribute(
      "href",
      "/profile?section=institutions",
    );
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute(
      "href",
      "/profile?section=settings",
    );
  });

  it("groups school, class, academic year, subjects, location, and marks", async () => {
    mocks.section = "academic";
    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Academic profile" })).toBeInTheDocument();
    expect(screen.getByText("Mark sheets and academic progress")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));

    expect(await screen.findByText("Current class")).toBeInTheDocument();
    expect(screen.getByText("Academic year")).toBeInTheDocument();
    expect(screen.getByText("Current subjects")).toBeInTheDocument();
    expect(screen.getByText("Where are you open to studying?")).toBeInTheDocument();
  });

  it("keeps personal details and assessment results together", () => {
    mocks.section = "personal";
    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Personal profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personal details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assessment data" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assessment data" })).toHaveAttribute(
      "href",
      "/assessment/discovery",
    );
  });

  it("shows an honest institutions empty state", async () => {
    mocks.section = "institutions";
    render(<ProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText("No institution is connected to this account yet."),
      ).toBeInTheDocument();
    });
  });
});
