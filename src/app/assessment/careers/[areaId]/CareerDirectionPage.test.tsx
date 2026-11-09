import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ push: vi.fn(), catalog: vi.fn(), hydrate: vi.fn(), save: vi.fn(), user: null as null | { uid: string; isAnonymous: boolean } }));
vi.mock('next/navigation', () => ({ useParams: () => ({ areaId: 'engineering-and-built-world' }), useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/components/careers/CareerPreviewDialog', () => ({ default: ({ career, onClose }: { career: { title: string }; onClose: () => void }) => <div role="dialog"><h2>{career.title}</h2><button onClick={onClose}>Back to careers</button></div> }));
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/curated-career-api', () => ({ getPublishedCareerCatalog: mocks.catalog }));
vi.mock('@/lib/exploration-access', () => ({ canAccessPursuedArea: () => true }));
vi.mock('@/lib/discovery-save', () => ({ hydrateDiscoveryFromAccount: mocks.hydrate, savePendingCareerChoiceToAccount: vi.fn() }));
vi.mock('@/lib/direction-api', () => ({ saveDirectionToApi: mocks.save }));
import CareerDirectionPage from './page';
import { createAreaDirectionPlan, saveDirectionPlan, loadDirectionPlan } from '@/lib/direction';
const catalog = { directions: [{ id: 'engineering-and-built-world', translations: { en: { title: 'API engineering direction' } } }], roles: [] };
describe('API-backed career direction page', () => {
  beforeEach(() => { window.history.replaceState({}, '', '/'); mocks.push.mockReset(); mocks.catalog.mockReset(); mocks.user = null; mocks.hydrate.mockReset(); mocks.save.mockReset(); });
  it('preserves anonymous selection when a guide is opened and the chooser remounts', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    saveDirectionPlan(createAreaDirectionPlan('engineering-and-built-world'));
    mocks.catalog.mockResolvedValue({
      directions: [{ ...catalog.directions[0], roleIds: ['aeronautical-engineer'] }],
      roles: [{ id: 'aeronautical-engineer', futureDirectionIds: ['engineering-and-built-world'], translations: { en: { title: 'Aeronautical Engineer', summary: 'Aircraft engineering' } } }],
    });
    const view = render(<CareerDirectionPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Choose Aeronautical Engineer' }));
    expect(loadDirectionPlan()?.dreamCareerIds).toEqual(['aeronautical-engineer']);
    fireEvent.click(screen.getByRole('button', { name: 'Aeronautical Engineer' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to careers' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Remove Aeronautical Engineer' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-such-career' } });
    expect(screen.getByRole('status')).toHaveTextContent('No careers found');
    expect(loadDirectionPlan()?.dreamCareerIds).toEqual(['aeronautical-engineer']);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Remove Aeronautical Engineer' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(mocks.push).toHaveBeenCalledWith('/assessment/save');
    view.unmount();
    render(<CareerDirectionPage />);
    expect(await screen.findByRole('button', { name: 'Remove Aeronautical Engineer' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('persists signed-in selections through account readback before showing success', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    mocks.user = { uid: 'student-1', isAnonymous: false };
    mocks.hydrate.mockImplementation(async () => { saveDirectionPlan(createAreaDirectionPlan('engineering-and-built-world')); return null; });
    let resolveSave!: (plan: ReturnType<typeof createAreaDirectionPlan>) => void;
    mocks.save.mockImplementation(() => new Promise((resolve) => { resolveSave = resolve; }));
    mocks.catalog.mockResolvedValue({
      directions: [{ ...catalog.directions[0], roleIds: ['aeronautical-engineer'] }],
      roles: [{ id: 'aeronautical-engineer', futureDirectionIds: ['engineering-and-built-world'], translations: { en: { title: 'Aeronautical Engineer', summary: 'Aircraft engineering' } } }],
    });
    render(<CareerDirectionPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Choose Aeronautical Engineer' }));
    expect(screen.getByRole('button', { name: 'Aeronautical Engineer' })).toBeDisabled();
    await act(async () => resolveSave(mocks.save.mock.calls[0][0]));
    expect(await screen.findByRole('button', { name: 'Remove Aeronautical Engineer' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aeronautical Engineer' })).toBeEnabled();
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ dreamCareerIds: ['aeronautical-engineer'] }), 'student-1');
    expect(loadDirectionPlan()?.dreamCareerIds).toEqual(['aeronautical-engineer']);
  });
  it('opens a published direction absent from the bundled catalogue', async () => {
    mocks.catalog.mockResolvedValue(catalog);
    render(<CareerDirectionPage />);
    expect(await screen.findByRole('heading', { name: 'API engineering direction' })).toBeInTheDocument();
    expect(screen.queryByText('We could not find this career page.')).toBeNull();
  });
  it('shows a retry on API failure and never substitutes bundled content', async () => {
    mocks.catalog.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(catalog);
    render(<CareerDirectionPage />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByRole('heading', { name: 'API engineering direction' })).toBeInTheDocument();
    expect(mocks.catalog).toHaveBeenCalledTimes(2);
  });
});
