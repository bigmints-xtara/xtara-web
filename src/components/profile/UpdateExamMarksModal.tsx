import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface UpdateExamMarksModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: string[];
    currentMarks?: Record<string, number>;
    onSave: (marks: Record<string, number>) => Promise<void>;
}

export default function UpdateExamMarksModal({
    isOpen,
    onClose,
    subjects,
    currentMarks = {},
    onSave,
}: UpdateExamMarksModalProps) {
    const [marks, setMarks] = useState<Record<string, number>>(currentMarks);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync marks with currentMarks when modal opens or currentMarks changes
    useEffect(() => {
        if (isOpen) {
            setMarks(currentMarks);
            setError(null);
        }
    }, [isOpen, currentMarks]);

    if (!isOpen) return null;

    const handleMarkChange = (subject: string, value: number) => {
        setMarks(prev => ({
            ...prev,
            [subject]: value
        }));
    };

    const handleSave = async () => {
        // Validate that all subjects have marks
        const hasAllMarks = subjects.every(subject => marks[subject] !== undefined && marks[subject] >= 0);
        if (!hasAllMarks) {
            setError("Please set marks for all subjects (0-100)");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(marks);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const getPerformanceColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-[#0f172c] border border-white/10 rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#0f172c] pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Update exam performance</h2>
                        <p className="text-sm text-gray-400 mt-1">Drag sliders to set marks (0-100)</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Close dialog"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        <X size={20} className="text-gray-400" />
                    </Button>
                </div>

                {subjects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400">No subjects selected. Please add subjects first.</p>
                    </div>
                ) : (
                    <div className="space-y-6 mb-6">
                        {subjects.map((subject) => {
                            const currentMark = marks[subject] || 0;
                            const colorClass = getPerformanceColor(currentMark);

                            return (
                                <div key={subject} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-white">
                                            {subject}
                                        </label>
                                        <span className="text-lg font-bold text-white">
                                            {currentMark}%
                                        </span>
                                    </div>

                                    {/* Slider */}
                                    <div className="relative">
                                        <Input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={currentMark}
                                            onChange={(e) => handleMarkChange(subject, parseInt(e.target.value))}
                                            className="slider"
                                            style={{
                                                background: `linear-gradient(to right, ${currentMark >= 80 ? '#10b981' :
                                                        currentMark >= 60 ? '#3b82f6' :
                                                            currentMark >= 40 ? '#eab308' : '#f97316'
                                                    } ${currentMark}%, #12192E ${currentMark}%)`
                                            }}
                                            disabled={isSaving}
 />
                                    </div>

                                    {/* Performance indicator */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                                        <span className="text-gray-400">
                                            {currentMark >= 80 ? 'Excellent' :
                                                currentMark >= 60 ? 'Good' :
                                                    currentMark >= 40 ? 'Average' : 'Needs improvement'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-400 mb-4">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <Button variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || subjects.length === 0}
                    >
                        {isSaving ? "Saving..." : "Save marks"}
                    </Button>
                </div>
            </div>

            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    );
}
