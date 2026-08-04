'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { Spark } from '@/types/admin';
import { formatSnakeCaseToTitleCase } from '@/lib/utils';
import { ContentTagEditor } from '@/components/admin/ContentTagEditor';

interface SparkEditorProps {
  spark: Spark | null;
  onSave: (data: Partial<Spark>) => Promise<void>;
  onCancel: () => void;
}

export default function SparkEditor({ spark, onSave, onCancel }: SparkEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<Partial<Spark>>(() => ({
        title: spark?.title || '',
        type: spark?.type || '',
        published: spark?.published || false,
        draft: spark?.draft ?? true,
        inReview: spark?.inReview || false,
        futureDirectionIds: spark?.futureDirectionIds || spark?.careerClusters || [],
        dreamCareerIds: spark?.dreamCareerIds || spark?.careerRelevance || [],
        skillIds: spark?.skillIds || [],
        gradeStages: spark?.gradeStages || [],
        topics: spark?.topics || [],
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            await onSave(formData);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unable to save this spark');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatus = () => {
        if (formData.published) return 'published';
        if (formData.inReview) return 'inReview';
        return 'draft';
    };

    const typeValue = formData.type || '';

    const setStatus = (status: string) => {
        setFormData({
            ...formData,
            published: status === 'published',
            draft: status === 'draft',
            inReview: status === 'inReview',
        });
    };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-white flex items-center justify-between">
                <h2 className="text-xl font-bold">
                    {spark ? 'Edit Spark' : 'Create New Spark'}
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
                <ContentTagEditor value={formData} onChange={(tags) => setFormData((current) => ({ ...current, ...tags }))} />
            </div>

            {error ? <p role="alert" className="shrink-0 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</p> : null}

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

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
                                placeholder="Enter spark title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    required
                                    value={typeValue}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. motivation, fact, tip"
                                />
                                {typeValue && (
                                    <p className="text-xs text-gray-500">
                                        Preview: <span className="font-medium text-blue-600">{formatSnakeCaseToTitleCase(typeValue)}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={getStatus()}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="draft">Draft</option>
                                <option value="inReview">In Review</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
