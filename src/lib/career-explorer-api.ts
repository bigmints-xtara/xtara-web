import { xtaraApiOperationPath } from "@/lib/api/generated/xtara-api-operations";
import { xtaraApi } from "@/lib/api/client";
import type { Locale } from "@/i18n/config";
import type { CareerExplorerResponse } from "@/types/career-explorer";

import type { FutureDirection } from "@/types/curated-career";

export async function getCareerExplorer(
  locale: Locale,
  signal?: AbortSignal,
): Promise<CareerExplorerResponse> {
  const data = await xtaraApi.get<CareerExplorerResponse>(
    `${xtaraApiOperationPath("getCareerExplorer")}?locale=${locale}`,
    { signal },
  );
  if (
    data.schemaVersion !== 1 ||
    data.locale !== locale ||
    !Array.isArray(data.directions) ||
    !Array.isArray(data.industries) ||
    !Array.isArray(data.careers)
  ) {
    throw new Error(
      "The explorer response did not match the requested language and schema.",
    );
  }
  return data;
}

export async function getExplorerDirectionRecord(id: string, signal?: AbortSignal) {
  const record = await xtaraApi.get<FutureDirection>(
    xtaraApiOperationPath('getFutureDirectionsDirectionId', { directionId: id }), { signal },
  );
  if (record.id !== id || (!record.published && record.status !== 'published')) throw new Error('Invalid published direction');
  return record;
}
