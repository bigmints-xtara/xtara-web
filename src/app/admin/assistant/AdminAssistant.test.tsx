import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getConfig: vi.fn(),
  listConversations: vi.fn(),
  getMessages: vi.fn(),
  updateConversation: vi.fn(),
  chat: vi.fn(),
}));

vi.mock('@/lib/admin-agent', () => ({ adminAgentApi: api }));

import AdminAssistantPage from './page';

const conversation = {
  id: 'conversation-1',
  title: 'Career resilience article',
  status: 'open' as const,
  preview: 'Created the draft Good Read.',
  messageCount: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('admin assistant conversation history', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getConfig.mockResolvedValue({
      enabled: true,
      activeProviderId: 'gx10',
      providerName: 'GX10',
      baseUrl: 'http://gx10.internal:8080/v1',
      model: 'ornith-1.0-35b',
      apiMode: 'chat_completions',
      hasApiKey: false,
      providers: [],
    });
    api.listConversations.mockResolvedValue([conversation]);
    api.getMessages.mockResolvedValue([
      { id: 'message-1', conversationId: conversation.id, role: 'user', content: 'Create a Good Read.', createdAt: new Date().toISOString() },
      { id: 'message-2', conversationId: conversation.id, role: 'assistant', content: 'Created the draft Good Read.', createdAt: new Date().toISOString() },
    ]);
  });

  it('loads a selected thread and fully unmounts collapsed desktop history', async () => {
    render(<AdminAssistantPage />);
    expect(await screen.findByText('Career resilience article')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Career resilience article'));
    expect(await screen.findByText('Created the draft Good Read.')).toBeInTheDocument();
    expect(api.getMessages).toHaveBeenCalledWith('conversation-1');

    fireEvent.click(screen.getByLabelText('Close history'));
    expect(screen.queryByRole('complementary', { name: 'Conversation history' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('New chat'));
    expect(screen.queryByText('Created the draft Good Read.')).not.toBeInTheDocument();
    expect(screen.getByText('What should we work on?')).toBeInTheDocument();
  });

  it('renames and confirmation-gates archiving from conversation actions', async () => {
    api.updateConversation
      .mockResolvedValueOnce({ ...conversation, title: 'Renamed thread' })
      .mockResolvedValueOnce({ ...conversation, title: 'Renamed thread', status: 'archived' });

    render(<AdminAssistantPage />);
    await screen.findByText('Career resilience article');

    fireEvent.pointerDown(screen.getByLabelText('Actions for Career resilience article'), { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const renameDialog = screen.getByRole('dialog', { name: 'Rename conversation' });
    fireEvent.change(within(renameDialog).getByRole('textbox'), { target: { value: 'Renamed thread' } });
    fireEvent.click(within(renameDialog).getByRole('button', { name: 'Rename' }));
    await waitFor(() => expect(api.updateConversation).toHaveBeenCalledWith('conversation-1', { title: 'Renamed thread' }));
    expect(await screen.findByText('Renamed thread')).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByLabelText('Actions for Renamed thread'), { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Archive' }));
    const archiveDialog = screen.getByRole('dialog', { name: 'Archive conversation?' });
    expect(within(archiveDialog).getByText(/removed from your active history/i)).toBeInTheDocument();
    fireEvent.click(within(archiveDialog).getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(api.updateConversation).toHaveBeenCalledWith('conversation-1', { status: 'archived' }));
    expect(screen.queryByText('Renamed thread')).not.toBeInTheDocument();
  });

  it('distinguishes a configured but disabled provider from a missing provider', async () => {
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

    render(<AdminAssistantPage />);

    expect(await screen.findByText('Admin assistant is disabled')).toBeInTheDocument();
    expect(screen.getByText(/OR and deepseek\/deepseek-v4-flash are configured/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enable assistant' })).toHaveAttribute('href', '/admin/settings');
    expect(screen.queryByText('Connect a compatible model')).not.toBeInTheDocument();
  });
});
