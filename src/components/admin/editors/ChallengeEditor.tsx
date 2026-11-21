'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import type { Challenge, ChallengeQuestion } from '@/types/admin';
import { ContentTagEditor } from '@/components/admin/ContentTagEditor';

interface ChallengeEditorProps {
  challenge: Challenge | null;
  onSave: (data: Partial<Challenge>) => Promise<void>;
  onCancel: () => void;
}

function EmptyQuestion(): ChallengeQuestion {
  return {
    title: '',
    options: ['Option A', 'Option B'],
    correctAnswer: 0,
    explanation: '',
  };
}

export default function ChallengeEditor({ challenge, onSave, onCancel }: ChallengeEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Challenge>>(() => ({
    title: challenge?.title || '',
    image: challenge?.image || '',
    domain: challenge?.domain || '',
    published: challenge?.published || false,
    draft: challenge?.draft ?? true,
    inReview: challenge?.inReview || false,
    hyperlink: challenge?.hyperlink || '',
    hyperlinkText: challenge?.hyperlinkText || '',
    callToAction: challenge?.callToAction || '',
    careerRelevance: challenge?.careerRelevance || [],
    futureDirectionIds: challenge?.futureDirectionIds || [],
    dreamCareerIds: challenge?.dreamCareerIds || challenge?.careerRelevance || [],
    skillIds: challenge?.skillIds || [],
    gradeStages: challenge?.gradeStages || [],
    topics: challenge?.topics || [],
    type: challenge?.type || '',
    rewardPerQuestion: challenge?.rewardPerQuestion || 0,
    instructions: challenge?.instructions || '',
    questions: challenge?.questions || [],
    publishedAt: challenge?.publishedAt,
    publishedUntil: challenge?.publishedUntil,
  }));
  const [errors, setErrors] = useState<string[]>([]);

  const getStatus = () => {
    if (formData.published) return 'published';
    if (formData.inReview) return 'inReview';
    return 'draft';
  };

  const setStatus = (status: string) => {
    setFormData({
      ...formData,
      published: status === 'published',
      draft: status === 'draft',
      inReview: status === 'inReview',
    });
  };

  const addQuestion = () => {
    const questions = formData.questions || [];
    setFormData({
      ...formData,
      questions: [...questions, EmptyQuestion()],
    });
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions?.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index: number, updates: Partial<ChallengeQuestion>) => {
    if (!formData.questions) return;
    const updated = formData.questions.map((q, i) =>
      i === index ? { ...q, ...updates } : q
    );
    setFormData({ ...formData, questions: updated });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!formData.questions) return;
    const updated = formData.questions.map((q, qi) => {
      if (qi === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setFormData({ ...formData, questions: updated });
  };

  const addOption = (questionIndex: number) => {
    if (!formData.questions) return;
    const updated = formData.questions.map((q, qi) => {
      if (qi === questionIndex && q.options.length < 4) {
        return { ...q, options: [...q.options, 'New Option'] };
      }
      return q;
    });
    setFormData({ ...formData, questions: updated });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (!formData.questions) return;
    const updated = formData.questions.map((q, qi) => {
      if (qi === questionIndex && q.options.length > 2) {
        const newOptions = q.options.filter((_, oi) => oi !== optionIndex);
        const newCorrectAnswer = q.correctAnswer >= optionIndex && q.correctAnswer > 0
          ? q.correctAnswer - 1
          : q.correctAnswer > 0 ? 0 : 0;
        return { ...q, options: newOptions, correctAnswer: Math.min(newCorrectAnswer, newOptions.length - 1) };
      }
      return q;
    });
    setFormData({ ...formData, questions: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!formData.title?.trim()) validationErrors.push('Title is required');
    if (formData.rewardPerQuestion !== undefined && formData.rewardPerQuestion < 0) {
      validationErrors.push('Reward per question must be 0 or greater');
    }
    if (formData.questions) {
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        if (!q.title?.trim()) {
          validationErrors.push(`Question ${i + 1}: Title is required`);
        }
        if (q.options.length < 2) {
          validationErrors.push(`Question ${i + 1}: At least 2 options are required`);
        }
        if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          validationErrors.push(`Question ${i + 1}: Correct answer index out of range`);
        }
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      setErrors([`Error saving: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {challenge ? 'Edit Challenge' : 'Create New Challenge'}
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
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-medium text-red-800 mb-1">Validation Errors:</p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full"
                placeholder="Enter challenge title"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                type="url"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full"
                placeholder="https://example.com/image.jpg"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Domain</label>
              <Input
                type="text"
                value={formData.domain || ''}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full"
                placeholder="e.g., finance, marketing, design"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Input
                type="text"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full"
                placeholder="e.g., quiz, trivia"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <NativeSelect
                value={getStatus()}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full"
              >
                <option value="draft">Draft</option>
                <option value="inReview">In Review</option>
                <option value="published">Published</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Instructions <span className="text-red-500">*</span>
              </label>
              <Textarea
                required
                value={formData.instructions || ''}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
                className="w-full"
                placeholder="Enter challenge instructions"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hyperlink</label>
              <Input
                type="url"
                value={formData.hyperlink || ''}
                onChange={(e) => setFormData({ ...formData, hyperlink: e.target.value })}
                className="w-full"
                placeholder="https://example.com/link"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hyperlink Text</label>
              <Input
                type="text"
                value={formData.hyperlinkText || ''}
                onChange={(e) => setFormData({ ...formData, hyperlinkText: e.target.value })}
                className="w-full"
                placeholder="Click here"
 />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Call to Action</label>
              <Input
                type="text"
                value={formData.callToAction || ''}
                onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                className="w-full"
                placeholder="Start Challenge"
 />
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Scoring</h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              Reward Per Question <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={formData.rewardPerQuestion ?? 0}
              onChange={(e) => setFormData({ ...formData, rewardPerQuestion: parseInt(e.target.value, 10) || 0 })}
              className="w-full"
              placeholder="5"
 />
          </div>
        </div>

        <ContentTagEditor value={formData} onChange={(tags) => setFormData((current) => ({ ...current, ...tags }))} />

        {/* Schedule */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Schedule</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Published From</label>
              <Input
                type="datetime-local"
                value={formData.publishedAt ? new Date(formData.publishedAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value) : undefined;
                  setFormData({ ...formData, publishedAt: val });
                }}
                className="w-full"
 />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Published Until</label>
              <Input
                type="datetime-local"
                value={formData.publishedUntil ? new Date(formData.publishedUntil).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value) : undefined;
                  setFormData({ ...formData, publishedUntil: val });
                }}
                className="w-full"
 />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Questions</h3>
            <Button variant="outline"
              type="button"
              onClick={addQuestion}
            >
              <Plus size={16} />
              Add Question
            </Button>
          </div>

          <div className="space-y-6">
            {formData.questions?.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-700">Question {qIndex + 1}</span>
                  <Button variant="destructive"
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 size={14} />
                    Remove
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    type="text"
                    value={question.title}
                    onChange={(e) => updateQuestion(qIndex, { title: e.target.value })}
                    className="w-full"
                    placeholder="Enter question"
 />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2 mb-2">
                      <Input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="flex-1"
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
 />
                      {question.options.length > 2 && (
                        <Button variant="ghost" size="icon" aria-label={`Remove option ${oIndex + 1}`}
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          title="Remove option"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {question.options.length < 4 && (
                    <Button variant="link"
                      type="button"
                      onClick={() => addOption(qIndex)}
                    >
                      + Add Option
                    </Button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Correct Answer (Index 0-{question.options.length - 1})
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={question.options.length - 1}
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, { correctAnswer: parseInt(e.target.value, 10) || 0 })}
                    className="w-full"
 />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Explanation</label>
                  <Textarea
                    value={question.explanation}
                    onChange={(updateVal) => updateQuestion(qIndex, { explanation: updateVal.target.value })}
                    rows={2}
                    className="w-full"
                    placeholder="Explain the correct answer"
 />
                </div>
              </div>
            ))}

            {(!formData.questions || formData.questions.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                {'No questions added yet. Click "Add Question" to get started.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
