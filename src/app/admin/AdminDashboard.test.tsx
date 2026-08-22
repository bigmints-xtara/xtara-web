import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ xtaraApi: api }));

import AdminDashboard from './page';

describe('admin dashboard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    api.get.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows only functional workspaces when stats are unavailable', async () => {
    api.get.mockRejectedValueOnce(new Error('Permission denied'));

    await act(async () => { root.render(<AdminDashboard />); });

    const links = Array.from(container.querySelectorAll('a'));
    expect(links.length).toBe(11);
    expect(links.every((link) => Boolean(link.getAttribute('href')))).toBe(true);
    expect(container.textContent).not.toMatch(/coming soon|open workspace|not implemented/i);
    expect(container.textContent).not.toContain('Total content');
    expect(container.textContent).toContain('Open admin assistant');
    expect(container.textContent).toContain('Future directions');
    expect(container.textContent).toContain('Phase 1 review');
    expect(container.textContent).toContain('Colleges');
  });

  it('renders real content totals only after the API returns them', async () => {
    api.get.mockResolvedValueOnce({
      grandTotal: 12,
      totalByCollection: { stories: 3, 'good-reads': 2 },
      collections: [
        { byStatus: { published: 4, draft: 2 } },
        { byStatus: { published: 3, draft: 3 } },
      ],
    });

    await act(async () => { root.render(<AdminDashboard />); });
    await vi.waitFor(() => expect(container.textContent).toContain('Total content12'));

    expect(container.textContent).toContain('Published7');
    expect(container.textContent).toContain('Drafts5');
    expect(container.textContent).toContain('3 records');
    expect(container.textContent).toContain('2 records');
  });
});
