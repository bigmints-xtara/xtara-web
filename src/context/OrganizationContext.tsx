"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { getOrganizationContext, type OrganizationContext } from "@/lib/organization";
import { WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

type OrganizationWorkspaceValue = {
  context: OrganizationContext | null;
  loading: boolean;
  error: Error | null;
  isStaff: boolean;
  isStudentMember: boolean;
  workspaceHome: typeof WORKSPACE_MANIFESTS.educator.homePath | typeof WORKSPACE_MANIFESTS.student.homePath;
  refresh: () => Promise<void>;
};

const OrganizationWorkspaceContext = createContext<OrganizationWorkspaceValue>({
  context: null,
  loading: false,
  error: null,
  isStaff: false,
  isStudentMember: false,
  workspaceHome: WORKSPACE_MANIFESTS.student.homePath,
  refresh: async () => undefined,
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const authenticated = Boolean(user && !user.isAnonymous);
  const query = useQuery<OrganizationContext | null, Error>({
    queryKey: ["organization", "context", user?.uid || null],
    queryFn: getOrganizationContext,
    enabled: !authLoading && authenticated,
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
  });
  const context = authenticated ? query.data ?? null : null;
  const isStaff = Boolean(context && context.membership.role !== "student");

  return (
    <OrganizationWorkspaceContext.Provider value={{
      context,
      loading: authLoading || (authenticated && query.isLoading),
      error: query.error || null,
      isStaff,
      isStudentMember: context?.membership.role === "student",
      workspaceHome: isStaff ? WORKSPACE_MANIFESTS.educator.homePath : WORKSPACE_MANIFESTS.student.homePath,
      refresh: async () => { await query.refetch(); },
    }}>
      {children}
    </OrganizationWorkspaceContext.Provider>
  );
}

export function useOrganizationWorkspace() {
  return useContext(OrganizationWorkspaceContext);
}
