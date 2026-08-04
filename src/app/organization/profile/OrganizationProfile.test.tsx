import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EducatorProfilePage from "@/app/organization/profile/page";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useOrganizationWorkspace: vi.fn(),
  getOrganizationStaffProfile: vi.fn(),
  getOrganizationUnits: vi.fn(),
  listOrganizationWorkspaces: vi.fn(),
  updateOrganizationStaffProfile: vi.fn(),
  selectOrganizationWorkspace: vi.fn(),
  leaveOrganization: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/context/OrganizationContext", () => ({ useOrganizationWorkspace: mocks.useOrganizationWorkspace }));
vi.mock("@/components/Header", () => ({ default: () => <header>Xtara</header> }));
vi.mock("@/lib/organization", () => ({
  getOrganizationStaffProfile: mocks.getOrganizationStaffProfile,
  getOrganizationUnits: mocks.getOrganizationUnits,
  listOrganizationWorkspaces: mocks.listOrganizationWorkspaces,
  updateOrganizationStaffProfile: mocks.updateOrganizationStaffProfile,
  selectOrganizationWorkspace: mocks.selectOrganizationWorkspace,
  leaveOrganization: mocks.leaveOrganization,
}));

describe("educator profile", () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({
      user: { uid: "educator-1", email: "teacher@example.edu", displayName: "Meera Teacher" },
      userProfile: { fullName: "Meera Teacher", displayName: "Meera" },
      loading: false,
    });
    mocks.useOrganizationWorkspace.mockReturnValue({
      context: { organization: { name: "Horizon School" } },
      isStaff: true,
      loading: false,
      refresh: vi.fn(),
    });
    mocks.getOrganizationStaffProfile.mockResolvedValue({
      membershipId: "school-1_educator-1",
      role: "educator",
      unitIds: ["class-9a"],
      organization: { id: "school-1", name: "Horizon School" },
      profile: { title: "Class teacher", department: "Student guidance", phone: "", bio: "" },
    });
    mocks.getOrganizationUnits.mockResolvedValue([{ id: "class-9a", name: "Class 9A", organizationId: "school-1", kind: "class" }]);
    mocks.listOrganizationWorkspaces.mockResolvedValue([]);
  });

  it("shows professional and institution details instead of learner assessment fields", async () => {
    render(<EducatorProfilePage />);
    expect(await screen.findByRole("heading", { name: "My educator profile" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Class teacher")).toBeInTheDocument();
    expect(screen.getByText("Class 9A")).toBeInTheDocument();
    expect(screen.queryByText("My assessment")).not.toBeInTheDocument();
    expect(screen.queryByText("School & study")).not.toBeInTheDocument();
  });
});
