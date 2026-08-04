import en from "@/content/career-knowledge.en.json";
import hi from "@/content/career-knowledge.hi.json";
import ml from "@/content/career-knowledge.ml.json";
import ta from "@/content/career-knowledge.ta.json";
import type { Locale } from "@/i18n/config";
import type {
  CareerAreaContent,
  CareerAreaId,
  CareerKnowledgeCatalog,
  CareerRoleContent,
  CareerSource,
} from "@/types/career-knowledge";

const catalogs: Record<Locale, CareerKnowledgeCatalog> = {
  en: en as CareerKnowledgeCatalog,
  hi: hi as CareerKnowledgeCatalog,
  ml: ml as CareerKnowledgeCatalog,
  ta: ta as CareerKnowledgeCatalog,
};

export function getCareerKnowledgeCatalog(locale: Locale): CareerKnowledgeCatalog {
  return catalogs[locale] ?? catalogs.en;
}

export function getCareerArea(locale: Locale, areaId: string): CareerAreaContent | null {
  return getCareerKnowledgeCatalog(locale).areas.find((area) => area.id === areaId) ?? null;
}

export function getCareerAreas(locale: Locale): CareerAreaContent[] {
  return getCareerKnowledgeCatalog(locale).areas;
}

export function getCareerRole(locale: Locale, roleId: string): CareerRoleContent | null {
  return getCareerKnowledgeCatalog(locale).roles.find((role) => role.id === roleId) ?? null;
}

export function getCareerRolesByArea(locale: Locale, areaId: CareerAreaId): CareerRoleContent[] {
  return getCareerKnowledgeCatalog(locale).roles.filter((role) => role.areaId === areaId);
}

export function getCareerSources(locale: Locale, sourceIds: string[]): CareerSource[] {
  return getCareerKnowledgeCatalog(locale).sources.filter((source) => sourceIds.includes(source.id));
}
