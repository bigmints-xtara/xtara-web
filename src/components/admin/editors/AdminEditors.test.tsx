import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  xtaraApi: {
    get: vi.fn().mockResolvedValue({
      taxonomy: {
        futureDirections: [{ id: 'qa-testing', label: 'Quality assurance', status: 'published' }],
        dreamCareers: [{ id: 'quality-assurance', label: 'QA specialist', status: 'published', futureDirectionIds: ['qa-testing'] }],
        skills: [{ id: 'testing', label: 'testing', status: 'active' }],
        gradeStages: [{ id: 'grade8', label: 'Grade 8', status: 'active' }],
      },
      coverage: { totals: { total: 10, mapped: 8, coveragePercent: 80 } },
    }),
  },
}));

import { createEmptyFutureDirection, futureDirectionsConfig } from '@/lib/admin/configs/futureDirectionsConfig';
import type { Story } from '@/types/admin';
import StoryEditor from './StoryEditor';

describe('admin content editors', () => {
  it('creates and submits editable Story slides instead of rendering a placeholder', async () => {
    const onSave = vi.fn<(data: Partial<Story>) => Promise<void>>().mockResolvedValue(undefined);
    render(<StoryEditor story={null} onSave={onSave} onCancel={() => undefined} />);

    fireEvent.change(screen.getByPlaceholderText('Enter story title'), { target: { value: 'QA Story' } });
    fireEvent.change(screen.getByPlaceholderText('Enter story description'), { target: { value: 'A tested story.' } });
    await screen.findByRole('option', { name: 'Quality assurance (qa-testing)' });
    fireEvent.change(screen.getByLabelText('Future Directions'), { target: { value: 'qa-testing' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add slide' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Slide 1 title' }), { target: { value: 'First step' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Slide 1 description' }), { target: { value: 'Verify persistence.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      title: 'QA Story',
      futureDirectionIds: ['qa-testing'],
      slides: [{ title: 'First step', description: 'Verify persistence.' }],
    });
    expect(screen.queryByText(/available in a future update/i)).not.toBeInTheDocument();
  });

  it('reports all required Future Direction draft fields before calling the API', () => {
    const empty = createEmptyFutureDirection();
    expect(futureDirectionsConfig.validateEntity?.(empty)).toBe('Stable slug is required');
    expect(futureDirectionsConfig.validateEntity?.({
      ...empty,
      slug: 'qa-direction',
      translations: { en: { title: 'QA', summary: 'Test', reflectionPrompt: '' } },
      roleIds: ['qa-role'],
      skillIds: ['qa-skill'],
      signalWeights: { analysis: 2 },
      provenance: { ...empty.provenance, sourceIds: ['qa-source'] },
    })).toBe('English guidance for Grade 8 is required');
  });
});
