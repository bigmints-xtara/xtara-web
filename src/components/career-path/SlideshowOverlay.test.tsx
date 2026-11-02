import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import SlideshowOverlay from './SlideshowOverlay';
import type { CareerSlideData } from '@/types/career';
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
const slides: CareerSlideData[] = [
  { type: 'meetDreamCareer', title: 'Meet your careers', subtitle: 'Start with your questions.', slideIcon: 'Compass', buttonLabel: 'Start', visualization: 'intro', content: [{ title: 'Engineer', subtitle: 'Build things.', icon: 'Compass' }, { title: 'Unfilled daily work', subtitle: '', icon: 'Compass' }] },
  { type: 'careerPath', title: 'Study routes', subtitle: 'Explore your options.', slideIcon: 'Route', buttonLabel: 'Next', visualization: 'bento', content: [{ title: 'Subjects', subtitle: 'Discuss your interests.', icon: 'Route' }] },
];
describe('career conversation viewer', () => {
  it('supports previous, direct topic navigation and explicit return without marking progress', () => {
    const close = vi.fn();
    render(<SlideshowOverlay isOpen onClose={close} slides={slides} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.queryByText('Unfilled daily work')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next topic' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Study routes' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Meet your careers' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Study routes' }));
    expect(screen.getByRole('button', { name: 'Study routes' })).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: 'Back to my careers' }));
    expect(close).toHaveBeenCalledOnce();
  });
  it('handles Escape, restores focus and scroll, and restarts on reopening', () => {
    const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus();
    const close = vi.fn();
    const view = render(<SlideshowOverlay isOpen onClose={close} slides={slides} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next topic' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(close).toHaveBeenCalledOnce();
    view.rerender(<SlideshowOverlay isOpen={false} onClose={close} slides={slides} />);
    expect(trigger).toHaveFocus(); expect(document.body.style.overflow).not.toBe('hidden');
    view.rerender(<SlideshowOverlay isOpen onClose={close} slides={slides} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    view.unmount(); trigger.remove();
  });
});
