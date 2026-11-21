'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { AdminCareerPath } from '@/types/admin';
import { formatSnakeCaseToTitleCase } from '@/lib/utils';

interface CareerPathEditorProps {
  careerPath: AdminCareerPath | null;
  onSave: (data: Partial<AdminCareerPath>) => Promise<void>;
  onCancel: () => void;
}

// Editable fields for CareerPath
interface EditableFields {
  title: string;
  description: string;
  whatYouDo: string;
  whyItMatters: string;
  matchReasoning: string;
}

const EMPTY_EDITABLE: EditableFields = {
  title: '',
  description: '',
  whatYouDo: '',
  whyItMatters: '',
  matchReasoning: '',
};

export default function CareerPathEditor({ careerPath, onSave, onCancel }: CareerPathEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EditableFields>(() => {
    if (careerPath) {
      return {
        title: careerPath.title || '',
        description: careerPath.description || '',
        whatYouDo: careerPath.whatYouDo || '',
        whyItMatters: careerPath.whyItMatters || '',
        matchReasoning: careerPath.matchReasoning || '',
      };
    }
    return EMPTY_EDITABLE;
  });

  const isCreating = !careerPath;
  const [prevId, setPrevId] = useState<string | null>(careerPath?.id || null);

  if (careerPath?.id !== prevId) {
    setPrevId(careerPath?.id || null);
    setFormData(
      careerPath
        ? {
            title: careerPath.title || '',
            description: careerPath.description || '',
            whatYouDo: careerPath.whatYouDo || '',
            whyItMatters: careerPath.whyItMatters || '',
            matchReasoning: careerPath.matchReasoning || '',
          }
        : EMPTY_EDITABLE
    );
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        whatYouDo: formData.whatYouDo,
        whyItMatters: formData.whyItMatters,
        matchReasoning: formData.matchReasoning,
      });
    } catch (error) {
      alert(
        `Error saving career path: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!careerPath) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-xl mb-2">Select a career path to view details.</p>
          <p className="text-sm">
            Choose a career path from the list or create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {isCreating ? 'Create Career Path' : 'Career Path Details'}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost"
            type="button"
            onClick={onCancel}
          >
            <X size={18} />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Career Overview - Read Only */}
        <section className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Career Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">User ID</p>
              <p className="text-sm font-medium mt-1">{careerPath?.userId || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Career</p>
              <p className="text-sm font-medium mt-1">
                {careerPath?.careerName || '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Match Score</p>
              <p className="text-sm font-medium mt-1">
                {careerPath?.matchScore ?? '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Expected Salary Range
              </p>
              <p className="text-sm font-medium mt-1">
                {careerPath?.expectedSalaryRange || '—'}
              </p>
            </div>
          </div>
        </section>

        {/* Editable Fields */}
        <section className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Edit Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full"
                placeholder="Enter career title"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full"
                placeholder="Enter description"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                What You Do
              </label>
              <Textarea
                value={formData.whatYouDo}
                onChange={(e) => setFormData({ ...formData, whatYouDo: e.target.value })}
                rows={3}
                className="w-full"
                placeholder="Describe the day-to-day responsibilities"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Why It Matters
              </label>
              <Textarea
                value={formData.whyItMatters}
                onChange={(e) => setFormData({ ...formData, whyItMatters: e.target.value })}
                rows={3}
                className="w-full"
                placeholder="Explain the impact of this career"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Match Reasoning
              </label>
              <Textarea
                value={formData.matchReasoning}
                onChange={(e) =>
                  setFormData({ ...formData, matchReasoning: e.target.value })
                }
                rows={3}
                className="w-full"
                placeholder="Why this career is a good match"
 />
            </div>
          </div>
        </section>

        {/* Profile - Read Only Badge Chips */}
        <section className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Profile</h3>
          <div className="space-y-4">
            {careerPath?.strengths && careerPath.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {careerPath.strengths.map((item, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                    >
                      {formatSnakeCaseToTitleCase(item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {careerPath?.archetypes && careerPath.archetypes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Archetypes</p>
                <div className="flex flex-wrap gap-2">
                  {careerPath.archetypes.map((item, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full"
                    >
                      {formatSnakeCaseToTitleCase(item)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {careerPath?.streamSuggestions &&
              careerPath.streamSuggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Stream Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {careerPath.streamSuggestions.map((item, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                      >
                        {formatSnakeCaseToTitleCase(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {!careerPath?.strengths?.length &&
              !careerPath?.archetypes?.length &&
              !careerPath?.streamSuggestions?.length && (
                <p className="text-sm text-gray-500">No profile data available.</p>
              )}
          </div>
        </section>

        {/* Pathway - Read Only */}
        <section className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Career Pathway</h3>
          {careerPath?.careerPathway && careerPath.careerPathway.length > 0 ? (
            <div className="space-y-3">
              {careerPath.careerPathway.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                >
                  <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.duration}</p>
                    {step.note && (
                      <p className="text-xs text-gray-400 mt-1">{step.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pathway data available.</p>
          )}
        </section>

        {/* Related Careers - Read Only */}
        <section className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Related Careers</h3>
          {careerPath?.relatedCareers && careerPath.relatedCareers.length > 0 ? (
            <div className="space-y-2">
              {careerPath.relatedCareers.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No related careers data available.</p>
          )}
        </section>
      </div>
    </form>
  );
}
