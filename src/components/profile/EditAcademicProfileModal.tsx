import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { X } from "lucide-react";
import { useState } from "react";

interface EditAcademicProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBoard?: string;
    currentGrade?: string;
    currentStream?: string;
    onSave: (board: string, grade: string, stream?: string) => Promise<void>;
}

export default function EditAcademicProfileModal({
    isOpen,
    onClose,
    currentBoard,
    currentGrade,
    currentStream,
    onSave,
}: EditAcademicProfileModalProps) {
    const [educationBoard, setEducationBoard] = useState(currentBoard || "");
    const [grade, setGrade] = useState(currentGrade || "");
    const [stream, setStream] = useState(currentStream || "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!educationBoard || !grade) {
            setError("Board and Grade are required");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(educationBoard, grade, (grade === "grade11" || grade === "grade12") ? stream : undefined);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-[#0f172c] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Edit Academic Profile</h2>
                    <Button variant="ghost" size="icon" aria-label="Close dialog"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        <X size={20} className="text-gray-400" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Education Board <span className="text-red-400">*</span>
                        </label>
                        <NativeSelect
                            value={educationBoard}
                            onChange={(e) => setEducationBoard(e.target.value)}
                            className="w-full"
                            disabled={isSaving}
                        >
                            <option value="">Select Board</option>
                            <option value="cbse">CBSE</option>
                            <option value="icse">ICSE</option>
                            <option value="state">State Board</option>
                            <option value="ib">IB</option>
                            <option value="igcse">IGCSE</option>
                        </NativeSelect>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Current Grade <span className="text-red-400">*</span>
                        </label>
                        <NativeSelect
                            value={grade}
                            onChange={(e) => {
                                setGrade(e.target.value);
                                if (e.target.value === "grade10") setStream("");
                            }}
                            className="w-full"
                            disabled={isSaving}
                        >
                            <option value="">Select Grade</option>
                            <option value="grade8">Class 8</option>
                        <option value="grade9">Class 9</option>
                        <option value="grade10">Class 10</option>
                        <option value="grade11">Class 11</option>
                            <option value="grade12">Class 12</option>
                        </NativeSelect>
                    </div>

                    {(grade === "grade11" || grade === "grade12") && (
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">
                                Stream
                            </label>
                            <NativeSelect
                                value={stream}
                                onChange={(e) => setStream(e.target.value)}
                                className="w-full"
                                disabled={isSaving}
                            >
                                <option value="">Select Stream</option>
                                <option value="science">Science</option>
                                <option value="commerce">Commerce</option>
                                <option value="arts">Arts/Humanities</option>
                            </NativeSelect>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
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
