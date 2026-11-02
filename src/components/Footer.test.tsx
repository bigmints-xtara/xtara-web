import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MarketingFooter from './Footer';
import DashboardFooter from './layout/Footer';
import { LanguageProvider } from '@/i18n/language-provider';
import { mvpNavigationCopy } from '@/lib/mvp-navigation';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), workspace: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: mocks.auth }));
vi.mock('@/context/OrganizationContext', () => ({ useOrganizationWorkspace: mocks.workspace }));

describe.each([['marketing', MarketingFooter], ['dashboard', DashboardFooter]] as const)('%s student MVP footer', (_name, Footer) => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({ user: { uid: 'student' } });
    mocks.workspace.mockReturnValue({ isStaff: false, loading: false, error: null });
  });
  it.each(['en', 'ml', 'hi', 'ta'] as const)('keeps student destinations and essential links in %s', (locale) => {
    render(<LanguageProvider initialLocale={locale}><Footer /></LanguageProvider>);
    const copy = mvpNavigationCopy[locale];
    expect(screen.getByRole('link', { name: copy.myDirection })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: copy.exploreCareers })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: copy.profile })).toHaveAttribute('href', '/profile');
    const paths = Array.from(document.querySelectorAll('footer a')).map(link => link.getAttribute('href'));
    expect(paths).not.toContain('/news');
    expect(paths).not.toContain('/about');
    expect(paths).toEqual(expect.arrayContaining(['/contact', '/privacy-policy', '/terms-of-use']));
  });
  it('preserves public marketing links', () => {
    mocks.auth.mockReturnValue({ user: null });
    render(<LanguageProvider initialLocale="en"><Footer /></LanguageProvider>);
    expect(document.querySelector('a[href="/news"]')).not.toBeNull();
  });
  it('does not show marketing feeds while workspace access is unresolved', () => {
    mocks.workspace.mockReturnValue({ isStaff: false, loading: true });
    render(<LanguageProvider initialLocale="en"><Footer /></LanguageProvider>);
    expect(document.querySelector('a[href="/news"]')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Explore Careers' })).not.toBeInTheDocument();
  });
});
