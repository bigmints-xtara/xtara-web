export const pendingOrganizationJoinStorageKey = "xtara:pending-organization-join";

export function savePendingOrganizationJoin(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(pendingOrganizationJoinStorageKey, code.trim().toUpperCase());
}

export function getPendingOrganizationJoin(): string | null {
  if (typeof window === "undefined") return null;
  const code = localStorage.getItem(pendingOrganizationJoinStorageKey)?.trim();
  return code || null;
}

export function clearPendingOrganizationJoin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(pendingOrganizationJoinStorageKey);
}
