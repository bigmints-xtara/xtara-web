import { describe, expect, it } from "vitest";

import { isWorkspaceRoute, workspaceDestination, WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

describe("workspace routing manifest", () => {
  it("keeps each workspace on a distinct entry and home", () => {
    expect(WORKSPACE_MANIFESTS.student).toMatchObject({ entryPath: "/login", homePath: "/dashboard" });
    expect(WORKSPACE_MANIFESTS.educator).toMatchObject({ entryPath: "/login?mode=educator", homePath: "/organization" });
    expect(WORKSPACE_MANIFESTS.admin).toMatchObject({ entryPath: "/admin", homePath: "/admin" });
  });

  it("classifies owned routes without prefix collisions", () => {
    expect(isWorkspaceRoute("student", "/assessment/discovery")).toBe(true);
    expect(isWorkspaceRoute("educator", "/organization/students/member-1")).toBe(true);
    expect(isWorkspaceRoute("admin", "/admin/settings")).toBe(true);
    expect(isWorkspaceRoute("educator", "/admin")).toBe(false);
    expect(isWorkspaceRoute("student", "/organization")).toBe(false);
  });

  it("rejects cross-workspace and external post-login destinations", () => {
    expect(workspaceDestination("student", "/dashboard/challenges")).toBe("/dashboard/challenges");
    expect(workspaceDestination("student", "/admin")).toBeNull();
    expect(workspaceDestination("educator", "/profile")).toBeNull();
    expect(workspaceDestination("admin", "//example.com/admin")).toBeNull();
  });
});
