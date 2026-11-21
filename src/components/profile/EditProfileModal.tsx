import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useState } from "react";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    currentDisplayName?: string;
    onSave: (fullName: string, displayName: string) => Promise<void>;
}

export default function EditProfileModal({
    isOpen,
    onClose,
    currentName,
    currentDisplayName,
    onSave,
}: EditProfileModalProps) {
    const [fullName, setFullName] = useState(currentName);
    const [displayName, setDisplayName] = useState(currentDisplayName || "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!fullName.trim()) {
            setError("Full name is required");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(fullName.trim(), displayName.trim());
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
                    <h2 className="text-xl font-bold text-white">Edit Personal Information</h2>
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
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <Input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-background text-foreground"
                            placeholder="Enter your full name"
                            disabled={isSaving}
 />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Display Name (Optional)
                        </label>
                        <Input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-background text-foreground"
                            placeholder="How you'd like to be called"
                            disabled={isSaving}
 />
                    </div>

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
