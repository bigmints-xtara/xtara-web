import { organizationProfileCopy } from "@/lib/organization-profile-copy";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LanguageProvider } from "@/i18n/language-provider";
import { render as renderUI, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EducatorProfilePage from "@/app/organization/profile/page";

const mocks = vi.hoisted(() => ({
  updatePersonalInfo: vi.fn(),
  apiGet: vi.fn(),
  firebaseUser: { uid: "educator-1" },
  useAuth: vi.fn(),
  useOrganizationWorkspace: vi.fn(),
  getOrganizationStaffProfile: vi.fn(),
  getOrganizationUnits: vi.fn(),
  listOrganizationWorkspaces: vi.fn(),
  updateOrganizationStaffProfile: vi.fn(),
  selectOrganizationWorkspace: vi.fn(),
  leaveOrganization: vi.fn(),
}));

vi.mock("@/lib/firebase/profile-service", () => ({ updatePersonalInfo: mocks.updatePersonalInfo }));
vi.mock("@/lib/api/client", () => ({ xtaraApi: { get: mocks.apiGet } }));
vi.mock("@/lib/firebase-client", () => ({ getFirebaseAuth: () => ({ currentUser: mocks.firebaseUser }) }));
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

let queryClient: QueryClient;
describe("educator profile", () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mocks.firebaseUser.uid = "educator-1";
    mocks.updatePersonalInfo.mockReset().mockResolvedValue(undefined);
    mocks.updateOrganizationStaffProfile.mockReset().mockResolvedValue(undefined);
    mocks.apiGet.mockReset();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() });
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
    mocks.useAuth.mockReturnValue({
      user: { uid: "educator-1", email: "teacher@example.edu", displayName: "Meera Teacher" },
      userProfile: { fullName: "Meera Teacher", displayName: "Meera" },
      loading: false,
    });
    mocks.useOrganizationWorkspace.mockReturnValue({
      context: { organization: { id: "school-1", name: "Horizon School" }, membership: { id: "school-1_educator-1" } },
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

  it("shows a failed load and retries instead of spinning forever", async () => {
    mocks.getOrganizationStaffProfile.mockRejectedValueOnce(new Error("Profile unavailable"));
    render(<EducatorProfilePage />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading workspace");
    expect(await screen.findByRole("alert")).toHaveTextContent("Profile unavailable");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "My profile" })).toBeInTheDocument();
  });

  it("keeps organization context errors recoverable", async () => {
    const refresh = vi.fn();
    mocks.useOrganizationWorkspace.mockReturnValue({ isStaff: false, loading: false, error: new Error("Workspace unavailable"), refresh });
    render(<EducatorProfilePage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Workspace unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(mocks.getOrganizationStaffProfile).not.toHaveBeenCalled();
  });

  it("verifies both saved records, updates cached names and keeps them on reopening", async () => {
    const account = { uid: "educator-1", fullName: "Meera Nair", displayName: "Meera" };
    const view = render(<EducatorProfilePage />);
    await screen.findByRole("heading", { name: "My profile" });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: " Meera Nair " } });
    fireEvent.change(screen.getByLabelText("Phone number (optional)"), { target: { value: "9876543210" } });
    mocks.updateOrganizationStaffProfile.mockImplementationOnce(async (details) => {
      mocks.getOrganizationStaffProfile.mockResolvedValue({
        membershipId: "school-1_educator-1", role: "educator", unitIds: ["class-9a"],
        organization: { id: "school-1", name: "Horizon School" }, profile: details,
      });
    });
    mocks.apiGet.mockResolvedValue(account);
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Your profile is saved.")).toBeInTheDocument();
    expect(mocks.updatePersonalInfo).toHaveBeenCalledWith("educator-1", { fullName: "Meera Nair", displayName: "Meera" });
    expect(mocks.updateOrganizationStaffProfile).toHaveBeenCalledWith(expect.objectContaining({ phone: "9876543210" }), "educator-1");
    expect(queryClient.getQueryData(["auth", "userProfile", "educator-1"])).toEqual(account);
    mocks.useAuth.mockReturnValue({ ...mocks.useAuth(), userProfile: queryClient.getQueryData(["auth", "userProfile", "educator-1"]) });
    view.unmount();
    render(<EducatorProfilePage />);
    expect(await screen.findByDisplayValue("Meera Nair")).toBeInTheDocument();
    expect(screen.getByDisplayValue("9876543210")).toBeInTheDocument();
  });

  it("does not claim success when the server reads back old school details", async () => {
    render(<EducatorProfilePage />);
    await screen.findByRole("heading", { name: "My profile" });
    fireEvent.change(screen.getByLabelText("Job title (optional)"), { target: { value: "Principal" } });
    mocks.apiGet.mockResolvedValue({ uid: "educator-1", fullName: "Meera Teacher", displayName: "Meera" });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not confirm");
    expect(screen.getByDisplayValue("Principal")).toBeInTheDocument();
    expect(screen.queryByText("Your profile is saved.")).not.toBeInTheDocument();
  });

  it("waits for both writes and preserves entries after a partial failure", async () => {
    let finish!: () => void;
    mocks.updatePersonalInfo.mockRejectedValueOnce(new Error("Could not save name"));
    mocks.updateOrganizationStaffProfile.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(<EducatorProfilePage />);
    await screen.findByRole("heading", { name: "My profile" });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Typed name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(mocks.updatePersonalInfo).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    finish();
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save name");
    expect(screen.getByDisplayValue("Typed name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save profile" })).toBeEnabled();
  });

  it("does not overwrite a typed name when the account cache refreshes", async () => {
    const view = render(<EducatorProfilePage />);
    await screen.findByRole("heading", { name: "My profile" });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Unsaved name" } });
    mocks.useAuth.mockReturnValue({ ...mocks.useAuth(), userProfile: { fullName: "Cached name" } });
    view.rerender(<QueryClientProvider client={queryClient}><LanguageProvider initialLocale="en"><EducatorProfilePage /></LanguageProvider></QueryClientProvider>);
    expect(screen.getByDisplayValue("Unsaved name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Professional bio")).not.toBeInTheDocument();
    expect(screen.getByText("More about you (optional)")).toBeInTheDocument();
  });

  it.each(["en", "ml", "hi", "ta"] as const)("uses clear profile fields in %s", async (locale) => {
    const copy = organizationProfileCopy[locale];
    renderUI(<QueryClientProvider client={queryClient}><LanguageProvider initialLocale={locale}><EducatorProfilePage /></LanguageProvider></QueryClientProvider>);
    expect(await screen.findByRole("heading", { name: copy.heading })).toBeInTheDocument();
    expect(screen.getByLabelText(copy.fullName)).toBeInTheDocument();
    expect(screen.getByLabelText(copy.title)).toBeInTheDocument();
    expect(screen.getByLabelText(copy.phone)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.save })).toBeInTheDocument();
  });

  it("shows professional and institution details instead of learner assessment fields", async () => {
    render(<EducatorProfilePage />);
    expect(await screen.findByRole("heading", { name: "My profile" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Class teacher")).toBeInTheDocument();
    expect(screen.getByText("Class 9A")).toBeInTheDocument();
    expect(screen.queryByText("My assessment")).not.toBeInTheDocument();
    expect(screen.queryByText("School & study")).not.toBeInTheDocument();
  });
});

function render(ui: React.ReactNode) { return renderUI(<QueryClientProvider client={queryClient}><LanguageProvider initialLocale="en">{ui}</LanguageProvider></QueryClientProvider>); }
