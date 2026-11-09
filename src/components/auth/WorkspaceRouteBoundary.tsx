"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";
import { isWorkspaceRoute, WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

export default function WorkspaceRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { isStaff, loading, error, refresh } = useOrganizationWorkspace();
  // The Explorer landing page reads the published catalogue without an account.
  const learnerOnly = pathname !== "/explore" && isWorkspaceRoute("student", pathname);
  const checkingStaffRoute = Boolean(user && learnerOnly && loading);
  const redirectingStaff = Boolean(user && learnerOnly && isStaff);
  const unresolvedWorkspace = Boolean(user && learnerOnly && error);

  useEffect(() => {
    if (!redirectingStaff) return;
    router.replace(
      pathname === WORKSPACE_MANIFESTS.student.profilePath
        ? WORKSPACE_MANIFESTS.educator.profilePath
        : WORKSPACE_MANIFESTS.educator.homePath,
    );
  }, [pathname, redirectingStaff, router]);

  if (unresolvedWorkspace) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7fafc] px-5 text-primary">
        <div className="max-w-md text-center"><Building2 className="mx-auto h-8 w-8" /><h1 className="mt-4 text-xl font-semibold">Workspace access could not be verified</h1><p className="mt-2 text-sm leading-6 text-slate-500">For your privacy, learner pages stay closed until Xtara can confirm whether this is a learner or educator account.</p><Button type="button" className="mt-5" onClick={() => refresh()}>Try again</Button></div>
      </div>
    );
  }

  if (checkingStaffRoute || redirectingStaff) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7fafc] text-primary">
        <div className="text-center"><Building2 className="mx-auto h-8 w-8" /><Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin" /><p className="mt-3 text-sm text-slate-500">Opening your institution workspace…</p></div>
      </div>
    );
  }

  return children;
}
