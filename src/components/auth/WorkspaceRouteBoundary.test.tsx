import { render, screen, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspaceRouteBoundary from "@/components/auth/WorkspaceRouteBoundary";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useOrganizationWorkspace: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/context/OrganizationContext", () => ({ useOrganizationWorkspace: mocks.useOrganizationWorkspace }));

describe("workspace route boundary", () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    vi.mocked(useRouter).mockReturnValue({ replace: mocks.replace } as unknown as ReturnType<typeof useRouter>);
    mocks.useAuth.mockReturnValue({ user: { uid: "educator-1" } });
  });

  it("redirects staff away from learner-only assessment routes", async () => {
    vi.mocked(usePathname).mockReturnValue("/assessment");
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: true, loading: false });
    render(<WorkspaceRouteBoundary><div>Learner assessment</div></WorkspaceRouteBoundary>);
    expect(screen.queryByText("Learner assessment")).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/organization"));
  });

  it("redirects the generic profile to the educator profile", async () => {
    vi.mocked(usePathname).mockReturnValue("/profile");
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: true, loading: false });
    render(<WorkspaceRouteBoundary><div>Learner profile</div></WorkspaceRouteBoundary>);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/organization/profile"));
  });

  it("keeps learner routes available to learner accounts", () => {
    vi.mocked(usePathname).mockReturnValue("/assessment");
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false });
    render(<WorkspaceRouteBoundary><div>Learner assessment</div></WorkspaceRouteBoundary>);
    expect(screen.getByText("Learner assessment")).toBeInTheDocument();
  });

  it("fails closed when workspace role verification fails", () => {
    vi.mocked(usePathname).mockReturnValue("/profile");
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false, error: new Error("offline"), refresh: vi.fn() });
    render(<WorkspaceRouteBoundary><div>Learner profile</div></WorkspaceRouteBoundary>);
    expect(screen.queryByText("Learner profile")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workspace access could not be verified" })).toBeInTheDocument();
  });

  it("keeps the public Explorer open when workspace verification fails", () => {
    vi.mocked(usePathname).mockReturnValue("/explore");
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false, error: new Error("offline") });
    render(<WorkspaceRouteBoundary><div>Public career map</div></WorkspaceRouteBoundary>);
    expect(screen.getByText("Public career map")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
