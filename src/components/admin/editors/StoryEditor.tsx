'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
                            <Input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full"
                                placeholder="Enter story title"
 />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full"
                                placeholder="Enter story description"
 />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <Input
                                type="url"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full"
                                placeholder="https://example.com/image.jpg"
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

                <ContentTagEditor value={formData} onChange={(tags) => setFormData((current) => ({ ...current, ...tags }))} />

                {/* Flags */}
                <div className="bg-white rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold mb-4">Options</h3>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2">
                            <Input
                                type="checkbox"
                                checked={formData.featured || false}
                                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
 />
                            <span className="text-sm">Featured Story</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <Input
                                type="checkbox"
                                checked={formData.byXtara || false}
                                onChange={(e) => setFormData({ ...formData, byXtara: e.target.checked })}
 />
                            <span className="text-sm">By Xtara</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <Input
                                type="checkbox"
                                checked={formData.ad || false}
                                onChange={(e) => setFormData({ ...formData, ad: e.target.checked })}
 />
                            <span className="text-sm">Advertisement</span>
                        </label>
                    </div>
                </div>

                {/* Slides */}
                <div className="bg-white rounded-lg p-6 border">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div><h3 className="text-lg font-semibold">Slides</h3><p className="text-sm text-gray-600">Build the story sequence shown to learners.</p></div>
                        <Button variant="outline" onClick={addSlide} type="button"><Plus size={16} />Add slide</Button>
                    </div>
                    {!formData.slides?.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-gray-500">No slides added. The story can remain a summary-only draft.</p> : null}
                    <div className="space-y-4">
                        {formData.slides?.map((slide, index) => (
                            <div className="rounded-lg border p-4" key={`slide-${index}`}>
                                <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Slide {index + 1}</p><Button variant="destructive" aria-label={`Remove slide ${index + 1}`} onClick={() => removeSlide(index)} type="button"><Trash2 size={15} />Remove</Button></div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-medium">Title<Input aria-label={`Slide ${index + 1} title`} className="mt-1 w-full" onChange={(event) => updateSlide(index, { title: event.target.value })} value={slide.title} /></label>
                                    <label className="text-sm font-medium">Date<Input aria-label={`Slide ${index + 1} date`} className="mt-1 w-full" onChange={(event) => updateSlide(index, { date: event.target.value })} type="date" value={slide.date || ''} /></label>
                                    <label className="text-sm font-medium md:col-span-2">Description<Textarea aria-label={`Slide ${index + 1} description`} className="mt-1 w-full" onChange={(event) => updateSlide(index, { description: event.target.value })} rows={3} value={slide.description} /></label>
                                    <label className="text-sm font-medium">Image URL<Input aria-label={`Slide ${index + 1} image URL`} className="mt-1 w-full" onChange={(event) => updateSlide(index, { image: event.target.value })} type="url" value={slide.image || ''} /></label>
                                    <label className="text-sm font-medium">Destination URL<Input aria-label={`Slide ${index + 1} destination URL`} className="mt-1 w-full" onChange={(event) => updateSlide(index, { hyperlink: event.target.value })} type="url" value={slide.hyperlink || ''} /></label>
                                    <label className="text-sm font-medium">Link label<Input aria-label={`Slide ${index + 1} link label`} className="mt-1 w-full" onChange={(event) => updateSlide(index, { hyperlinkText: event.target.value })} value={slide.hyperlinkText || ''} /></label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </form>
    );
}
