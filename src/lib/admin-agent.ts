import { xtaraApi } from '@/lib/api/client';

export type AdminAgentAction = {
  tool: string;
  summary: string;
  targetType?: string;
  targetId?: string;
};

export type AdminAgentMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AdminAgentConversation = {
  id: string;
  title: string;
  status: 'open' | 'archived';
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminAgentStoredMessage = AdminAgentMessage & {
  id: string;
  conversationId: string;
  actions?: AdminAgentAction[];
  createdAt: string;
};

export type AdminAgentDiscoveredModel = {
  id: string;
  displayName: string;
  owner: string;
  contextLength: number | null;
  role: string | null;
  aliasFor: string | null;
  description: string | null;
};

export type AdminAgentProviderConfig = {
  id: string;
  providerName: string;
  baseUrl: string;
  model: string;
  apiMode: 'chat_completions' | 'responses';
  models: AdminAgentDiscoveredModel[];
  hasApiKey: boolean;
  apiKeyHint?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type AdminAgentConfig = {
  enabled: boolean;
  activeProviderId?: string;
  providers: AdminAgentProviderConfig[];
  providerName: string;
  baseUrl: string;
  model: string;
  apiMode: 'chat_completions' | 'responses';
  hasApiKey: boolean;
  apiKeyHint?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type AdminAgentProviderInput = Omit<AdminAgentProviderConfig, 'hasApiKey' | 'apiKeyHint' | 'updatedAt' | 'updatedBy'> & {
  apiKey?: string;
  clearApiKey?: boolean;
};

export const adminAgentApi = {
  getConfig: () => xtaraApi.get<AdminAgentConfig>('/admin/agent/config'),
  updateConfig: (input: Omit<Partial<AdminAgentConfig>, 'providers'> & {
    apiKey?: string;
    clearApiKey?: boolean;
    providers?: AdminAgentProviderInput[];
  }) =>
    xtaraApi.put<AdminAgentConfig>('/admin/agent/config', input),
  discoverModels: (input: { baseUrl: string; apiKey?: string; providerId?: string }) =>
    xtaraApi.post<{ baseUrl: string; models: AdminAgentDiscoveredModel[] }>('/admin/agent/models', input),
  listConversations: (includeArchived = false) => xtaraApi.get<AdminAgentConversation[]>(
    `/admin/agent/conversations${includeArchived ? '?includeArchived=true' : ''}`,
  ),
  createConversation: (title?: string) => xtaraApi.post<AdminAgentConversation>('/admin/agent/conversations', title ? { title } : {}),
  getConversation: (id: string) => xtaraApi.get<AdminAgentConversation>(`/admin/agent/conversations/${encodeURIComponent(id)}`),
  updateConversation: (id: string, changes: { title?: string; status?: 'open' | 'archived' }) =>
    xtaraApi.patch<AdminAgentConversation>(`/admin/agent/conversations/${encodeURIComponent(id)}`, changes),
  getMessages: (conversationId: string) => xtaraApi.get<AdminAgentStoredMessage[]>(
    `/admin/agent/conversations/${encodeURIComponent(conversationId)}/messages`,
  ),
  chat: (messages: AdminAgentMessage[], conversationId?: string | null) => xtaraApi.post<{
    answer: string;
    actions: AdminAgentAction[];
    model: { providerName: string; model: string; apiMode: string };
    conversationId: string;
    conversation: AdminAgentConversation;
  }>('/admin/agent/chat', { messages, ...(conversationId ? { conversationId } : {}) }),
};
