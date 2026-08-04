import { beforeEach, describe, expect, it } from "vitest";

import {
  clearPendingOrganizationJoin,
  getPendingOrganizationJoin,
  pendingOrganizationJoinStorageKey,
  savePendingOrganizationJoin,
} from "@/lib/pending-organization-join";

describe("pending organization join", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const storage: Storage = {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => Array.from(values.keys())[index] ?? null,
      removeItem: (key) => { values.delete(key); },
      setItem: (key, value) => { values.set(key, String(value)); },
    };
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  });

  it("normalizes and preserves a code across the assessment redirect", () => {
    savePendingOrganizationJoin("  xtara-abcde-fghij ");
    expect(localStorage.getItem(pendingOrganizationJoinStorageKey)).toBe("XTARA-ABCDE-FGHIJ");
    expect(getPendingOrganizationJoin()).toBe("XTARA-ABCDE-FGHIJ");
  });

  it("clears the code after membership activates", () => {
    savePendingOrganizationJoin("XTARA-ABCDE-FGHIJ");
    clearPendingOrganizationJoin();
    expect(getPendingOrganizationJoin()).toBeNull();
  });
});
