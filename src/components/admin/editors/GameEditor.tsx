'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { getGamePublicationIssues } from '@/lib/admin/configs/gamesConfig';
import type { GameInstance } from '@/types/admin';

interface GameEditorProps {
  game: GameInstance | null;
  onSave: (data: Partial<GameInstance>) => Promise<void>;
  onCancel: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const INDIA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function gameForm(game: GameInstance | null, referenceDate: Date): Partial<GameInstance> {
  if (game) {
    const startDateTime = parseDate(game.schedule?.startDateTime);
    const endDateTime = parseDate(game.schedule?.endDateTime);
    return {
      ...game,
      schedule: game.schedule ? { ...game.schedule, startDateTime, endDateTime } : undefined,
    };
  }

  const startDateTime = startOfIndiaDay(referenceDate);
  return {
    title: '',
    mode: 'quiz',
    isPublished: false,
    schedule: {
      startDateTime,
      endDateTime: new Date(startDateTime.getTime() + DAY_MS),
    },
  };
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateForIndiaInput(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 16);
}

function parseIndiaInput(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}:00.000+05:30`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function startOfIndiaDay(referenceDate: Date): Date {
  const indiaDate = new Date(referenceDate.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
  return parseIndiaInput(`${indiaDate}T00:00`) as Date;
}

function parseEmbeddedQuestions(value: string): {
  questions: Array<Record<string, unknown>>;
  error: string;
} {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
      return { questions: [], error: 'Embedded questions must be a valid JSON array.' };
    }
    return { questions: parsed as Array<Record<string, unknown>>, error: '' };
  } catch {
    return { questions: [], error: 'Embedded questions must be a valid JSON array.' };
  }
}

function initialQuestions(game: GameInstance | null): Array<Record<string, unknown>> {
  if (game?.embeddedQuestions?.length) return game.embeddedQuestions;
  if (game?.questions?.length) return game.questions;
  return game?.embeddedQuestions || game?.questions || [];
}

export default function GameEditor({ game, onSave, onCancel }: GameEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<GameInstance>>(() => gameForm(game, new Date()));
  const [questionsText, setQuestionsText] = useState(() => JSON.stringify(initialQuestions(game), null, 2));
  const parsedQuestions = parseEmbeddedQuestions(questionsText);
  const submissionData = formData.mode === 'quiz' && !parsedQuestions.error
    ? { ...formData, embeddedQuestions: parsedQuestions.questions, questions: [] }
    : formData;
  const publicationIssues = getGamePublicationIssues(submissionData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.mode === 'quiz' && parsedQuestions.error) {
      setError(parsedQuestions.error);
      return;
    }

    if (formData.isPublished && publicationIssues.length > 0) {
      setError('Fix the publication readiness errors before saving this game as published.');
      return;
    }

    setIsSaving(true);

    try {
      await onSave(submissionData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save this game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (field: 'startDateTime' | 'endDateTime', value: string) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [field]: parseIndiaInput(value),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {game ? 'Edit Game' : 'Create New Game'}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error ? <p role="alert" className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</p> : null}

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Game Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter game title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as GameInstance['mode'] })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="quiz">Quiz</option>
                <option value="wordquest">WordQuest</option>
                <option value="puzzle">Puzzle</option>
                <option value="memory">Memory</option>
                <option value="simulation">Simulation</option>
              </select>
            </div>

            <label className="block text-sm font-medium" htmlFor="game-template-id">
              Template ID (optional)
              <input
                id="game-template-id"
                className="mt-1 w-full rounded-lg border px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(event) => setFormData({
                  ...formData,
                  templateId: event.target.value.trim() ? event.target.value : null,
                })}
                value={formData.templateId || ''}
              />
            </label>

            {formData.templateId ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Template IDs are verified only by the server. Keep embedded playable content and clear or replace stale IDs.
              </p>
            ) : null}

            {formData.mode === 'wordquest' ? (
              <label className="block text-sm font-medium" htmlFor="game-target-word">
                Target word
                <input
                  id="game-target-word"
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-normal uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(event) => setFormData({
                    ...formData,
                    content: { ...formData.content, targetWord: event.target.value.toUpperCase() },
                  })}
                  value={typeof formData.content?.targetWord === 'string' ? formData.content.targetWord : ''}
                />
              </label>
            ) : null}

            {formData.mode === 'quiz' ? (
              <label className="block text-sm font-medium" htmlFor="game-embedded-questions">
                Embedded questions JSON
                <textarea
                  id="game-embedded-questions"
                  className="mt-1 min-h-40 w-full rounded-lg border px-3 py-2 font-mono text-xs font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby={parsedQuestions.error ? 'game-embedded-questions-error' : undefined}
                  aria-invalid={parsedQuestions.error ? true : undefined}
                  onChange={(event) => setQuestionsText(event.target.value)}
                  spellCheck={false}
                  value={questionsText}
                />
                {parsedQuestions.error ? <span className="mt-1 block text-xs text-red-600" id="game-embedded-questions-error">{parsedQuestions.error}</span> : null}
              </label>
            ) : null}

            <div>
              <label className="block text-sm font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.isPublished ? 'published' : 'draft'}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === 'published' })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {publicationIssues.length > 0 ? (
          <div aria-label="Publication readiness" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <h3 className="font-semibold">Not ready to publish</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {publicationIssues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Scheduling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="game-start-date-time">
                Start date and time (Asia/Kolkata)
              </label>
              <input
                id="game-start-date-time"
                type="datetime-local"
                value={formatDateForIndiaInput(formData.schedule?.startDateTime)}
                onChange={(e) => handleDateChange('startDateTime', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="game-end-date-time">
                End date and time (Asia/Kolkata)
              </label>
              <input
                id="game-end-date-time"
                type="datetime-local"
                value={formatDateForIndiaInput(formData.schedule?.endDateTime)}
                onChange={(e) => handleDateChange('endDateTime', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-600">Required for publication. Drafts can be saved without a schedule.</p>
        </div>
      </div>
    </form>
  );
}
