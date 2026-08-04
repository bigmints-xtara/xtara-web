import { xtaraApi } from '@/lib/api/client';
import type { AdminConfig, AdminEntity } from '@/types/admin';

type Unsubscribe = () => void;

export interface AdminPageParams {
  page: number;
  limit: number;
  status?: string;
  domain?: string;
  searchQuery?: string;
}

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  availableDomains: string[];
}

const ENTITY_SLUGS: Record<string, string> = {
  stories: 'stories',
  sparks: 'sparks',
  challenges: 'challenges',
  good_reads: 'good-reads',
  dream_careers: 'dream_careers',
  future_directions: 'future_directions',
  career_sources: 'career_sources',
  career_paths: 'career_paths',
  career_tools: 'career_tools',
  game_instances: 'game_instances',
  game_templates: 'game_templates',
  games: 'games',
};

type ListResponse<T> = {
  items?: T[];
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  availableDomains?: string[];
} | T[];

function itemsFrom<T>(response: ListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items || response.data || [];
}

export class AdminService<T extends AdminEntity> {
  private config: AdminConfig<T>;
  private slug: string;

  constructor(config: AdminConfig<T>) {
    this.config = config;
    this.slug = ENTITY_SLUGS[config.collectionName] || config.collectionName;
  }

  async getPage(params: AdminPageParams): Promise<AdminPage<T>> {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.domain && params.domain !== 'all') query.set('domain', params.domain);
    if (params.searchQuery?.trim()) query.set('q', params.searchQuery.trim());
    if (this.config.orderByField) query.set('sort', this.config.orderByField);
    if (this.config.orderByDirection) query.set('order', this.config.orderByDirection);

    const response = await xtaraApi.get<ListResponse<T>>(
      `/admin/content/${this.slug}?${query.toString()}`,
    );
    const items = itemsFrom(response).map((item) => this.config.fromFirestore(
      item as unknown as Record<string, unknown>,
      item.id,
    ));
    if (Array.isArray(response)) {
      return {
        items,
        total: items.length,
        page: params.page,
        limit: params.limit,
        totalPages: items.length ? 1 : 0,
        availableDomains: this.config.getAvailableDomains(items),
      };
    }

    return {
      items,
      total: response.total ?? items.length,
      page: response.page ?? params.page,
      limit: response.limit ?? params.limit,
      totalPages: response.totalPages ?? (items.length ? 1 : 0),
      availableDomains: response.availableDomains || this.config.getAvailableDomains(items),
    };
  }

  streamPage(
    params: AdminPageParams,
    callback: (page: AdminPage<T>) => void,
    onError?: (error: Error) => void,
  ): Unsubscribe {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const page = await this.getPage(params);
        if (!cancelled) callback(page);
      } catch (error) {
        if (!cancelled && onError) onError(error instanceof Error ? error : new Error('Failed to load admin content'));
      }
    };

    load();
    timer = setInterval(load, 30000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }

  async getById(id: string): Promise<T | null> {
    const item = await xtaraApi.get<T>(`/admin/content/${this.slug}/${id}`);
    return item ? this.config.fromFirestore(item as unknown as Record<string, unknown>, item.id) : null;
  }

  async create(data: Partial<T>): Promise<string> {
    const created = await xtaraApi.post<{ id: string }>(`/admin/content/${this.slug}`, data);
    return created.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await xtaraApi.patch(`/admin/content/${this.slug}/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await xtaraApi.delete(`/admin/content/${this.slug}/${id}`);
  }

  async publish(id: string): Promise<void> {
    await xtaraApi.post(`/admin/content/${this.slug}/${id}/publish`);
  }

  async unpublish(id: string): Promise<void> {
    await xtaraApi.post(`/admin/content/${this.slug}/${id}/unpublish`);
  }

  async duplicate(id: string): Promise<string> {
    const duplicated = await xtaraApi.post<{ id: string }>(`/admin/content/${this.slug}/${id}/duplicate`);
    return duplicated.id;
  }
}

export default AdminService;
