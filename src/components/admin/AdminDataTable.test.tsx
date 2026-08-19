import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AdminDataTable from './AdminDataTable';
import type { AdminTableQuery, AdminTableResult } from '@/lib/admin-table';

type Row = { id: string; name: string; status: string };

const query: AdminTableQuery = {
  page: 1, pageSize: 20, search: '', filters: {}, sort: { field: 'name', direction: 'asc' },
};
const result: AdminTableResult<Row> = {
  items: [{ id: '1', name: 'Alpha', status: 'draft' }, { id: '2', name: 'Beta', status: 'published' }],
  page: 1, pageSize: 20, total: 42, totalPages: 3,
  facets: [{ field: 'status', values: [{ value: 'draft', label: 'Draft', count: 20 }, { value: 'published', label: 'Published', count: 22 }] }],
  groups: [],
  summaries: [{ key: 'total', label: 'Matching', value: 42 }, { key: 'published', label: 'Published', value: 22 }],
};

describe('AdminDataTable', () => {
  it('drives server sort, filters, grouping, pagination, and search', () => {
    const onQueryChange = vi.fn();
    render(<AdminDataTable
      columns={[
        { id: 'name', label: 'Name', sortable: true, cell: (row) => row.name },
        { id: 'status', label: 'Status', cell: (row) => row.status },
      ]}
      groupFields={[{ value: 'status', label: 'Status' }]}
      onQueryChange={onQueryChange}
      query={query}
      result={result}
      rowId={(row) => row.id}
      title="Records"
    />);
    expect(screen.getByText('42')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ sort: { field: 'name', direction: 'desc' }, page: 1 }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search Records' }), { target: { value: 'alpha' } });
    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'alpha', page: 1 }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('selects a page first and requires an explicit action for all matching rows', () => {
    const onBulkAction = vi.fn();
    render(<AdminDataTable
      bulkActions={[{ value: 'archive', label: 'Archive' }]}
      columns={[{ id: 'name', label: 'Name', cell: (row) => row.name }]}
      onBulkAction={onBulkAction}
      onQueryChange={() => undefined}
      query={query}
      result={result}
      rowId={(row) => row.id}
      title="Records"
    />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all records on this page' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select all 42 matching records' }));
    expect(screen.getByText('All 42 matching records selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Archive selected' }));
    expect(onBulkAction).toHaveBeenCalledWith('archive', {
      mode: 'query', query, excludedIds: [], expectedCount: 42,
    });
  });
});
