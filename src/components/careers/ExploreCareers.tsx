"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useTranslations } from "@/i18n/language-provider";
import type { Locale } from "@/i18n/config";
import { getCareerExplorer } from "@/lib/career-explorer-api";
import { explorerCopy } from "./explorer/copy";
import {
  exploreUrl,
  initialExploreState,
  previousExploreState,
  readExploreState,
  type ExploreState,
} from "./explorer/state";
import styles from "./ExploreCareers.module.css";

const navigationEvent = "xtara-explore-navigate";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(navigationEvent, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(navigationEvent, listener);
  };
}
const snapshot = () => window.location.search;
const serverSnapshot = () => "";
export function safeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function Choice({
  title,
  description,
  onClick,
  index = 0,
}: {
  title: string;
  description: string;
  onClick: () => void;
  index?: number;
}) {
  return (
    <button
      className={styles.choice}
      style={
        { "--choice-tint": `var(--tint-${index % 4})` } as React.CSSProperties
      }
      onClick={onClick}
    >
      <span className={styles.choiceDot} aria-hidden="true" />
      <span>
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  );
}

export default function ExploreCareers() {
  const { locale, setLocale } = useTranslations();
  const copy = explorerCopy[locale];
  const search = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["career-explorer", locale],
    queryFn: ({ signal }) => getCareerExplorer(locale, signal),
    staleTime: 60_000,
    retry: false,
  });
  const state = readExploreState(search, data);
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const activeNode = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusAfterNavigation = useRef(false);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const navigate = (next: ExploreState, replace = false) => {
    focusAfterNavigation.current = !replace;
    window.history[replace ? "replaceState" : "pushState"](
      window.history.state,
      "",
      exploreUrl(next),
    );
    window.dispatchEvent(new Event(navigationEvent));
  };
  const direction = data?.directions.find((d) => d.id === state.direction);
  const industry = data?.industries.find((i) => i.id === state.industry);
  const career = data?.careers.find((c) => c.id === state.career);
  const reset = () => navigate({ ...initialExploreState, view: state.view });
  const selectIndustry = (id: string) =>
    navigate({ ...state, industry: id, career: null, step: "roles", q: "" });
  const selectCareer = (id: string) =>
    navigate({ ...state, career: id, step: "work", q: "" });
  const stepTitle =
    state.step === "directions"
      ? copy.chooseDirection
      : state.step === "industries"
        ? copy.chooseIndustry
        : state.step === "roles"
          ? industry
            ? copy.chooseRole
            : copy.roles
          : career?.title || copy[state.step];
  const history: { label: string; caption: string; state: ExploreState }[] = [];
  if (state.step !== "directions")
    history.push({
      label: copy.directions,
      caption: copy.title,
      state: { ...initialExploreState, view: state.view },
    });
  if (direction && state.step !== "industries")
    history.push({
      label: direction.title,
      caption: copy.directions,
      state: {
        ...state,
        industry: null,
        career: null,
        step: "industries",
        q: "",
      },
    });
  if (career)
    history.push({
      label: industry?.title || copy.roles,
      caption: copy.industries,
      state: { ...state, career: null, step: "roles", q: "" },
    });
  if (career && (state.step === "study" || state.step === "related"))
    history.push({
      label: career.title,
      caption: copy.work,
      state: { ...state, step: "work" },
    });
  if (career && state.step === "related")
    history.push({
      label: copy.study,
      caption: career.title,
      state: { ...state, step: "study" },
    });
  useEffect(() => {
    const pan = () => {
      const container = viewport.current;
      const node = activeNode.current;
      if (!container || !node) return;
      const left =
        node.offsetLeft * zoom -
        Math.max(20, (container.clientWidth - node.offsetWidth * zoom) / 2);
      container.scrollTo?.({
        left: Math.max(0, left),
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
          .matches
          ? "instant"
          : "smooth",
      });
    };
    const frame = requestAnimationFrame(() => {
      pan();
      if (focusAfterNavigation.current) {
        heading.current?.focus({ preventScroll: true });
        focusAfterNavigation.current = false;
      }
    });
    const observer =
      typeof ResizeObserver !== "undefined" && viewport.current
        ? new ResizeObserver(pan)
        : null;
    if (observer && viewport.current) observer.observe(viewport.current);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [search, data, zoom]);

  let content: ReactNode;
  let footer: ReactNode;
  if (isPending) content = <p role="status">{copy.loading}</p>;
  else if (isError)
    content = (
      <div>
        <p role="alert">{copy.error}</p>
        <button className={styles.primary} onClick={() => void refetch()}>
          {copy.retry}
        </button>
      </div>
    );
  else if (!data?.careers.length) content = <p role="status">{copy.empty}</p>;
  else if (state.step === "directions") {
    content = (
      <>
        <p className={styles.intro}>{copy.subtitle}</p>
        <div className={styles.choices}>
          {data.directions.map((d, index) => (
            <Choice
              key={d.id}
              title={d.title}
              description={d.summary}
              onClick={() =>
                navigate({
                  ...state,
                  direction: d.id,
                  industry: null,
                  career: null,
                  step: "industries",
                  q: "",
                })
              }
              index={index}
            />
          ))}
        </div>
      </>
    );
    footer = (
      <button
        className={styles.textButton}
        onClick={() => navigate({ ...state, step: "roles" })}
      >
        {copy.allCareers}
        <ArrowRight size={16} />
      </button>
    );
  } else if (state.step === "industries") {
    const industries = data.industries.filter((i) =>
      direction?.industryIds.includes(i.id),
    );
    content = (
      <>
        {direction?.translationFallback && (
          <p className={styles.notice}>{copy.fallback}</p>
        )}
        {!industries.length && <p>{copy.noIndustries}</p>}
        <div className={styles.choices}>
          {industries.map((i, index) => (
            <Choice
              key={i.id}
              title={i.title}
              description={i.description}
              onClick={() => selectIndustry(i.id)}
              index={index}
            />
          ))}
        </div>
      </>
    );
    footer = (
      <button
        className={styles.textButton}
        onClick={() => navigate({ ...state, industry: null, step: "roles" })}
      >
        {copy.allDirectionRoles}
        <ArrowRight size={16} />
      </button>
    );
  } else if (state.step === "roles") {
    const roles = data.careers.filter(
      (c) =>
        (industry
          ? industry.careerIds.includes(c.id)
          : direction
            ? direction.careerIds.includes(c.id)
            : true) &&
        `${c.title} ${c.summary}`
          .toLocaleLowerCase(locale)
          .includes(state.q.trim().toLocaleLowerCase(locale)),
    );
    content = (
      <>
        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label={copy.search}
            placeholder={copy.search}
            value={state.q}
            onChange={(event) =>
              navigate({ ...state, q: event.target.value.slice(0, 200) }, true)
            }
          />
        </label>
        {industry?.translationFallback && (
          <p className={styles.notice}>{copy.fallback}</p>
        )}
        <div className={styles.choices}>
          {roles.map((c, index) => (
            <Choice
              key={c.id}
              title={c.title}
              description={c.summary}
              onClick={() => selectCareer(c.id)}
              index={index}
            />
          ))}
        </div>
        {!roles.length && <p role="status">{copy.noMatches}</p>}
      </>
    );
  } else if (career) {
    const fallback = career.translationFallback && (
      <p className={styles.notice}>{copy.fallback}</p>
    );
    if (state.step === "work") {
      content = (
        <>
          {fallback}
          <p className={styles.intro}>{career.summary || copy.workEmpty}</p>
          {career.activities.length > 0 && (
            <ul className={styles.workList}>
              {career.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          )}
        </>
      );
      footer = (
        <button
          className={styles.primary}
          onClick={() => navigate({ ...state, step: "study" })}
        >
          {copy.seeStudy}
          <ArrowRight size={18} />
        </button>
      );
    } else if (state.step === "study") {
      content = (
        <>
          {fallback}
          {!career.subjects.length && !career.studyRoutes.length && (
            <p>{copy.studyEmpty}</p>
          )}
          {career.subjects.length > 0 && (
            <section className={styles.detailSection}>
              <h3>{copy.subjects}</h3>
              <div className={styles.tags}>
                {career.subjects.map((subject) => (
                  <span key={subject}>{subject}</span>
                ))}
              </div>
              <p className={styles.note}>{copy.subjectNote}</p>
            </section>
          )}
          {career.studyRoutes.length > 0 && (
            <section className={styles.detailSection}>
              <h3>{copy.studyPaths}</h3>
              {career.studyRoutes.map((route) => (
                <article className={styles.studyRoute} key={route.id}>
                  <h4>{route.title}</h4>
                  <p>{route.description}</p>
                </article>
              ))}
            </section>
          )}
          {career.sources.some((source) => safeSourceUrl(source.url)) && (
            <details className={styles.sources}>
              <summary>{copy.sources}</summary>
              <p>{copy.sourceNote}</p>
              <ul>
                {career.sources.map((source) => {
                  const url = safeSourceUrl(source.url);
                  return url ? (
                    <li key={source.id}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {source.label}
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
            </details>
          )}
        </>
      );
      footer = (
        <button
          className={styles.primary}
          onClick={() => navigate({ ...state, step: "related" })}
        >
          {copy.seeRelated}
          <ArrowRight size={18} />
        </button>
      );
    } else {
      const places = data.industries.filter(
        (i) => career.industryIds.includes(i.id) && i.id !== state.industry,
      );
      const related = data.careers.filter((c) =>
        career.relatedCareerIds.includes(c.id),
      );
      content = (
        <>
          {places.length > 0 && (
            <section className={styles.detailSection}>
              <h3>{copy.otherIndustries}</h3>
              <div className={styles.choices}>
                {places.map((i, index) => (
                  <Choice
                    key={i.id}
                    title={i.title}
                    description={i.description}
                    onClick={() =>
                      navigate({
                        ...state,
                        direction: i.directionIds.includes(
                          state.direction || "",
                        )
                          ? state.direction
                          : i.directionIds[0] || null,
                        industry: i.id,
                        career: null,
                        step: "roles",
                        q: "",
                      })
                    }
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}
          {related.length > 0 && (
            <section className={styles.detailSection}>
              <h3>{copy.relatedCareers}</h3>
              <div className={styles.choices}>
                {related.map((c, index) => (
                  <Choice
                    key={c.id}
                    title={c.title}
                    description={c.summary}
                    onClick={() =>
                      navigate({
                        ...state,
                        direction: c.directionIds[0] || null,
                        industry: null,
                        career: c.id,
                        step: "work",
                        q: "",
                      })
                    }
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}
          {!places.length && !related.length && <p>{copy.noRelated}</p>}
          <section className={styles.assessment}>
            <Compass size={26} aria-hidden="true" />
            <h3>{copy.assessmentTitle}</h3>
            <p>{copy.assessmentDescription}</p>
            <Link className={styles.primary} href="/assessment">
              {copy.assessment}
              <ArrowRight size={18} />
            </Link>
          </section>
        </>
      );
      footer = (
        <button className={styles.textButton} onClick={reset}>
          {copy.keepExploring}
          <ArrowRight size={16} />
        </button>
      );
    }
  }
  const node = (
    <section
      ref={activeNode}
      className={styles.activeNode}
      aria-labelledby="explore-step-title"
    >
      <header className={styles.nodeHeader}>
        <span className={styles.eyebrow}>{copy[state.step]}</span>
        <h1 ref={heading} tabIndex={-1} id="explore-step-title">
          {stepTitle}
        </h1>
        {state.step === "roles" && (industry || direction) && (
          <p>{industry?.title || direction?.title}</p>
        )}
      </header>
      <div
        key={`${state.step}:${state.direction}:${state.industry}:${state.career}`}
        className={styles.nodeBody}
      >
        {content}
      </div>
      {footer && <footer className={styles.nodeFooter}>{footer}</footer>}
    </section>
  );
  return (
    <div
      className={`${styles.explorer} ${state.view === "map" ? styles.mapMode : styles.cardsMode}`}
    >
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label={copy.home}>
          <Compass size={23} />
          <span>
            xtara<span className={styles.brandDot}>.</span>
          </span>
        </Link>
        <div className={styles.viewSwitch} role="group" aria-label={copy.view}>
          <button
            aria-pressed={state.view === "map"}
            onClick={() => navigate({ ...state, view: "map" })}
          >
            {copy.map}
          </button>
          <button
            aria-pressed={state.view === "cards"}
            onClick={() => navigate({ ...state, view: "cards" })}
          >
            {copy.cards}
          </button>
        </div>
        <select
          aria-label="Language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="en">English</option>
          <option value="ml">മലയാളം</option>
          <option value="hi">हिन्दी</option>
          <option value="ta">தமிழ்</option>
        </select>
      </header>
      <main className={styles.main}>
        <nav className={styles.pathbar} aria-label={copy.path}>
          {state.step !== "directions" && (
            <button onClick={() => navigate(previousExploreState(state))}>
              <ArrowLeft size={16} />
              {copy.back}
            </button>
          )}
          <span>{copy.title}</span>
          {state.step !== "directions" && (
            <button onClick={reset}>
              <RotateCcw size={15} />
              <span>{copy.start}</span>
            </button>
          )}
        </nav>
        {state.view === "map" ? (
          <div
            ref={viewport}
            className={styles.viewport}
            tabIndex={0}
            aria-label={copy.mapLabel}
            onPointerDown={(e) => {
              if (
                e.pointerType === "mouse" &&
                !(e.target as HTMLElement).closest(
                  "section,button,a,input,select",
                )
              ) {
                drag.current = {
                  x: e.clientX,
                  left: e.currentTarget.scrollLeft,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }
            }}
            onPointerMove={(e) => {
              if (drag.current)
                e.currentTarget.scrollLeft =
                  drag.current.left + drag.current.x - e.clientX;
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <div className={styles.track} style={{ zoom }}>
              {history.map((item, index) => (
                <button
                  key={`${index}-${item.caption}`}
                  className={styles.pastNode}
                  onClick={() => navigate(item.state)}
                >
                  <span>{item.caption}</span>
                  <strong>{item.label}</strong>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              ))}
              {node}
              <div className={styles.endSpace} aria-hidden="true" />
            </div>
          </div>
        ) : (
          <div className={styles.cardsContent}>
            {history.length > 0 && (
              <nav className={styles.breadcrumbs} aria-label={copy.path}>
                {history.map((item, index) => (
                  <button key={index} onClick={() => navigate(item.state)}>
                    {item.label}
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                ))}
              </nav>
            )}
            {node}
          </div>
        )}
        {state.view === "map" && (
          <div className={styles.mapDock}>
            <span>{copy.browseHint}</span>
            <div className={styles.zoomControls}>
              <button
                aria-label={copy.zoomOut}
                disabled={zoom <= 0.75}
                onClick={() =>
                  setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))
                }
              >
                <Minus size={18} />
              </button>
              <button aria-label={copy.resetZoom} onClick={() => setZoom(1)}>
                {Math.round(zoom * 100)}%
              </button>
              <button
                aria-label={copy.zoomIn}
                disabled={zoom >= 1.25}
                onClick={() =>
                  setZoom((z) => Math.min(1.25, +(z + 0.1).toFixed(2)))
                }
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
