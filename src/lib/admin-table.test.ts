import { describe, expect, it } from 'vitest';

import { parseAdminTableQueryParams, type AdminTableQuery } from './admin-table';

const defaults: AdminTableQuery = {
  page: 1,
  pageSize: 25,
  search: '',
  filters: {},
  sort: { field: 'name', direction: 'asc' },
};

describe('parseAdminTableQueryParams', () => {
  it('replaces an unsupported sort and its direction with the table default', () => {
    const params = new URLSearchParams({
      page: '1',
      pageSize: '100',
      search: '',
      sort: 'updatedAt',
      direction: 'desc',
    });

    expect(parseAdminTableQueryParams(params, defaults, { sortFields: ['name', 'city'] })).toMatchObject({
      page: 1,
      pageSize: 100,
      sort: { field: 'name', direction: 'asc' },
    });
  });
});
