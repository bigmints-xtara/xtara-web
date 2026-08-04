import type { ReactNode } from 'react';

import ChallengeEditor from '@/components/admin/editors/ChallengeEditor';
import { CareerSourceEditor, DreamCareerEditor, FutureDirectionEditor } from '@/components/admin/editors/CuratedCareerEditors';
import GameEditor from '@/components/admin/editors/GameEditor';
import GoodReadEditor from '@/components/admin/editors/GoodReadEditor';
import SparkEditor from '@/components/admin/editors/SparkEditor';
import StoryEditor from '@/components/admin/editors/StoryEditor';
import { careerSourcesConfig } from '@/lib/admin/configs/careerSourcesConfig';
import { challengesConfig } from '@/lib/admin/configs/challengesConfig';
import { curatedDreamCareersConfig } from '@/lib/admin/configs/curatedDreamCareersConfig';
import { futureDirectionsConfig } from '@/lib/admin/configs/futureDirectionsConfig';
import { gamesConfig } from '@/lib/admin/configs/gamesConfig';
import { goodReadsConfig } from '@/lib/admin/configs/goodReadsConfig';
import { sparksConfig } from '@/lib/admin/configs/sparksConfig';
import { storiesConfig } from '@/lib/admin/configs/storiesConfig';
import type { AdminConfig, AdminEntity, Challenge, GameInstance, GoodRead, Spark, Story } from '@/types/admin';
import type { CuratedCareerSource, CuratedDreamCareer, FutureDirection } from '@/types/curated-career';
import {
  CareerSourcePreview,
  ChallengePreview,
  DreamCareerPreview,
  FutureDirectionPreview,
  GamePreview,
  GoodReadPreview,
  SparkPreview,
  StoryPreview,
} from './AdminContentPreview';

export type AdminContentDefinition = {
  slug: string;
  config: AdminConfig<AdminEntity>;
  renderEditor: (
    entity: AdminEntity | null,
    onSave: (data: Partial<AdminEntity>) => Promise<void>,
    onCancel: () => void,
  ) => ReactNode;
  renderPreview: (entity: AdminEntity) => ReactNode;
};

function defineContent<T extends AdminEntity>(definition: {
  slug: string;
  config: AdminConfig<T>;
  editor: (entity: T | null, onSave: (data: Partial<T>) => Promise<void>, onCancel: () => void) => ReactNode;
  preview: (entity: T) => ReactNode;
}): AdminContentDefinition {
  return {
    slug: definition.slug,
    config: definition.config as unknown as AdminConfig<AdminEntity>,
    renderEditor: (entity, onSave, onCancel) => definition.editor(
      entity as T | null,
      (data) => onSave(data as Partial<AdminEntity>),
      onCancel,
    ),
    renderPreview: (entity) => definition.preview(entity as T),
  };
}

export const ADMIN_CONTENT_DEFINITIONS: Record<string, AdminContentDefinition> = {
  stories: defineContent<Story>({
    slug: 'stories', config: storiesConfig,
    editor: (entity, onSave, onCancel) => <StoryEditor onCancel={onCancel} onSave={onSave} story={entity} />,
    preview: (entity) => <StoryPreview entity={entity} />,
  }),
  'good-reads': defineContent<GoodRead>({
    slug: 'good-reads', config: goodReadsConfig,
    editor: (entity, onSave, onCancel) => <GoodReadEditor goodRead={entity} onCancel={onCancel} onSave={onSave} />,
    preview: (entity) => <GoodReadPreview entity={entity} />,
  }),
  sparks: defineContent<Spark>({
    slug: 'sparks', config: sparksConfig,
    editor: (entity, onSave, onCancel) => <SparkEditor onCancel={onCancel} onSave={onSave} spark={entity} />,
    preview: (entity) => <SparkPreview entity={entity} />,
  }),
  challenges: defineContent<Challenge>({
    slug: 'challenges', config: challengesConfig,
    editor: (entity, onSave, onCancel) => <ChallengeEditor challenge={entity} onCancel={onCancel} onSave={onSave} />,
    preview: (entity) => <ChallengePreview entity={entity} />,
  }),
  games: defineContent<GameInstance>({
    slug: 'games', config: gamesConfig,
    editor: (entity, onSave, onCancel) => <GameEditor game={entity} onCancel={onCancel} onSave={onSave} />,
    preview: (entity) => <GamePreview entity={entity} />,
  }),
  'dream-careers': defineContent<CuratedDreamCareer>({
    slug: 'dream-careers', config: curatedDreamCareersConfig,
    editor: (entity, onSave, onCancel) => <DreamCareerEditor entity={entity} onCancel={onCancel} onSave={onSave} />,
    preview: (entity) => <DreamCareerPreview entity={entity} />,
  }),
  'future-directions': defineContent<FutureDirection>({
    slug: 'future-directions', config: futureDirectionsConfig,
    editor: (entity, onSave, onCancel) => <FutureDirectionEditor entity={entity} onCancel={onCancel} onSave={onSave} />,
    preview: (entity) => <FutureDirectionPreview entity={entity} />,
  }),
  'career-sources': defineContent<CuratedCareerSource>({
    slug: 'career-sources', config: careerSourcesConfig,
    editor: (entity, onSave, onCancel) => <CareerSourceEditor entity={entity} onCancel={onCancel} onSave={onSave} />,
    preview: (entity) => <CareerSourcePreview entity={entity} />,
  }),
};

export function getAdminContentDefinition(slug: string) {
  return ADMIN_CONTENT_DEFINITIONS[slug];
}

export function getAdminContentSlug(config: AdminConfig<AdminEntity>) {
  return Object.values(ADMIN_CONTENT_DEFINITIONS).find((definition) => definition.config.collectionName === config.collectionName)?.slug
    || config.collectionName.replaceAll('_', '-');
}
