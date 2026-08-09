import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ADMIN_CONTENT_DEFINITIONS, getAdminContentSlug } from './adminContentRegistry';

describe('admin content registry', () => {
  afterEach(cleanup);

  it('covers every content type exposed in admin navigation', () => {
    expect(Object.keys(ADMIN_CONTENT_DEFINITIONS)).toEqual([
      'stories', 'good-reads', 'sparks', 'challenges', 'games', 'game-templates',
      'dream-careers', 'future-directions', 'career-sources',
    ]);
  });

  it('provides a functioning preview renderer and stable route for every content type', () => {
    for (const definition of Object.values(ADMIN_CONTENT_DEFINITIONS)) {
      const entity = { id: `${definition.slug}-1`, ...definition.config.createEmpty() };
      const rendered = render(<>{definition.renderPreview(entity)}</>);
      expect(rendered.container.firstElementChild).not.toBeNull();
      expect(getAdminContentSlug(definition.config)).toBe(definition.slug);
      rendered.unmount();
    }
  });
});
