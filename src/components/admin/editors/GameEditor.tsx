'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { GameInstance } from '@/types/admin';

interface GameEditorProps {
  game: GameInstance | null;
  onSave: (data: Partial<GameInstance>) => Promise<void>;
  onCancel: () => void;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function gameForm(game: GameInstance | null, referenceDate: Date): Partial<GameInstance> {
  if (game) {
    return {
      ...game,
      schedule: {
        startDateTime: game.schedule?.startDateTime ? new Date(game.schedule.startDateTime) : referenceDate,
        endDateTime: game.schedule?.endDateTime
          ? new Date(game.schedule.endDateTime)
          : new Date(referenceDate.getTime() + ONE_WEEK_MS),
      },
    };
  }

  return {
    title: '',
    mode: 'quiz',
    isPublished: false,
    schedule: {
      startDateTime: referenceDate,
      endDateTime: new Date(referenceDate.getTime() + ONE_WEEK_MS),
    },
  };
}

export default function GameEditor({ game, onSave, onCancel }: GameEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<GameInstance>>(() => gameForm(game, new Date()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await onSave(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save this game');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date || isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleDateChange = (field: 'startDateTime' | 'endDateTime', value: string) => {
    setFormData({
      ...formData,
      schedule: {
        ...(formData.schedule || { startDateTime: new Date(), endDateTime: new Date() }),
        [field]: value ? new Date(value) : new Date(),
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
                <option value="puzzle">Puzzle</option>
                <option value="memory">Memory</option>
              </select>
            </div>

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

        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Scheduling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formatDateForInput(formData.schedule?.startDateTime)}
                onChange={(e) => handleDateChange('startDateTime', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                End Date Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formatDateForInput(formData.schedule?.endDateTime)}
                onChange={(e) => handleDateChange('endDateTime', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
