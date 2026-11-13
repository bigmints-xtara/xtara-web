"use client";
import { OrganizationError } from "@/components/organization/OrganizationPageState";

export default function OrganizationRouteError({ error, reset }: { error: Error; reset: () => void }) {
  return <OrganizationError message={error.message} onRetry={reset} />;
}
