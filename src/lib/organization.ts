import { xtaraApi } from "@/lib/api/client";

export type OrganizationRole = "owner" | "admin" | "unit_admin" | "educator" | "counselor" | "student";
export type OrganizationPermission =
  | "organization.read"
  | "organization.manage"
  | "lifecycle.read"
  | "units.read"
  | "units.manage"
  | "invitations.read"
  | "invitations.manage"
  | "members.read"
  | "members.manage"
  | "insights.read"
  | "student.participate";

export type OrganizationContext = {
  organization: {
    id: string;
    name: string;
    slug: string;
    kind: "school" | "college" | "university" | "educational_institution";
    status: string;
    accessStartsAt: string;
    accessEndsAt: string;
    graceEndsAt: string;
    academicYear?: string | null;
  };
  membership: {
    id: string;
    role: OrganizationRole;
    status: string;
    unitIds: string[];
  };
  effectiveStatus: "pending" | "active" | "grace" | "expired" | "suspended" | "archived";
  accessMode: "full" | "read_only" | "none";
  permissions: OrganizationPermission[];
};

export type OrganizationUnit = {
  id: string;
  organizationId: string;
  name: string;
  kind: string;
  parentUnitId?: string | null;
  academicYear?: string | null;
};

export type OrganizationInvitationPreview = {
  invitationId: string;
  organization: { id: string; name: string; kind: string };
  units: Array<{ id: string; name: string }>;
  role: OrganizationRole;
  expiresAt: string;
  assessmentRequired: boolean;
  consentVersion: string;
  requestedConsentScopes: ConsentScope[];
};

export type ConsentScope =
  | "roster_status"
  | "assessment_summary"
  | "direction_progress"
  | "next_actions"
  | "educator_follow_up";

export type OrganizationMember = {
  id: string;
  userId: string;
  role: OrganizationRole;
  unitIds: string[];
  displayName: string;
  email?: string | null;
  joinedAt?: string | null;
  consentStatus: string;
  assessmentStatus: "completed" | "pending";
  assessmentSummary?: {
    stage?: string | null;
    areas?: Array<{ id: string; title: string }>;
    signals?: Array<{ id: string; title: string }>;
  } | null;
  directionProgress?: {
    areaId?: string | null;
    selectedCareerCount: number;
    completedActions: number;
    reviewOn?: string | null;
  } | null;
};

export type OrganizationDashboard = {
  organization: OrganizationContext["organization"];
  role: OrganizationRole;
  unitIds: string[];
  effectiveStatus: OrganizationContext["effectiveStatus"];
  summary: {
    activeStudents: number;
    assessmentCompleted: number;
    awaitingAssessment: number;
    activeConsent: number;
    followUpNeeded: number;
  };
  cohortInsights: Array<{ id: string; title: string; count: number }>;
  privacyThreshold: number;
  students: OrganizationMember[];
};

export type OrganizationStaffProfile = {
  membershipId: string;
  role: Exclude<OrganizationRole, "student">;
  unitIds: string[];
  organization: OrganizationContext["organization"];
  profile: {
    title: string;
    department: string;
    phone: string;
    bio: string;
  };
};

export type OrganizationWorkspace = {
  membershipId: string;
  organization: OrganizationContext["organization"];
  role: OrganizationRole;
  unitIds: string[];
  effectiveStatus: OrganizationContext["effectiveStatus"];
  accessMode: OrganizationContext["accessMode"];
  selected: boolean;
};

export async function getOrganizationContext() {
  return xtaraApi.get<OrganizationContext | null>("/organizations/context");
}

export async function createOrganization(input: { name: string; kind: OrganizationContext["organization"]["kind"]; academicYear?: string }) {
  return xtaraApi.post<OrganizationContext>("/organizations", input);
}

export async function getOrganizationUnits() {
  const response = await xtaraApi.get<{ items: OrganizationUnit[] }>("/organizations/units");
  return response.items;
}

export async function createOrganizationUnit(input: { name: string; kind: string; parentUnitId?: string; academicYear?: string }) {
  return xtaraApi.post<OrganizationUnit>("/organizations/units", input);
}

export async function previewOrganizationInvitation(code: string) {
  return xtaraApi.post<OrganizationInvitationPreview>("/organizations/invitations/preview", { code });
}

export async function joinOrganization(input: { code: string; consentScopes: ConsentScope[]; consentVersion: string; guardianConfirmed?: boolean }) {
  return xtaraApi.post<OrganizationContext>("/organizations/join", input);
}

export async function createOrganizationInvitation(input: {
  role: Exclude<OrganizationRole, "owner">;
  unitIds: string[];
  email?: string;
  maxUses?: number;
  expiresInDays?: number;
}) {
  return xtaraApi.post<Record<string, unknown> & { id: string; code: string }>("/organizations/invitations", input);
}

export async function getOrganizationDashboard() {
  return xtaraApi.get<OrganizationDashboard>("/organizations/dashboard");
}

export async function getOrganizationStudentProfile(membershipId: string) {
  return xtaraApi.get<OrganizationMember>(`/organizations/students/${encodeURIComponent(membershipId)}`);
}

export async function getOrganizationStaffProfile() {
  return xtaraApi.get<OrganizationStaffProfile>("/organizations/profile");
}

export async function updateOrganizationStaffProfile(input: OrganizationStaffProfile["profile"]) {
  return xtaraApi.patch<OrganizationStaffProfile>("/organizations/profile", input);
}

export async function listOrganizationWorkspaces() {
  const response = await xtaraApi.get<{ items: OrganizationWorkspace[] }>("/organizations/workspaces");
  return response.items;
}

export async function selectOrganizationWorkspace(membershipId: string) {
  return xtaraApi.post<OrganizationContext>(`/organizations/workspaces/${encodeURIComponent(membershipId)}/select`);
}

export async function removeOrganizationMember(membershipId: string) {
  return xtaraApi.delete<{ id: string; ended: boolean; removedUnitIds: string[]; remainingUnitIds: string[] }>(
    `/organizations/members/${encodeURIComponent(membershipId)}`,
  );
}

export async function leaveOrganization() {
  return xtaraApi.post<{ left: boolean; nextMembershipId?: string | null }>("/organizations/leave");
}
