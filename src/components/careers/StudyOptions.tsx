"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { XtaraApiError } from "@/lib/api/client";
import { getCareerExplorer } from "@/lib/career-explorer-api";
import { getStates } from "@/lib/firebase/location";
import { pathwayFromAccount } from "@/lib/profile-study";
import {
  getStudyOptions,
  studyOfferingAnchor,
  studyOptionsCareerReturn,
  type StudyOptionsResponse,
  type StudyProgramme,
} from "@/lib/study-options";
import { studyOptionsCopy } from "./study-options-copy";

const allIndia = "all";

export default function StudyOptions({ careerId }: { careerId: string }) {
  const { locale } = useTranslations();
  const text = studyOptionsCopy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { user, userProfile, loading: authLoading } = useAuth();
  const filterSheet = useRef<HTMLDialogElement>(null);
  const restoredAnchor = useRef("");
  const explicitState = search.get("state");
  const accountState = user && !user.isAnonymous && userProfile?.uid === user.uid
    ? pathwayFromAccount(userProfile).state
    : "";
  const { data: states, isPending: statesLoading } = useQuery({
    queryKey: ["study-options-states"],
    queryFn: getStates,
    staleTime: Infinity,
    meta: { authScope: "public" },
  });
  const invalidState = !statesLoading && Boolean(explicitState && explicitState !== allIndia && !states?.includes(explicitState));
  const state = explicitState === allIndia
    ? null
    : explicitState || (states?.includes(accountState) ? accountState : null);
  const waitingForFilter = (!explicitState && authLoading)
    || Boolean(explicitState !== allIndia && (explicitState || accountState) && statesLoading);
  const { data: explorer } = useQuery({
    queryKey: ["career-explorer", locale],
    queryFn: ({ signal }) => getCareerExplorer(locale, signal),
    staleTime: 60_000,
    meta: { authScope: "public" },
    retry: false,
  });
  const career = explorer?.careers.find((item) => item.id === careerId);
  const parent = explorer?.careers.find((item) => item.id === career?.parentCareerId);
  const results = useInfiniteQuery({
    queryKey: ["study-options", careerId, state],
    queryFn: ({ signal, pageParam }) => getStudyOptions(careerId, { state, cursor: pageParam, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled: !waitingForFilter && !invalidState,
    staleTime: 60_000,
    meta: { authScope: "public" },
    retry: false,
  });

  useEffect(() => {
    const { hash } = window.location;
    if (!hash.startsWith("#study-offering-")) {
      restoredAnchor.current = "";
      return;
    }
    if (!results.data || restoredAnchor.current === hash) return;
    const anchor = hash.slice(1);
    const item = document.getElementById(anchor);
    if (item) {
      restoredAnchor.current = hash;
      item.scrollIntoView?.({ block: "center" });
      item.querySelector("a")?.focus({ preventScroll: true });
    }
  }, [results.data, search]);

  const locationUrl = (next: string) => {
    const params = new URLSearchParams(search);
    params.set("state", next);
    return `${pathname}?${params}`;
  };
  const changeState = (next: string) => router.push(locationUrl(next), { scroll: false });
  const locationSelect = (id: string) => (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="text-sm font-medium">{text.location}</label>
      <select
        id={id}
        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        value={!invalidState && state ? state : allIndia}
        onChange={(event) => changeState(event.target.value)}
        disabled={statesLoading}
      >
        <option value={allIndia}>{text.allIndia}</option>
        {states?.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
  );
  const backHref = studyOptionsCareerReturn(careerId, search.get("returnTo"));
  const status = results.data?.pages[0]?.status;
  const programmes = collectProgrammes(results.data?.pages ?? []);
  const errorStatus = results.error instanceof XtaraApiError ? results.error.status : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-14">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {text.backCareer}
        </Link>
        <header className="mt-4">
          <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-5xl">{text.title}</h1>
          {career && (
            <p className="mt-2 text-lg text-muted-foreground sm:text-xl">
              {parent && <>{parent.title} <span aria-hidden="true">/</span> </>}
              {career.title}
            </p>
          )}
        </header>
        <div className="mt-7 grid items-start gap-7 sm:grid-cols-[minmax(11rem,15rem)_minmax(0,1fr)] sm:gap-8">
          <div className="hidden rounded-2xl border border-border bg-card p-4 sm:block">
            {locationSelect("study-options-state")}
          </div>
          <div className="sm:hidden">
            <Button variant="outline" className="min-h-11" onClick={() => filterSheet.current?.showModal()}>
              <MapPin aria-hidden="true" />
              {text.filters}
            </Button>
            <span className="ms-3 break-words text-sm text-muted-foreground">
              {invalidState ? explicitState : state ?? text.allIndia}
            </span>
            <dialog
              ref={filterSheet}
              aria-label={text.filters}
              className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-auto rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground backdrop:bg-black/50"
            >
              {locationSelect("study-options-state-compact")}
              <form method="dialog" className="mt-4">
                <Button type="submit" className="min-h-11 w-full">{text.done}</Button>
              </form>
            </dialog>
          </div>
          <div className="min-w-0 space-y-5" aria-live="polite" aria-busy={results.isFetching}>
            {invalidState ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p role="alert">{text.invalidState}</p>
                <Button variant="outline" className="mt-3 min-h-11" onClick={() => changeState(allIndia)}>{text.broaden}</Button>
              </div>
            ) : results.isPending ? (
              <p role="status" className="rounded-2xl border border-border bg-card p-5">{text.loading}</p>
            ) : results.isError && !results.data ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p role="alert">{errorStatus === 503 ? text.unavailable : errorStatus === 404 ? text.missingCareer : text.error}</p>
                {errorStatus !== 404 && (
                  <Button variant="outline" className="mt-3 min-h-11" onClick={() => void results.refetch()}>{text.retry}</Button>
                )}
              </div>
            ) : status === "no_reviewed_mapping" ? (
              <p role="status" className="rounded-2xl border border-border bg-card p-5">{text.noMapping}</p>
            ) : status === "no_results" ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p role="status">{state ? text.noLocalResults : text.noResults}</p>
                {state && (
                  <Button variant="outline" className="mt-3 min-h-11" onClick={() => changeState(allIndia)}>{text.broaden}</Button>
                )}
              </div>
            ) : (
              <>
                {programmes.map((programme) => (
                  <ProgrammeCard
                    key={programme.courseConceptId}
                    programme={programme}
                    returnTo={locationUrl(state ?? allIndia)}
                    text={text}
                  />
                ))}
                {results.isFetchNextPageError && <p role="alert">{text.error}</p>}
                {results.hasNextPage && (
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => void (errorStatus === 409 ? results.refetch() : results.fetchNextPage())}
                    disabled={results.isFetchingNextPage}
                  >
                    {results.isFetchingNextPage ? text.loadingMore : results.isFetchNextPageError ? text.retry : text.loadMore}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function collectProgrammes(pages: StudyOptionsResponse[]): StudyProgramme[] {
  const groups = new Map<string, StudyProgramme>();
  for (const { programmes } of pages) {
    for (const programme of programmes) {
      const existing = groups.get(programme.courseConceptId);
      if (existing) existing.offerings.push(...programme.offerings);
      else groups.set(programme.courseConceptId, { ...programme, offerings: [...programme.offerings] });
    }
  }
  return [...groups.values()];
}

function ProgrammeCard({ programme, returnTo, text }: {
  programme: StudyProgramme;
  returnTo: string;
  text: (typeof studyOptionsCopy)[keyof typeof studyOptionsCopy];
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card px-4 py-5 sm:px-6">
      <h2 className="text-xl font-semibold break-words text-primary">{programme.title}</h2>
      {programme.qualificationCode && (
        <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase">{programme.qualificationCode}</p>
      )}
      <ul className="mt-3 divide-y divide-border">
        {programme.offerings.map((offering) => {
          const anchor = studyOfferingAnchor(offering.offeringId);
          const params = new URLSearchParams({
            offeringId: offering.offeringId,
            returnTo: `${returnTo}#${anchor}`,
          });
          const location = [offering.city, offering.state].filter(Boolean).join(", ");
          return (
            <li key={offering.offeringId} id={anchor} className="scroll-mt-20">
              <Link
                className="group flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-ring"
                href={`/colleges/${encodeURIComponent(offering.institutionId)}?${params}`}
              >
                <span className="min-w-0 space-y-1">
                  <span className="block font-medium break-words text-primary group-hover:underline">{offering.institutionName}</span>
                  {offering.title !== programme.title && <span className="block text-sm break-words">{offering.title}</span>}
                  {location && <span className="block text-sm break-words text-muted-foreground">{location}</span>}
                  <Badge variant="secondary" className="h-auto max-w-full whitespace-normal">{text[offering.match]}</Badge>
                </span>
                <ArrowRight size={18} className="shrink-0 text-primary" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
