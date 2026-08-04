import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationDashboardPage from "@/app/organization/page";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getOrganizationContext: vi.fn(),
  getOrganizationDashboard: vi.fn(),
  getOrganizationUnits: vi.fn(),
  createOrganizationInvitation: vi.fn(),
  createOrganizationUnit: vi.fn(),
  removeOrganizationMember: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/components/Header", () => ({ default: () => <header>Xtara</header> }));
vi.mock("@/lib/organization", () => ({
  getOrganizationContext: mocks.getOrganizationContext,
  getOrganizationDashboard: mocks.getOrganizationDashboard,
  getOrganizationUnits: mocks.getOrganizationUnits,
  createOrganizationInvitation: mocks.createOrganizationInvitation,
  createOrganizationUnit: mocks.createOrganizationUnit,
  removeOrganizationMember: mocks.removeOrganizationMember,
}));

const organization = {
  id: "school-1",
  name: "Horizon Public School",
  slug: "horizon-public-school",
  kind: "school",
  status: "active",
  accessStartsAt: "2026-07-01T00:00:00.000Z",
  accessEndsAt: "2026-08-01T00:00:00.000Z",
  graceEndsAt: "2026-08-08T00:00:00.000Z",
  academicYear: "2026-27",
};

const dashboard = {
  organization,
  role: "owner",
  unitIds: [],
  effectiveStatus: "active",
  summary: { activeStudents: 1, assessmentCompleted: 1, awaitingAssessment: 0, activeConsent: 1, followUpNeeded: 1 },
  cohortInsights: [],
  privacyThreshold: 5,
  students: [{
    id: "school-1_student-1",
    userId: "student-1",
    role: "student",
    unitIds: ["class-9a"],
    displayName: "Asha Student",
    consentStatus: "active",
    assessmentStatus: "completed",
    assessmentSummary: { stage: "grade9", areas: [], signals: [] },
    directionProgress: null,
  }],
};

describe("organization dashboard role views", () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ user: { uid: "owner-1", isAnonymous: false }, loading: false });
    mocks.getOrganizationUnits.mockResolvedValue([{ id: "class-9a", organizationId: "school-1", name: "Class 9A", kind: "class" }]);
    mocks.getOrganizationDashboard.mockResolvedValue(dashboard);
  });

  it("shows institution-wide controls to an owner", async () => {
    mocks.getOrganizationContext.mockResolvedValue({
      organization,
      membership: { id: "school-1_owner-1", role: "owner", status: "active", unitIds: [] },
      effectiveStatus: "active",
      accessMode: "full",
      permissions: ["units.manage", "invitations.manage", "members.manage", "insights.read"],
    });
    render(<OrganizationDashboardPage />);
    expect(await screen.findByRole("heading", { name: "Horizon Public School" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Asha Student" })).toHaveAttribute("href", "/organization/students/school-1_student-1");
    expect(screen.getByText("Add a class or group")).toBeInTheDocument();
    expect(screen.getByText("Create an invitation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("uses the same dashboard without mutation controls for an educator", async () => {
    mocks.getOrganizationContext.mockResolvedValue({
      organization,
      membership: { id: "school-1_educator-1", role: "educator", status: "active", unitIds: ["class-9a"] },
      effectiveStatus: "active",
      accessMode: "full",
      permissions: ["units.read", "members.read", "insights.read"],
    });
    mocks.getOrganizationDashboard.mockResolvedValue({ ...dashboard, role: "educator", unitIds: ["class-9a"] });
    render(<OrganizationDashboardPage />);
    expect(await screen.findByRole("heading", { name: "Horizon Public School" })).toBeInTheDocument();
    expect(screen.getByText("Asha Student")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Create an invitation")).not.toBeInTheDocument());
    expect(screen.queryByText("Add a class or group")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
