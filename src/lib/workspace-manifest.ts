export type WorkspaceKind = "student" | "educator" | "admin";

type WorkspaceManifest = {
  id: WorkspaceKind;
  label: string;
  audience: string;
  entryPath: string;
  homePath: string;
  profilePath: string | null;
  routePrefixes: readonly string[];
  apiPrefixes: readonly string[];
};

export const WORKSPACE_MANIFESTS = {
  student: {
    id: "student",
    label: "Student workspace",
    audience: "Individual learners, including learners enrolled in an institution",
    entryPath: "/login",
    homePath: "/dashboard",
    profilePath: "/profile",
    routePrefixes: [
      "/dashboard",
      "/assessment",
      "/direction",
      "/dream-careers",
      "/explore",
      "/learn",
      "/play",
      "/achievements",
      "/profile",
    ],
    apiPrefixes: ["/assessment", "/career-paths", "/rewards", "/me"],
  },
  educator: {
    id: "educator",
    label: "Educator workspace",
    audience: "Organization owners, administrators, teachers, counselors, and other staff",
    entryPath: "/login?mode=educator",
    homePath: "/organization",
    profilePath: "/organization/profile",
    routePrefixes: ["/organization"],
    apiPrefixes: ["/organizations"],
  },
  admin: {
    id: "admin",
    label: "Xtara administration",
    audience: "Authorized Xtara platform administrators and content editors",
    entryPath: "/admin",
    homePath: "/admin",
    profilePath: null,
    routePrefixes: ["/admin"],
    apiPrefixes: ["/admin"],
  },
} as const satisfies Record<WorkspaceKind, WorkspaceManifest>;

export function isWorkspaceRoute(workspace: WorkspaceKind, pathname: string): boolean {
  return WORKSPACE_MANIFESTS[workspace].routePrefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function workspaceDestination(workspace: WorkspaceKind, value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return isWorkspaceRoute(workspace, value) ? value : null;
}
