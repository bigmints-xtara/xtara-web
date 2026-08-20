import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { gamesConfig } from '@/lib/admin/configs/gamesConfig';
import { gameTemplatesConfig } from '@/lib/admin/configs/gameTemplatesConfig';
import type { GameInstance, GameTemplate } from '@/types/admin';
import GameEditor from './GameEditor';
import GameTemplateEditor from './GameTemplateEditor';

const tags = {
  futureDirectionIds: [],
  dreamCareerIds: [],
  skillIds: [],
  gradeStages: [],
  topics: [],
};

function wordQuestGame(overrides: Record<string, unknown> = {}): GameInstance {
  return {
    id: 'wordquest-1',
    title: 'Daily WordQuest',
    mode: 'wordquest',
    isPublished: true,
    published: true,
    draft: false,
    inReview: false,
    content: { targetWord: 'ADMIN' },
    embeddedQuestions: [],
    schedule: {
      startDateTime: new Date('2026-08-19T18:30:00.000Z'),
      endDateTime: new Date('2026-08-20T18:30:00.000Z'),
    },
    ...tags,
    ...overrides,
  } as unknown as GameInstance;
}

function wordQuestTemplate(): GameTemplate {
  return {
    id: 'wordquest-daily',
    title: 'Daily WordQuest',
    description: 'A daily five-letter word game.',
    mode: 'wordquest',
    config: {},
    published: false,
    draft: true,
    inReview: false,
    ...tags,
  } as unknown as GameTemplate;
}

describe('game Admin WordQuest delivery safeguards', () => {
  it('keeps an existing WordQuest selected in the game editor', () => {
    const { container } = render(
      <GameEditor game={wordQuestGame()} onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    const mode = container.querySelector('select');
    expect(mode).toHaveValue('wordquest');
    expect(screen.getByRole('option', { name: 'WordQuest' })).toHaveValue('wordquest');
  });

  it('keeps an existing WordQuest selected in the template editor', () => {
    const { container } = render(
      <GameTemplateEditor template={wordQuestTemplate()} onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(container.querySelector('select')).toHaveValue('wordquest');
    expect(screen.getByRole('option', { name: 'WordQuest' })).toHaveValue('wordquest');
  });

  it('offers WordQuest as a filter domain for games and templates', () => {
    expect(gamesConfig.getAvailableDomains([])).toContain('wordquest');
    expect(gameTemplatesConfig.getAvailableDomains([])).toContain('wordquest');
  });

  it('starts new games on a valid IST midnight-to-midnight daily window', () => {
    const { container } = render(<GameEditor game={null} onSave={vi.fn()} onCancel={vi.fn()} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    const values = Array.from(dateInputs, (input) => input.value);

    expect(values[0]).toMatch(/^\d{4}-\d{2}-\d{2}T00:00$/);
    expect(values[1]).toMatch(/^\d{4}-\d{2}-\d{2}T00:00$/);
    expect(Date.parse(values[1]) - Date.parse(values[0])).toBe(24 * 60 * 60 * 1000);
  });

  it('creates empty Admin game records with a valid IST daily schedule', () => {
    const empty = gamesConfig.createEmpty();
    const issues = gamesConfig.validateEntity?.({
      ...empty,
      title: 'Daily quiz',
      isPublished: true,
      embeddedQuestions: [{ id: 'q1', question: 'Ready?' }],
    });

    expect(issues).toBeNull();
  });

  it('normalizes persisted ISO publication and schedule timestamps for Admin readback', () => {
    const game = gamesConfig.fromFirestore({
      title: 'Daily WordQuest',
      mode: 'wordquest',
      publishedAt: '2026-08-19T20:33:00.000Z',
      schedule: {
        startDateTime: '2026-08-20T18:30:00.000Z',
        endDateTime: '2026-08-21T18:30:00.000Z',
      },
    }, 'wordquest-iso');

    expect(game.publishedAt).toEqual(new Date('2026-08-19T20:33:00.000Z'));
    expect(game.schedule?.startDateTime).toEqual(new Date('2026-08-20T18:30:00.000Z'));
    expect(game.schedule?.endDateTime).toEqual(new Date('2026-08-21T18:30:00.000Z'));
  });

  it('preserves cadence and legacy questions through Admin mapper readback', () => {
    const questions = [{ id: 'legacy-q1', question: 'Legacy ready?' }];
    const game = gamesConfig.fromFirestore({
      title: 'Daily legacy quiz',
      mode: 'quiz',
      questions,
      schedule: {
        startDateTime: '2026-08-20T18:30:00.000Z',
        endDateTime: '2026-08-21T18:30:00.000Z',
        cadence: 'daily',
      },
    }, 'quiz-cadence');
    const stored = gamesConfig.toFirestore(game);

    expect(game.questions).toEqual(questions);
    expect(game.schedule?.cadence).toBe('daily');
    expect(stored.questions).toEqual(questions);
    expect(stored.schedule).toMatchObject({ cadence: 'daily' });
  });

  it('shows missing persisted schedule and playable content without inventing dates', () => {
    const { container } = render(
      <GameEditor
        game={wordQuestGame({ schedule: undefined, content: {}, embeddedQuestions: [] })}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    expect(Array.from(dateInputs, (input) => input.value)).toEqual(['', '']);
    expect(screen.getByText('Start date and time are required.')).toBeInTheDocument();
    expect(screen.getByText('End date and time are required.')).toBeInTheDocument();
    expect(screen.getByText('WordQuest needs a five-letter target word.')).toBeInTheDocument();
  });

  it('shows an invalid schedule window', () => {
    render(
      <GameEditor
        game={wordQuestGame({
          schedule: {
            startDateTime: new Date('2026-08-21T00:00:00.000Z'),
            endDateTime: new Date('2026-08-20T00:00:00.000Z'),
          },
        })}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('End date and time must be after the start.')).toBeInTheDocument();
  });

  it.each([
    ['WordQuest', {
      mode: 'wordquest',
      content: { targetWord: 'ADMIN' },
      embeddedQuestions: [],
      schedule: {
        startDateTime: new Date('2026-08-20T06:30:00.000Z'),
        endDateTime: new Date('2026-08-21T06:30:00.000Z'),
      },
    }],
    ['quiz with a daily template', {
      mode: 'quiz',
      templateId: 'quiz_daily',
      embeddedQuestions: [{ id: 'q1', question: 'Ready?' }],
      schedule: {
        startDateTime: new Date('2026-08-20T06:30:00.000Z'),
        endDateTime: new Date('2026-08-21T06:30:00.000Z'),
      },
    }],
    ['quiz with daily cadence', {
      mode: 'quiz',
      embeddedQuestions: [{ id: 'q1', question: 'Ready?' }],
      schedule: {
        startDateTime: new Date('2026-08-20T06:30:00.000Z'),
        endDateTime: new Date('2026-08-21T06:30:00.000Z'),
        cadence: 'daily',
      },
    }],
  ])('rejects a noon-to-noon %s schedule', (_label, overrides) => {
    render(<GameEditor game={wordQuestGame(overrides)} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Daily games must run from midnight to midnight in Asia/Kolkata.')).toBeInTheDocument();
  });

  it('allows a non-daily quiz to keep a noon-to-noon schedule', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({
      title: 'One-off quiz',
      mode: 'quiz',
      templateId: undefined,
      embeddedQuestions: [{ id: 'q1', question: 'Ready?' }],
      schedule: {
        startDateTime: new Date('2026-08-20T06:30:00.000Z'),
        endDateTime: new Date('2026-08-21T06:30:00.000Z'),
      },
    })} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.queryByText('Daily games must run from midnight to midnight in Asia/Kolkata.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('shows a WordQuest target with the wrong length as not playable', () => {
    render(
      <GameEditor
        game={wordQuestGame({ content: { targetWord: 'TOOLONG' } })}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('WordQuest needs a five-letter target word.')).toBeInTheDocument();
  });

  it('does not treat a bare template ID as playable WordQuest content', () => {
    render(<GameEditor game={wordQuestGame({
      templateId: 'wordquest-daily',
      content: {},
      embeddedQuestions: [],
    })} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('WordQuest needs a five-letter target word.')).toBeInTheDocument();
  });

  it('shows an unresolved template risk and lets an Admin clear a stale template ID', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({ templateId: 'stale-wordquest-template' })} onSave={onSave} onCancel={vi.fn()} />);

    const templateId = screen.getByRole('textbox', { name: 'Template ID (optional)' });
    expect(templateId).toHaveValue('stale-wordquest-template');
    expect(screen.getByText('Template IDs are verified only by the server. Keep embedded playable content and clear or replace stale IDs.')).toBeInTheDocument();

    fireEvent.change(templateId, { target: { value: '' } });
    expect(screen.queryByText('Template IDs are verified only by the server. Keep embedded playable content and clear or replace stale IDs.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0].templateId).toBeNull();
  });

  it('shows an unsupported game mode as not publishable', () => {
    render(
      <GameEditor
        game={wordQuestGame({ mode: 'puzzle', content: { board: ['A'] } })}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('Only Quiz and WordQuest can be published.')).toBeInTheDocument();
  });

  it('does not replace a cleared published schedule value with the current time', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <GameEditor game={wordQuestGame()} onSave={onSave} onCancel={vi.fn()} />,
    );
    const form = container.querySelector('form');
    const start = container.querySelector<HTMLInputElement>('input[type="datetime-local"]');

    fireEvent.change(start!, { target: { value: '' } });
    fireEvent.submit(form!);

    expect(start).toHaveValue('');
    expect(screen.getByText('Start date and time are required.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('allows an existing malformed instance to be saved as a draft with its schedule missing', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({
      schedule: undefined,
      content: {},
      isPublished: true,
      published: false,
      draft: true,
    })} onSave={onSave} onCancel={vi.fn()} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ isPublished: false });
    expect(onSave.mock.calls[0]?.[0].schedule).toBeUndefined();
  });

  it('lets an Admin repair and save a WordQuest target word', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({ content: {} })} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Target word' }), { target: { value: 'ADMIN' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0].content).toMatchObject({ targetWord: 'ADMIN' });
  });

  it('lets an Admin repair and save quiz embedded questions JSON', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({
      title: 'Daily quiz',
      mode: 'quiz',
      content: {},
      embeddedQuestions: [],
    })} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Embedded questions JSON' }), {
      target: { value: '[{"id":"q1","question":"Ready?"}]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0].embeddedQuestions).toEqual([{ id: 'q1', question: 'Ready?' }]);
  });

  it('shows malformed quiz questions JSON and rejects the save', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({
      title: 'Daily quiz',
      mode: 'quiz',
      embeddedQuestions: [],
    })} onSave={onSave} onCancel={vi.fn()} />);

    const questions = screen.getByRole('textbox', { name: 'Embedded questions JSON' });
    fireEvent.change(questions, {
      target: { value: '{not-json' },
    });

    expect(questions).toHaveAttribute('aria-invalid', 'true');
    expect(questions).toHaveAttribute('aria-describedby', 'game-embedded-questions-error');
    expect(document.getElementById('game-embedded-questions-error')).toHaveTextContent('Embedded questions must be a valid JSON array.');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Embedded questions must be a valid JSON array.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('initializes legacy questions and deliberately migrates them to embeddedQuestions on save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const legacyQuestions = [{ id: 'legacy-q1', question: 'Legacy ready?' }];
    render(<GameEditor game={wordQuestGame({
      title: 'Legacy quiz',
      mode: 'quiz',
      embeddedQuestions: undefined,
      questions: legacyQuestions,
    })} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Embedded questions JSON' })).toHaveValue(JSON.stringify(legacyQuestions, null, 2));
    expect(screen.queryByText('Quiz needs at least one question.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      embeddedQuestions: legacyQuestions,
      questions: [],
    });
  });

  it('preserves daily cadence while editing and saving a daily quiz schedule', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({
      title: 'Cadenced quiz',
      mode: 'quiz',
      embeddedQuestions: [{ id: 'q1', question: 'Ready?' }],
      schedule: {
        startDateTime: new Date('2026-08-19T18:30:00.000Z'),
        endDateTime: new Date('2026-08-20T18:30:00.000Z'),
        cadence: 'daily',
      },
    })} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0].schedule).toMatchObject({ cadence: 'daily' });
  });

  it.each([
    ['wordquest', { content: { targetWord: 'ADMIN' }, embeddedQuestions: [] }],
    ['quiz', { content: {}, embeddedQuestions: [{ id: 'q1', question: 'Ready?' }] }],
  ])('displays and saves a valid IST midnight %s schedule independent of browser timezone', async (mode, playableContent) => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<GameEditor game={wordQuestGame({ mode, ...playableContent })} onSave={onSave} onCancel={vi.fn()} />);
    const dateInputs = [
      screen.getByLabelText('Start date and time (Asia/Kolkata)'),
      screen.getByLabelText('End date and time (Asia/Kolkata)'),
    ] as HTMLInputElement[];

    expect(Array.from(dateInputs, (input) => input.value)).toEqual(['2026-08-20T00:00', '2026-08-21T00:00']);
    fireEvent.change(dateInputs[0], { target: { value: '2026-08-21T00:00' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-08-22T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0]?.[0].schedule).toEqual({
      startDateTime: new Date('2026-08-20T18:30:00.000Z'),
      endDateTime: new Date('2026-08-21T18:30:00.000Z'),
    });
  });

  it('keeps unparseable persisted timestamps blank and rejects a published save', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<GameEditor game={wordQuestGame({
      schedule: { startDateTime: 'not-a-date', endDateTime: 'also-not-a-date' },
    })} onSave={onSave} onCancel={vi.fn()} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');

    expect(Array.from(dateInputs, (input) => input.value)).toEqual(['', '']);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Fix the publication readiness errors');
    expect(onSave).not.toHaveBeenCalled();
  });
});
