import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import MvpRouteBoundary from './MvpRouteBoundary';
import { isMvpDeferredRoute } from '@/lib/mvp-navigation';
vi.mock('@/components/Header', () => ({ default: () => <nav>Navigation</nav> }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
describe('MVP route availability', () => {
  it.each(['/careers', '/careers/legacy-role', '/careers/legacy-role/learn/courses', '/learn', '/learn/lesson/1', '/play?game=1', '/achievements', '/notifications', '/dashboard/sparks', '/dashboard/challenges/1', '/dashboard/good-reads'])('defers %s', (path) => {
    expect(isMvpDeferredRoute(path)).toBe(true);
  });
  it.each(['/dashboard', '/explore', '/explore/roles/doctor', '/profile', '/admin/achievements', '/learning-about-careers'])('keeps %s', (path) => {
    expect(isMvpDeferredRoute(path)).toBe(false);
  });
  it('does not mount a deferred feature or its side effects', () => {
    vi.mocked(usePathname).mockReturnValue('/play');
    const mount = vi.fn();
    function HiddenFeature() { mount(); return <div>Game</div>; }
    render(<MvpRouteBoundary><HiddenFeature /></MvpRouteBoundary>);
    expect(mount).not.toHaveBeenCalled();
    expect(screen.getByText(/saved progress has not been deleted/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Careers' })).toHaveAttribute('href', '/explore');
  });
  it('renders retained features', () => {
    vi.mocked(usePathname).mockReturnValue('/profile');
    render(<MvpRouteBoundary><div>Profile content</div></MvpRouteBoundary>);
    expect(screen.getByText('Profile content')).toBeInTheDocument();
  });
});
