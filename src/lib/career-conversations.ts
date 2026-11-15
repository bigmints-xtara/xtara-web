import { xtaraApi } from './api/client';
export type CareerConversation = {
  id: string; version: number; membershipId: string; organizationId: string; studentUserId: string;
  studentName: string; educatorUserId: string; educatorName: string; title: string; recap: string;
  occurredOn: string; followUpOn: string | null; createdAt: string; updatedAt: string;
  actions: Array<{ id: string; text: string; owner: 'student' | 'educator'; completedAt: string | null; completedBy: string | null }>;
  reflection: string; reflectionAt: string | null; reviewedAt: string | null; reviewedBy: string | null;
  canWrite: boolean; checkInState: 'due' | 'upcoming' | 'reviewed' | 'unscheduled'; completedActions: number;
};
export type ConversationPage = { items: CareerConversation[]; nextOffset: number | null; canRecord: boolean };
export type ConversationInput = { requestId: string; title: string; recap: string; occurredOn: string; followUpOn: string | null; actions: Array<{ text: string; owner: 'student' | 'educator' }> };
export type ConversationMutation = { version: number } & (
  { kind: 'action'; actionId: string; completed: boolean } | { kind: 'reflection'; reflection: string } |
  { kind: 'review'; reviewed: boolean } | { kind: 'edit'; title: string; recap: string; followUpOn: string | null }
);
const path = (membershipId?: string) => membershipId ? `/organizations/students/${encodeURIComponent(membershipId)}/conversations` : '/me/conversations';
const options = (uid: string) => ({ expectedUserId: uid, credentials: 'omit' as const, cache: 'no-store' as const });
export function getConversations(uid: string, membershipId?: string, offset = 0) { return xtaraApi.get<ConversationPage>(`${path(membershipId)}?offset=${offset}`, options(uid)); }
export function getTeacherConversations(uid: string, offset = 0) { return xtaraApi.get<ConversationPage>(`/organizations/conversations?offset=${offset}`, options(uid)); }
export async function shareConversation(uid: string, membershipId: string, input: ConversationInput) {
  const written = await xtaraApi.post<CareerConversation>(path(membershipId), input, options(uid));
  const saved = await xtaraApi.get<CareerConversation>(`${path(membershipId)}/${encodeURIComponent(written.id)}`, options(uid));
  if (saved.id !== written.id || saved.membershipId !== membershipId || saved.version < written.version || saved.title !== input.title.trim() || saved.recap !== input.recap.trim() || saved.occurredOn !== input.occurredOn || saved.followUpOn !== input.followUpOn || JSON.stringify(saved.actions.map(({ text, owner }) => ({ text, owner }))) !== JSON.stringify(input.actions.map(({ text, owner }) => ({ text: text.trim(), owner })))) throw new Error('The saved conversation did not match the readback. Please retry.');
  return saved;
}
export async function updateConversation(uid: string, conversation: CareerConversation, input: ConversationMutation, membershipId?: string) {
  const url = `${path(membershipId)}/${encodeURIComponent(conversation.id)}`;
  const written = await xtaraApi.patch<CareerConversation>(url, input, options(uid));
  const saved = await xtaraApi.get<CareerConversation>(url, options(uid));
  const matches = input.kind === 'action' ? saved.actions.some(action => action.id === input.actionId && Boolean(action.completedAt) === input.completed)
    : input.kind === 'reflection' ? saved.reflection === input.reflection.trim()
    : input.kind === 'review' ? Boolean(saved.reviewedAt) === input.reviewed
    : saved.title === input.title.trim() && saved.recap === input.recap.trim() && saved.followUpOn === input.followUpOn;
  if (saved.id !== conversation.id || saved.version < written.version || !matches) throw new Error('Your update could not be verified. Refresh before trying again.');
  return saved;
}
