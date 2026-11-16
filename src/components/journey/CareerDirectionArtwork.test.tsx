import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/i18n/language-provider';
import type { CareerExplorerResponse } from '@/types/career-explorer';
import CareerDirectionArtwork from './CareerDirectionArtwork';
import DirectionImage from './DirectionImage';
const { getCareerExplorer } = vi.hoisted(() => ({ getCareerExplorer: vi.fn() }));
vi.mock('@/lib/career-explorer-api', () => ({ getCareerExplorer }));
const url = 'https://xtara.ai/xtara-service/career-illustrations/digital.hash.webp';
const response: CareerExplorerResponse = { schemaVersion: 1, locale: 'en', catalogSource: 'database', industries: [], careers: [], directions: [{
  id: 'digital-and-computing', title: 'Digital', summary: '', careerIds: [], industryIds: [], translationFallback: false,
  illustration: { url, alt: 'Published digital illustration', width: 960, height: 960 },
}] };
function show(children: React.ReactNode, locale: 'en' | 'ml' = 'en') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><LanguageProvider initialLocale={locale}>{children}</LanguageProvider></QueryClientProvider>);
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  getCareerExplorer.mockResolvedValue(response);
});
describe('shared Explorer Direction artwork', () => {
  it('uses one locale-scoped public request for organization-sized and journey images', async () => {
    const { container } = show(<><CareerDirectionArtwork directionId="technology" decorative={false} /><DirectionImage directionId="digital-and-computing" /></>);
    expect(await screen.findByRole('img', { name: 'Published digital illustration' })).toHaveAttribute('src', url);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2));
    expect(getCareerExplorer).toHaveBeenCalledTimes(1);
    expect(getCareerExplorer).toHaveBeenCalledWith('en', expect.any(AbortSignal));
    expect(Array.from(container.querySelectorAll('img')).every(img => img.getAttribute('src') === url)).toBe(true);
  });
  it('uses the selected locale and its published alt text', async () => {
    getCareerExplorer.mockResolvedValue({ ...response, locale: 'ml', directions: [{ ...response.directions[0], illustration: { url, alt: 'ഡിജിറ്റൽ ദിശ' } }] });
    show(<CareerDirectionArtwork directionId="technology" decorative={false} />, 'ml');
    expect(await screen.findByRole('img', { name: 'ഡിജിറ്റൽ ദിശ' })).toHaveAttribute('src', url);
    expect(getCareerExplorer).toHaveBeenCalledWith('ml', expect.any(AbortSignal));
  });
  it('keeps an honest fallback while loading, on failed transport, and on failed media', async () => {
    getCareerExplorer.mockRejectedValueOnce(new Error('offline'));
    const failed = show(<CareerDirectionArtwork directionId="technology" fallback={<span>Direction symbol</span>} />);
    expect(screen.getByText('Direction symbol')).toBeInTheDocument();
    await waitFor(() => expect(getCareerExplorer).toHaveBeenCalled());
    expect(failed.container.querySelector('img')).toBeNull();
    failed.unmount();
    const loaded = show(<CareerDirectionArtwork directionId="technology" decorative={false} fallback={<span>Direction symbol</span>} />);
    fireEvent.error(await screen.findByRole('img', { name: 'Published digital illustration' }));
    expect(screen.getByText('Direction symbol')).toBeInTheDocument();
    expect(loaded.container.querySelector('img')).toBeNull();
  });
});
