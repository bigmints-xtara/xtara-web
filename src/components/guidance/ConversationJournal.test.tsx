import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/i18n/language-provider';
import { ConversationJournal, StudentGuidanceEntry } from './ConversationJournal';
import copy from '@/lib/career-conversation-copy.json';
const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), update: vi.fn(), user: { uid: 'student', isAnonymous: false } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, loading: false }) }));
vi.mock('@/lib/career-conversations', () => ({ getConversations: mocks.get, shareConversation: mocks.save, updateConversation: mocks.update, getTeacherConversations: vi.fn() }));
const record = { id: 'one', version: 1, membershipId: 'member', studentName: 'Avani', educatorName: 'Teacher', title: 'A design idea', recap: 'Try sketching a poster.', occurredOn: '2026-11-14', createdAt: '2026-11-14', followUpOn: '2026-11-20', checkInState: 'upcoming', canWrite: true, completedActions: 0, actions: [{ id: 'one', text: 'Sketch a poster', owner: 'student', completedAt: null }, { id: 'two', text: 'Find an example', owner: 'educator', completedAt: null }], reflection: '', reflectionAt: null, reviewedAt: null };
function show(teacher = false, locale: 'en' | 'ml' | 'hi' | 'ta' = 'en') { return render(<LanguageProvider initialLocale={locale}><ConversationJournal membershipId={teacher ? 'member' : undefined} studentName="Avani" /></LanguageProvider>); }
beforeEach(() => { mocks.get.mockReset(); mocks.save.mockReset(); mocks.update.mockReset(); mocks.get.mockResolvedValue({ items: [record], nextOffset: null, canRecord: false }); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } }); });
it('students complete only their own steps and share reflections after verified save', async () => {
  show(); await screen.findByText(record.title);
  expect(screen.getByRole('checkbox', { name: /Find an example/ })).toBeDisabled();
  mocks.update.mockResolvedValue({ ...record, version: 2, reflection: 'I enjoyed making it.' });
  fireEvent.change(screen.getByRole('textbox', { name: copy.en.reflection }), { target: { value: 'I enjoyed making it.' } });
  fireEvent.click(screen.getByRole('button', { name: copy.en.shareReflection }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('student', expect.objectContaining({id:'one'}), { kind: 'reflection', version: 1, reflection: 'I enjoyed making it.' }, undefined));
  expect(await screen.findByText(copy.en.saved)).toBeInTheDocument();
});
it('failed student save preserves typed reflection and offers list refresh', async () => {
  show(); await screen.findByText(record.title); mocks.update.mockRejectedValue(new Error('Connection interrupted'));
  fireEvent.change(screen.getByRole('textbox', { name: copy.en.reflection }), { target: { value: 'Keep my draft' } }); fireEvent.click(screen.getByRole('button', { name: copy.en.shareReflection }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted'); expect(screen.getByRole('textbox')).toHaveValue('Keep my draft'); expect(screen.getByRole('button', { name: copy.en.refresh })).toBeEnabled();
});
it('teacher records explicitly shared recap and retains draft on failure', async () => {
  mocks.get.mockResolvedValue({ items: [], nextOffset: null, canRecord: true }); show(true); fireEvent.click(await screen.findByRole('button', { name: copy.en.record }));
  const form = screen.getByRole('form', { name: copy.en.record }); expect(within(form).getByText(copy.en.sharedNotice)).toBeInTheDocument();
  fireEvent.change(within(form).getByRole('textbox', { name: copy.en.title }), { target: { value: record.title } });
  fireEvent.change(within(form).getByRole('textbox', { name: new RegExp(copy.en.recap) }), { target: { value: record.recap } });
  mocks.save.mockRejectedValueOnce(new Error('Retry save')).mockResolvedValue(record);
  fireEvent.click(within(form).getByRole('button', { name: copy.en.share })); expect(await screen.findByRole('alert')).toHaveTextContent('Retry save');
  expect(within(form).getByRole('textbox', { name: copy.en.title })).toHaveValue(record.title);
  fireEvent.click(within(form).getByRole('button', { name: copy.en.share })); expect(await screen.findByRole('article', { name: record.title })).toBeInTheDocument();
  expect(mocks.save.mock.calls[0][2].requestId).toBe(mocks.save.mock.calls[1][2].requestId);
});
it('loading, retry, empty and paused sharing are explicit', async () => {
  mocks.get.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue({ items: [{ ...record, canWrite: false }], nextOffset: null, canRecord: false }); show(); expect(screen.getByRole('status', { name: copy.en.loading })).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: copy.en.retry })); expect(await screen.findByText(copy.en.readOnly)).toBeInTheDocument(); expect(screen.getByRole('textbox')).toBeDisabled();
});
for (const locale of ['ml','hi','ta'] as const) it(`shared journal entry is shown in ${locale}`, async () => { render(<LanguageProvider initialLocale={locale}><StudentGuidanceEntry /></LanguageProvider>); expect(await screen.findByRole('link', { name: copy[locale].openJournal })).toHaveAttribute('href','/guidance'); });

it('keeps the teacher journal off Home when the account has no shared conversations', async () => {
  mocks.get.mockResolvedValue({ items: [], nextOffset: null, canRecord: false });
  render(<LanguageProvider initialLocale="en"><StudentGuidanceEntry /></LanguageProvider>);
  await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('student'));
  expect(screen.queryByRole('link', { name: copy.en.openJournal })).toBeNull();
});
