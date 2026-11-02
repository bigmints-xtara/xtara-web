import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ catalog: vi.fn() }));
vi.mock('next/navigation', () => ({ useParams: () => ({ areaId: 'engineering-and-built-world' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/curated-career-api', () => ({ getPublishedCareerCatalog: mocks.catalog }));
vi.mock('@/lib/exploration-access', () => ({ canAccessPursuedArea: () => true }));
import CareerDirectionPage from './page';
const catalog = { directions: [{ id: 'engineering-and-built-world', translations: { en: { title: 'API engineering direction' } } }], roles: [] };
describe('API-backed career direction page', () => {
  beforeEach(() => mocks.catalog.mockReset());
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
