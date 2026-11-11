"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getCareerExplorer } from "@/lib/career-explorer-api";
import { isStudyOptionsCareer, studyOptionsHref } from "@/lib/study-options";
import { explorerCopy } from "./explorer/copy";
import { studyOptionsCopy } from "./study-options-copy";

export default function PilotCareerSpecializations({ careerId, locale }: { careerId: string; locale: Locale }) {
  const { data } = useQuery({
    queryKey: ["career-explorer", locale],
    queryFn: ({ signal }) => getCareerExplorer(locale, signal),
    staleTime: 60_000,
    meta: { authScope: "public" },
    retry: false,
  });
  const parent = data?.careers.find((item) => item.id === careerId);
  const specializations = data?.careers.filter((item) =>
    isStudyOptionsCareer(item.id) && parent?.specializationIds?.includes(item.id),
  );
  if (!specializations?.length) return null;

  const returnTo = `/dream-careers/${encodeURIComponent(careerId)}?from=dashboard`;
  return (
    <section className="mt-6" aria-labelledby="study-pilot-specializations">
      <h2 id="study-pilot-specializations" className="text-base font-semibold text-primary">{explorerCopy[locale].specializations}</h2>
      <ul className="mt-2 space-y-2">
        {specializations.map((item) => (
          <li key={item.id}>
            <Link
              href={studyOptionsHref(item.id, returnTo)}
              className="flex max-w-lg min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="min-w-0">
                <span className="block font-medium break-words">{item.title}</span>
                <span className="block text-sm text-muted-foreground">{studyOptionsCopy[locale].action}</span>
              </span>
              <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
