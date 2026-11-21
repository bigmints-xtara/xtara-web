import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface ManageSubjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSubjects: string[];
    allSubjects: string[];
    onSave: (subjects: string[]) => Promise<void>;
}

export default function ManageSubjectsModal({
    isOpen,
    onClose,
    currentSubjects,
    allSubjects,
    onSave,
}: ManageSubjectsModalProps) {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(currentSubjects);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync selectedSubjects with currentSubjects when modal opens or currentSubjects changes
    useEffect(() => {
        if (isOpen) {
            setSelectedSubjects(currentSubjects);
            setError(null);
        }
    }, [isOpen, currentSubjects]);

    if (!isOpen) return null;

    const toggleSubject = (subject: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subject)
                ? prev.filter(s => s !== subject)
                : [...prev, subject]
        );
    };

    const handleSave = async () => {
        if (selectedSubjects.length === 0) {
            setError("Please select at least one subject");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(selectedSubjects);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-lg bg-[#0f172c] border border-white/10 rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#0f172c] pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Manage Subjects</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Close dialog"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        <X size={20} className="text-gray-400" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {allSubjects.map((subject) => {
                        const isSelected = selectedSubjects.includes(subject);
                        return (
                            <Button variant="surface"
                                key={subject}
                                onClick={() => toggleSubject(subject)}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected
                                        ? 'border-teal-400 bg-teal-400/10 text-white'
                                        : 'border-white/10 bg-[#12192E] text-gray-300 hover:border-white/20'
                                    }`}
                                disabled={isSaving}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-teal-400 border-teal-400' : 'border-white/30'
                                        }`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{subject}</span>
                                </div>
                            </Button>
                        );
                    })}
                </div>

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
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
