"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { resolveAdminRole } from "@/lib/admin-access";
import { adminNavigationCopy } from "@/lib/admin-navigation";
import { useTranslations } from "@/i18n/language-provider";
import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";
import { isWorkspaceRoute, WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

export default function WorkspaceRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { locale } = useTranslations();
  const adminRole = user && !user.isAnonymous ? resolveAdminRole(userProfile) : null;
  const { isStaff, loading, error, refresh } = useOrganizationWorkspace();
  // The Explorer landing page reads the published catalogue without an account.
  const learnerOnly = pathname !== "/explore" && isWorkspaceRoute("student", pathname);
  const checkingStaffRoute = Boolean(user && learnerOnly && (authLoading || (!adminRole && loading)));
  const redirectingStaff = Boolean(user && learnerOnly && !authLoading && !adminRole && isStaff);
  const unresolvedWorkspace = Boolean(user && learnerOnly && !adminRole && error);

  // Admins can inspect published career pages without entering a learner workspace.
  const publicCareerPage = pathname === "/explore" || pathname.startsWith("/explore/") || pathname.startsWith("/dream-careers/");
  const redirectingAdmin = Boolean(user && learnerOnly && !publicCareerPage && !authLoading && adminRole);

  useEffect(() => {
    if (redirectingAdmin) {
      router.replace(WORKSPACE_MANIFESTS.admin.homePath);
      return;
    }
    if (!redirectingStaff) return;
    router.replace(
      pathname === WORKSPACE_MANIFESTS.student.profilePath
        ? WORKSPACE_MANIFESTS.educator.profilePath
        : WORKSPACE_MANIFESTS.educator.homePath,
    );
  }, [pathname, redirectingAdmin, redirectingStaff, router]);

  if (unresolvedWorkspace) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7fafc] px-5 text-primary">
        <div className="max-w-md text-center"><Building2 className="mx-auto h-8 w-8" /><h1 className="mt-4 text-xl font-semibold">Workspace access could not be verified</h1><p className="mt-2 text-sm leading-6 text-slate-500">For your privacy, learner pages stay closed until Xtara can confirm whether this is a learner or educator account.</p><Button type="button" className="mt-5" onClick={() => refresh()}>Try again</Button></div>
      </div>
    );
  }

  if (checkingStaffRoute || redirectingStaff || redirectingAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7fafc] text-primary">
        <div className="text-center"><Building2 className="mx-auto h-8 w-8" /><Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin" /><p className="mt-3 text-sm text-slate-500">{redirectingAdmin ? adminNavigationCopy[locale].opening : "Opening your workspace…"}</p></div>
      </div>
    );
  }

  return children;
}
