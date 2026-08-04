'use client';

import { useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import type { Story, StorySlide } from '@/types/admin';
import { ContentTagEditor } from '@/components/admin/ContentTagEditor';

interface StoryEditorProps {
    story: Story | null;
    onSave: (data: Partial<Story>) => Promise<void>;
    onCancel: () => void;
}

export default function StoryEditor({ story, onSave, onCancel }: StoryEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<Partial<Story>>(() => ({
        title: story?.title || '',
        description: story?.description || '',
        image: story?.image || '',
        career_clusters: story?.career_clusters || [],
        careerRelevance: story?.careerRelevance || [],
        futureDirectionIds: story?.futureDirectionIds || story?.career_clusters || [],
        dreamCareerIds: story?.dreamCareerIds || story?.careerRelevance || [],
        skillIds: story?.skillIds || [],
        gradeStages: story?.gradeStages || [],
        topics: story?.topics || [],
        slides: story?.slides || [],
        published: story?.published || false,
        draft: story?.draft ?? true,
        inReview: story?.inReview || false,
        featured: story?.featured || false,
        ad: story?.ad || false,
        byXtara: story?.byXtara ?? true,
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            await onSave(formData);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unable to save this story');
        } finally {
            setIsSaving(false);
        }
    };

    const addSlide = () => setFormData((current) => ({
        ...current,
        slides: [...(current.slides || []), { title: '', description: '' }],
    }));

    const updateSlide = (index: number, patch: Partial<StorySlide>) => setFormData((current) => ({
        ...current,
        slides: (current.slides || []).map((slide, slideIndex) => slideIndex === index ? { ...slide, ...patch } : slide),
    }));

    const removeSlide = (index: number) => setFormData((current) => ({
        ...current,
        slides: (current.slides || []).filter((_, slideIndex) => slideIndex !== index),
    }));

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

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-white flex items-center justify-between">
                <h2 className="text-xl font-bold">
                    {story ? 'Edit Story' : 'Create New Story'}
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
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter story title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter story description"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com/image.jpg"
                            />
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

                <ContentTagEditor value={formData} onChange={(tags) => setFormData((current) => ({ ...current, ...tags }))} />

                {/* Flags */}
                <div className="bg-white rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold mb-4">Options</h3>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.featured || false}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm">Featured Story</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.byXtara || false}
                                onChange={(e) => setFormData({ ...formData, byXtara: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm">By Xtara</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.ad || false}
                                onChange={(e) => setFormData({ ...formData, ad: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm">Advertisement</span>
                        </label>
                    </div>
                </div>

                {/* Slides */}
                <div className="bg-white rounded-lg p-6 border">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div><h3 className="text-lg font-semibold">Slides</h3><p className="text-sm text-gray-600">Build the story sequence shown to learners.</p></div>
                        <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50" onClick={addSlide} type="button"><Plus size={16} />Add slide</button>
                    </div>
                    {!formData.slides?.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">No slides added. The story can remain a summary-only draft.</p> : null}
                    <div className="space-y-4">
                        {formData.slides?.map((slide, index) => (
                            <div className="rounded-lg border p-4" key={`slide-${index}`}>
                                <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Slide {index + 1}</p><button aria-label={`Remove slide ${index + 1}`} className="flex items-center gap-1 text-sm text-red-600" onClick={() => removeSlide(index)} type="button"><Trash2 size={15} />Remove</button></div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-medium">Title<input aria-label={`Slide ${index + 1} title`} className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => updateSlide(index, { title: event.target.value })} value={slide.title} /></label>
                                    <label className="text-sm font-medium">Date<input aria-label={`Slide ${index + 1} date`} className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => updateSlide(index, { date: event.target.value })} type="date" value={slide.date || ''} /></label>
                                    <label className="text-sm font-medium md:col-span-2">Description<textarea aria-label={`Slide ${index + 1} description`} className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => updateSlide(index, { description: event.target.value })} rows={3} value={slide.description} /></label>
                                    <label className="text-sm font-medium">Image URL<input aria-label={`Slide ${index + 1} image URL`} className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => updateSlide(index, { image: event.target.value })} type="url" value={slide.image || ''} /></label>
                                    <label className="text-sm font-medium">Destination URL<input aria-label={`Slide ${index + 1} destination URL`} className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => updateSlide(index, { hyperlink: event.target.value })} type="url" value={slide.hyperlink || ''} /></label>
                                    <label className="text-sm font-medium">Link label<input aria-label={`Slide ${index + 1} link label`} className="mt-1 w-full rounded-lg border px-3 py-2" onChange={(event) => updateSlide(index, { hyperlinkText: event.target.value })} value={slide.hyperlinkText || ''} /></label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </form>
    );
}
