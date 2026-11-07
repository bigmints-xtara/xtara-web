import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/i18n/language-provider', () => ({ useTranslations: () => ({ locale: 'en' }) }));
vi.mock('@/lib/dream-career-student-guide-api', () => ({ getDreamCareerStudentGuide: mocks.get }));
vi.mock('./DreamCareerStudentGuide', () => ({ DreamCareerStudentGuide: ({ embedded }: { embedded?: boolean }) => <div>{embedded ? 'Compact career details' : 'Full page details'}</div> }));
import CareerPreviewDialog from './CareerPreviewDialog';
describe('career preview dialog', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  });
  afterEach(() => vi.restoreAllMocks());
  it('loads read-only details in compact mode and restores focus on close', async () => {
    mocks.get.mockResolvedValue({});
    const trigger = document.createElement('button'); document.body.appendChild(trigger); trigger.focus();
    const close = vi.fn();
    const view = render(<CareerPreviewDialog career={{ id: 'aero', title: 'Aeronautical Engineer', summary: 'Aircraft engineering' }} onClose={close} />);
    expect(screen.getByRole('dialog', { name: 'Aeronautical Engineer' })).toBeInTheDocument();
    expect(await screen.findByText('Compact career details')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Choose|Remove|Continue/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Back to careers' }));
    expect(close).toHaveBeenCalledOnce();
    view.unmount(); expect(document.activeElement).toBe(trigger); trigger.remove();
  });
  it('offers retry without changing selections when details fail to load', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
    render(<CareerPreviewDialog career={{ id: 'aero', title: 'Aeronautical Engineer', summary: 'Aircraft engineering' }} onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t load');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('Compact career details')).toBeInTheDocument());
  });
  it('clears the previous guide while loading a different career', async () => {
    mocks.get.mockResolvedValueOnce({}).mockImplementationOnce(() => new Promise(() => {}));
    const onClose = vi.fn();
    const view = render(<CareerPreviewDialog career={{ id: 'aero', title: 'Aeronautical Engineer', summary: 'Aircraft' }} onClose={onClose} />);
    expect(await screen.findByText('Compact career details')).toBeInTheDocument();
    const firstSignal = mocks.get.mock.calls[0][1].signal as AbortSignal;
    view.rerender(<CareerPreviewDialog career={{ id: 'robotics', title: 'Robotics Engineer', summary: 'Robots' }} onClose={onClose} />);
    expect(firstSignal.aborted).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Robotics Engineer' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading career details');
    expect(screen.queryByText('Compact career details')).toBeNull();
  });
});
