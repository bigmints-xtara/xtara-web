import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
  discoverModels: vi.fn(),
}));

vi.mock('@/lib/admin-agent', () => ({ adminAgentApi: api }));
vi.mock('./AdminAccessSettings', () => ({ default: () => <div>Access settings</div> }));

import AdminSettingsPage from './page';

describe('admin provider settings', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    api.getConfig.mockReset();
    api.updateConfig.mockReset();
    api.discoverModels.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders multiple providers with one explicit active provider and selected models', async () => {
    api.getConfig.mockResolvedValueOnce({
      enabled: true,
      activeProviderId: 'gx10',
      providerName: 'GX10',
      baseUrl: 'http://100.77.38.96:8080/v1',
      model: 'ornith-1.0-35b',
      apiMode: 'chat_completions',
      hasApiKey: false,
      providers: [
        {
          id: 'gx10',
          providerName: 'GX10',
          baseUrl: 'http://100.77.38.96:8080/v1',
          model: 'ornith-1.0-35b',
          apiMode: 'chat_completions',
          models: [{
            id: 'ornith-1.0-35b',
            displayName: 'Ornith 1.0 35B',
            owner: 'vllm',
            contextLength: 131072,
            role: 'multi',
            aliasFor: null,
            description: null,
          }],
          hasApiKey: false,
        },
        {
          id: 'lab',
          providerName: 'Local lab',
          baseUrl: 'http://127.0.0.1:11434/v1',
          model: 'lab-model',
          apiMode: 'chat_completions',
          models: [{
            id: 'lab-model',
            displayName: 'Lab model',
            owner: 'local',
            contextLength: null,
            role: null,
            aliasFor: null,
            description: null,
          }],
          hasApiKey: true,
          apiKeyHint: '••••1234',
        },
      ],
    });

    await act(async () => { root.render(<AdminSettingsPage />); });
    await vi.waitFor(() => expect(container.textContent).toContain('GX10'));

    expect(container.textContent).toContain('Agent providers');
    expect(container.textContent).toContain('Local lab');
    expect(container.textContent).toContain('Ornith 1.0 35B');
    expect(container.textContent).toContain('Lab model');
    expect(container.textContent).toContain('Active');
    expect(container.textContent).toContain('Use for chat');
    expect(container.textContent).toContain('A credential is stored (••••1234).');
    expect(container.querySelectorAll('button[aria-label^="Remove "]')).toHaveLength(2);
  });

  it('labels a configured provider as disabled when the assistant switch is off', async () => {
    api.getConfig.mockResolvedValueOnce({
      enabled: false,
      activeProviderId: 'or',
      providerName: 'OR',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'deepseek/deepseek-v4-flash',
      apiMode: 'chat_completions',
      hasApiKey: true,
      providers: [{
        id: 'or',
        providerName: 'OR',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'deepseek/deepseek-v4-flash',
        apiMode: 'chat_completions',
        models: [],
        hasApiKey: true,
      }],
    });

    await act(async () => { root.render(<AdminSettingsPage />); });
    await vi.waitFor(() => expect(container.textContent).toContain('Assistant disabled'));

    expect(container.textContent).not.toContain('Not configured');
  });
});
