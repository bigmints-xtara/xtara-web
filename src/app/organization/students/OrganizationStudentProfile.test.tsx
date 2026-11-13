import { useRouter } from "next/navigation";
import { LanguageProvider } from "@/i18n/language-provider";
import { render as renderUI, fireEvent, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationStudentProfilePage from "@/app/organization/students/[membershipId]/page";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useOrganizationWorkspace: vi.fn(),
  getOrganizationStudentProfile: vi.fn(),
  getOrganizationUnits: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/context/OrganizationContext", () => ({ useOrganizationWorkspace: mocks.useOrganizationWorkspace }));
vi.mock("@/components/Header", () => ({ default: () => <header>Xtara</header> }));
vi.mock("@/lib/organization", () => ({
  getOrganizationStudentProfile: mocks.getOrganizationStudentProfile,
  getOrganizationUnits: mocks.getOrganizationUnits,
}));

describe("scoped learner guidance profile", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
    vi.mocked(useParams).mockReturnValue({ membershipId: "school-1_student-1" });
    mocks.useAuth.mockReturnValue({ user: { uid: "educator-1" }, loading: false });
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: true, loading: false });
    mocks.getOrganizationUnits.mockResolvedValue([{ id: "class-9a", name: "Class 9A", organizationId: "school-1", kind: "class" }]);
    mocks.getOrganizationStudentProfile.mockResolvedValue({
      id: "school-1_student-1",
      userId: "student-1",
      role: "student",
      unitIds: ["class-9a"],
      displayName: "Asha Student",
      consentStatus: "active",
      assessmentStatus: "completed",
      assessmentSummary: {
        stage: "grade9",
        areas: [{ id: "technology", title: "Technology" }],
        signals: [{ id: "problem-solving", title: "Problem solving" }],
      },
      directionProgress: { areaId: "technology", selectedCareerCount: 2, completedActions: 1, reviewOn: "2026-08-01T00:00:00.000Z" },
    });
  });

  it("recovers from learner load errors", async () => {
    mocks.getOrganizationStudentProfile.mockRejectedValueOnce(new Error("Learner unavailable"));
    render(<OrganizationStudentProfilePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Learner unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Asha Student" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to learners" })).toHaveAttribute("href", "/organization/learners");
  });

  it("shows only the learner guidance data shared with the educator", async () => {
    render(<OrganizationStudentProfilePage />);
    expect(await screen.findByRole("heading", { name: "Asha Student" })).toBeInTheDocument();
    expect(screen.getByText("Class 9A")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Problem solving")).toBeInTheDocument();
    expect(screen.getByText(/private answers and family context are not shown/i)).toBeInTheDocument();
  });
});

function render(ui: React.ReactNode) { return renderUI(<LanguageProvider initialLocale="en">{ui}</LanguageProvider>); }
