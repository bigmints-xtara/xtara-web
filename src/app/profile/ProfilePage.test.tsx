import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  section: null as string | null,
  replace: vi.fn(),
  push: vi.fn(),
  listOrganizations: vi.fn(),
  apiGet: vi.fn(),
  localPathway: vi.fn(),
  saveLocalPathway: vi.fn(),
  saveStudy: vi.fn(),
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
  loadPathwayProfile: mocks.localPathway,
  localizePathwayValue: (value: string) => value,
  savePathwayProfile: mocks.saveLocalPathway,
}));
vi.mock("@/lib/organization", () => ({
  listOrganizationWorkspaces: mocks.listOrganizations,
}));
vi.mock("@/lib/api/client", () => ({
  xtaraApi: { get: mocks.apiGet, put: mocks.apiPut },
}));
vi.mock("@/lib/firebase-client", () => ({ getFirebaseAuth: vi.fn() }));

import ProfilePage from "./page";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { updateLearnerProfile, updatePersonalInfo } from "@/lib/firebase/profile-service";
import { getStateDetails } from "@/lib/firebase/location";
const originalUser = structuredClone(mocks.authState.user);
const originalProfile = structuredClone(mocks.authState.userProfile);

describe("learner profile information architecture", () => {
  beforeEach(() => {
    mocks.authState.user = structuredClone(originalUser);
    vi.mocked(getFirebaseAuth).mockImplementation(() => ({ currentUser: mocks.authState.user }) as unknown as ReturnType<typeof getFirebaseAuth>);
    mocks.authState.userProfile = structuredClone(originalProfile);
    mocks.localPathway.mockReset(); mocks.saveLocalPathway.mockReset();
    vi.mocked(updateLearnerProfile).mockReset();
    vi.mocked(updatePersonalInfo).mockReset();
    mocks.section = null;
    mocks.replace.mockReset();
    mocks.push.mockReset();
    mocks.listOrganizations.mockReset().mockResolvedValue([]);
    mocks.apiGet.mockReset().mockResolvedValue({ preferences: {} });
    mocks.apiPut.mockReset().mockResolvedValue({ preferences: {} });
  });

  it("ignores a delayed personal-save completion after the account changes", async () => {
    mocks.section = "personal";
    let finish!: () => void;
    vi.mocked(updatePersonalInfo).mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const view = render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Old account delayed name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updatePersonalInfo).toHaveBeenCalled());
    mocks.authState.user = { ...originalUser, uid: "learner-2", displayName: "New learner" };
    mocks.authState.userProfile = { ...originalProfile, uid: "learner-2", fullName: "New learner", displayName: "New learner" };
    view.rerender(<ProfilePage />);
    finish();
    await waitFor(() => expect(screen.queryByText("Old account delayed name")).toBeNull());
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.getAllByText("New learner").length).toBeGreaterThan(0);
  });

  it("does not fill explicit empty account fields from another browser profile", () => {
    mocks.section = "academic";
    mocks.authState.userProfile.pathwayProfile.city = "";
    mocks.authState.userProfile.pathwayProfile.studyLanguage = "";
    mocks.localPathway.mockReturnValue({ ...originalProfile.pathwayProfile, city: "Stale browser city", studyLanguage: "Stale language" });
    render(<ProfilePage />);
    expect(screen.queryByText("Stale browser city")).toBeNull();
    expect(screen.queryByText("Stale language")).toBeNull();
    expect(mocks.localPathway).not.toHaveBeenCalled();
  });

  it("keeps typed missing-location details on failed save without publishing browser state", async () => {
    mocks.section = "academic";
    vi.mocked(getStateDetails).mockResolvedValueOnce({ districts: [], cities: [], unavailable: true });
    vi.mocked(updateLearnerProfile).mockRejectedValueOnce(new Error("offline"));
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const district = await screen.findByLabelText("District");
    await waitFor(() => expect(district).toBeEnabled());
    fireEvent.change(district, { target: { value: "My district" } });
    fireEvent.change(screen.getByLabelText("Nearest major city"), { target: { value: "My town" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText(/We could not save your changes/);
    expect(screen.getByLabelText("Nearest major city")).toHaveValue("My town");
    expect(mocks.saveLocalPathway).not.toHaveBeenCalled();
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("keeps only one profile editor active so another save cannot replace its draft", () => {
    render(<ProfilePage />);
    const edits = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(edits[0]);
    expect(edits[1]).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Unsaved learner name" } });
    expect(screen.getByLabelText("Full name")).toHaveValue("Unsaved learner name");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(edits[1]).toBeEnabled();
    fireEvent.click(edits[1]);
    expect(edits[0]).toBeDisabled();
  });

  it("releases the editor interlock when navigating between profile sections", () => {
    const view = render(<ProfilePage />);
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    mocks.section = "academic";
    view.rerender(<ProfilePage />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    mocks.section = "personal";
    view.rerender(<ProfilePage />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
  });

  it("shows personal and study details alongside profile destinations", () => {
    render(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "Personal details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "School & study" })).toBeInTheDocument();
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
