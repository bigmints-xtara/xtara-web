import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: null as null | { uid: string; isAnonymous: boolean }, hydrate: vi.fn(), save: vi.fn(), catalog: vi.fn(), assessment: vi.fn(), plan: vi.fn(), replace: vi.fn(), compatible: vi.fn() }));
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user, loading: false }) }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/assessment-v2', () => ({ loadDiscoveryResult: mocks.assessment }));
vi.mock('@/lib/direction', () => ({ loadDirectionPlan: mocks.plan }));
vi.mock('@/lib/discovery-save', () => ({ hydrateDiscoveryFromAccount: mocks.hydrate, savePendingCareerChoiceToAccount: mocks.save }));
vi.mock('@/lib/curated-career-api', () => ({ getPublishedCareerCatalog: mocks.catalog }));
vi.mock('@/lib/exploration-access', () => ({ isDirectionPlanCompatible: mocks.compatible }));
import SaveChoicesPage from './page';
describe('save choices summary', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.user = null;
    mocks.assessment.mockReturnValue({}); mocks.compatible.mockReturnValue(true);
    mocks.plan.mockReturnValue({ areaId: 'engineering', dreamCareerIds: ['aero'] });
    mocks.catalog.mockResolvedValue({ directions: [{ id: 'engineering', roleIds: ['aero'], translations: { en: { title: 'Engineering' } } }], roles: [{ id: 'aero', futureDirectionIds: ['engineering'], translations: { en: { title: 'Aeronautical Engineer' } } }] });
    mocks.hydrate.mockResolvedValue(null); mocks.save.mockResolvedValue(true);
  });
  it('shows the guest summary and preserves choices through signup or login to the dashboard', async () => {
    render(<SaveChoicesPage />);
    await screen.findByRole('heading', { name: 'Save your choices' });
    expect(screen.getByText('Aeronautical Engineer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Save my choices' })).toHaveAttribute('href', '/signup?saveDiscovery=1&next=%2Fdashboard');
    expect(screen.getByRole('link', { name: /Already/ })).toHaveAttribute('href', '/login?saveDiscovery=1&next=%2Fdashboard');
    expect(screen.getByRole('link', { name: 'Back to careers' })).toHaveAttribute('href', '/assessment/careers/engineering');
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('saves signed-in choices then goes directly to My Direction', async () => {
    mocks.user = { uid: 'student', isAnonymous: false };
    render(<SaveChoicesPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save my choices' }));
    await act(async () => {});
    expect(mocks.hydrate).toHaveBeenCalledOnce();
    expect(mocks.save).toHaveBeenCalledWith('student');
    expect(mocks.replace).toHaveBeenCalledWith('/dashboard');
  });
  it('keeps the summary and provides retry when saving fails', async () => {
    mocks.user = { uid: 'student', isAnonymous: false }; mocks.save.mockRejectedValueOnce(new Error('offline'));
    render(<SaveChoicesPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save my choices' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t save');
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save my choices' }));
    await act(async () => {});
    expect(mocks.replace).toHaveBeenCalledWith('/dashboard');
  });
  it('does not show stale local choices if account hydration fails', async () => {
    mocks.user = { uid: 'student', isAnonymous: false }; mocks.hydrate.mockRejectedValueOnce(new Error('offline'));
    render(<SaveChoicesPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t load');
    expect(screen.queryByText('Aeronautical Engineer')).toBeNull();
  });
  it('offers results when choices are missing', async () => {
    mocks.plan.mockReturnValue(null); render(<SaveChoicesPage />);
    expect(await screen.findByRole('link', { name: 'Back to your results' })).toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('ignores a completed save after the page unmounts', async () => {
    mocks.user = { uid: 'student', isAnonymous: false };
    let resolve!: (value: boolean) => void;
    mocks.save.mockReturnValue(new Promise((done) => { resolve = done; }));
    const view = render(<SaveChoicesPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save my choices' }));
    view.unmount(); await act(async () => resolve(true));
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
